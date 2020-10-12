import knex, {RawBinding, StaticConnectionConfig, ValueDict} from "knex";
import {Bean} from "./bean";
import {isEmptyObject} from "./helper/helper";

export class RedBeanNode {

    protected _freeze = false;
    protected _transaction;
    protected _knex;
    protected dbType;

    get knex() {
        if (this._transaction) {
            return this._transaction;
        }
        return this._knex;
    }

    setup(dbType : string | knex = 'sqlite', connection : StaticConnectionConfig = { filename: './dbfile.db' }) {
        if (typeof dbType === "string") {

            if (dbType == "mariadb") {
                dbType = "mysql";
            }

            this.dbType = dbType;

            let useNullAsDefault = (dbType == "sqlite")

            this._knex = knex({
                client: dbType,
                connection,
                useNullAsDefault,
                pool: {
                    min: 2,
                    max: 10,
                    idleTimeoutMillis: 30000,
                }
            });
        } else {
            this._knex = dbType;
        }
    }

    dispense(type) {
        return new Bean(type, this);
    }

    freeze( v = true) {
        this._freeze = v;
    }

    async store(bean: Bean) {
        await bean.storeTypeBeanList();

        if (! this._freeze) {
            await this.updateTableSchema(bean);
        }

        let obj = bean.export(false);
        delete obj.id;

        // Update
        // else insert
        if (bean.id && !isEmptyObject(obj)) {
            await this.knex(bean.getType()).where({ id: bean.id }).update(obj);
        } else {
            let result = await this.knex(bean.getType()).insert(obj);
            bean.id = result[0];
        }

        return bean.id;
    }

    protected async updateTableSchema(bean : Bean) {

        let exists = await this._knex.schema.hasTable(bean.getType());

        if (! exists) {
            console.log("Create table: " + bean.getType());

            await this._knex.schema.createTable(bean.getType(), function (table) {
                table.increments().primary();
            });
        }

        // Don't put it inside callback, causes problem than cannot add columns!
        let columnInfo = await this.inspect(bean.getType());
        //console.log(columnInfo);

        await this._knex.schema.table(bean.getType(), async (table) => {

            let obj = bean.export(false);

            for (let fieldName in obj) {
                let value = obj[fieldName];
                let addField = false;
                let alterField = false;
                let valueType = this.getDataType(value);


                // Check if the field exists in current database
                if (! columnInfo.hasOwnProperty(fieldName)) {
                    addField = true;
                }

                // If exists in current database, but the type is not good for the data
                 else if (! this.isValidType(columnInfo[fieldName].type, valueType)) {
                     console.log(`Alter column is needed: ${fieldName} (dbType: ${columnInfo[fieldName].type}) (valueType: ${valueType})`);
                    addField = true;
                    alterField = true;
                }

                if (addField) {
                    let col;

                    if (valueType == "integer") {
                        console.log("Create field (Int): " + fieldName);
                        col = table.integer(fieldName);

                    } else if (valueType == "float") {
                        console.log("Create field (Float): " + fieldName);
                        col = table.float(fieldName);

                    } else if (valueType == "boolean") {
                        console.log("Create field (Boolean): " + fieldName);
                        col = table.boolean(fieldName);


                    } else if (valueType == "text") {
                        console.log("Create field (Text): " + fieldName);
                        col = table.text(fieldName, "longtext");

                    } else {
                        console.log("Create field (String): " + fieldName);
                        col = table.string(fieldName);
                    }

                    if (alterField) {
                        console.log("This is modify column");
                        col.alter();
                    }
                }
            }
        });
    }

    getDataType(value) {
        let type = typeof value;
        if (type == "number") {
            if (Number.isInteger(value)) {
                return "integer";
            } else {
                return "float";
            }
        } else if (type == "string") {
            if (value.length > 230) {
                return "text";
            } else {
                return "varchar";
            }
        } else {
            return "varchar";
        }
    }

    isValidType(columnType, valueType) {
        if (columnType == "boolean") {
            if (valueType == "integer" || valueType == "float" || valueType == "varchar" || valueType == "text") {
                return false;
            }
        }

        if (columnType == "integer") {
            if (valueType == "float" || valueType == "varchar" || valueType == "text") {
                return false;
            }
        }

        if (columnType == "float") {
            if (valueType == "varchar" || valueType == "text") {
                return false;
            }
        }

        if (columnType == "varchar") {
            if (valueType == "text") {
                return false;
            }
        }

        return true;
    }

    async close() {
        await this.knex.destroy();
    }

    async load(type: string, id: number) {
        let result = await this.knex.select().table(type).whereRaw("id = ?", [
            id
        ]).limit(1);

        if (result.length > 0) {
            return this.convertToBean(type, result[0]);
        } else {
            return null;
        }
    }



    /**
     * TODO: only update the fields which are changed to database
     * @protected
     */
    protected watchBean() {

    }

    async trash(bean: Bean) {
        if (bean.id) {
            await this.knex.table(bean.getType()).where({ id : bean.id }).delete();
            bean.id = 0;
        }
    }

    async trashAll(beans : Bean[]) {
        beans.forEach((bean) => {
            this.trash(bean);
        });
    }

    async find(type: string, clause: string, data : readonly RawBinding[] | ValueDict | RawBinding = []) {
        let list = await this.knex.table(type).whereRaw(clause, data);
        return this.convertToBeans(type, list);
    }

    findAll(type: string, clause: string, data : readonly RawBinding[] | ValueDict | RawBinding = []) {
        return this.find(type, " 1=1 " + clause, data);
    }

    async findOne(type: string, clause: string, data : readonly RawBinding[] | ValueDict | RawBinding = []) {
        let obj = await this.knex.table(type).whereRaw(clause, data).first();

        if (! obj) {
            return null;
        }

        let bean = this.convertToBean(type, obj);

        return bean;
    }

    convertToBean(type : string, obj) : Bean {
        let bean = R.dispense(type);
        bean.import(obj);
        return bean;
    }

    convertToBeans(type : string, objList){
        let list : Bean[] = [];

        objList.forEach((obj) => {
            if (obj != null) {
                list.push(this.convertToBean(type, obj))
            }
        });

        return list;
    }

    async exec(sql: string, data: string[] = []) {
        await this.normalizeRaw(sql, data);
    }

    getAll(sql: string, data: string[] = []) {
        return this.normalizeRaw(sql, data);
    }

    async getRow(sql: string, data: string[] = [], autoLimit = true) {

        if (autoLimit) {
            let limitTemplate = this.knex.limit(1).toSQL().toNative();
            sql = sql + limitTemplate.sql.replace("select *", "");
            data = data.concat(limitTemplate.bindings);
        }

        let result = await this.normalizeRaw(sql, data);

        if (result.length > 0) {
            return result[0];
        } else {
            return null;
        }
    }

    async normalizeRaw(sql, data) {
        let result = await this.knex.raw(sql, data);

        if (this.dbType == "mysql") {
            result = result[0];
        }

        return result;
    }

    async getCol(sql: string, data: string[] = []) {
        let list = await this.getAll(sql, data);
        let key : string;

        return list.map((obj) => {
            if (! key) {
                for (let k in obj) {
                    key = k;
                    break;
                }
            }
            return obj[key];
        });
    }

    async getCell(sql: string, data: string[] = [], autoLimit = true) {
        let row = await this.getRow(sql, data, autoLimit);

        if (row) {
            return Object.values(row)[0];
        } else {
            return null;
        }
    }

    async getAssoc(sql: string, data: string[] = []) {
        let list = await this.getAll(sql, data);
        let keyKey : string;
        let valueKey : string;
        let obj = {};

        if (list.length > 0) {
            let keys = Object.keys(list[0]);
            keyKey = keys[0];
            valueKey = keys[1];

            for (let i = 0; i < list.length; i++) {
                let key = list[i][keyKey];
                let value = list[i][valueKey];
                obj[key] = value;
            }
        }

        return obj;
    }

    inspect(type) {
        return this.knex.table(type).columnInfo();
    }

    async begin() {
        if (! this._freeze) {
            console.warn("Warning: Transaction is not working in non-freeze mode.");
            return;
        }

        if (this._transaction) {
            throw "Previous transaction is not committed";
        }

        this._transaction = await this.knex.transaction();

        return this._transaction;
    }

    async commit() {
        if (this._transaction) {
            await this._transaction.commit();
            this._transaction = null;
        }
    }


    async rollback() {
        if (this._transaction) {
            await this._transaction.rollback();
            this._transaction = null;
        }
    }

    async transaction(callback: () => void) {
        try {
            await this.begin();
            await callback();
            await this.commit();
        } catch (error) {
            await this.rollback();
        }
    }
}

export const R = new RedBeanNode();
