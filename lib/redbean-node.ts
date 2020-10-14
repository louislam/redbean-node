import knex, {RawBinding, StaticConnectionConfig, ValueDict} from "knex";
import {Bean} from "./bean";
import {isEmptyObject} from "./helper/helper";

export class RedBeanNode {

    /**
     * For this library dev only
     */
    public devDebug = false;
    protected _debug = false;

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

    /**
     *
     * @param type
     * @param loadDefaultValue
     */
    dispense(type) {
        return new Bean(type, this);
    }

    freeze( v = true) {
        this._freeze = v;
    }

    debug(v : boolean) {
        this._debug = v;
    }

    async store(bean: Bean) {
        this.devLog("Store", bean.beanMeta.type, bean.id);

        await bean.storeTypeBeanList();

        if (! this._freeze) {
            await this.updateTableSchema(bean);
        }

        let obj = bean.export(false);
        delete obj.id;

        // Update
        // else insert
        if (bean.id && !isEmptyObject(obj)) {
            let queryPromise = this.knex(bean.getType()).where({ id: bean.id }).update(obj);
            this.queryLog(queryPromise);
            await queryPromise;
        } else {
            let queryPromise = this.knex(bean.getType()).insert(obj);
            this.queryLog(queryPromise);
            let result = await queryPromise;
            bean.id = result[0];
        }

        return bean.id;
    }

    protected async updateTableSchema(bean : Bean) {
        this.devLog("Check Update Table Schema");

        if (! this._knex) {
            throw "Error: Please execute R.setup(.....) first.";
        }

        let exists = await this._knex.schema.hasTable(bean.getType());

        if (! exists) {
            console.log("Create table: " + bean.getType());

            await this._knex.schema.createTable(bean.getType(), function (table) {
                table.increments().primary();
            });
        }

        // Don't put it inside callback, causes problem than cannot add columns!
        let columnInfo = await this.inspect(bean.getType());
        //console.devLog(columnInfo);

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
        this.devLog("Load Bean", type, id);

        try {
             let queryPromise = this.knex.select().table(type).whereRaw("id = ?", [
                id
            ]).limit(1);

             this.queryLog(queryPromise);

            let result = await queryPromise;

            if (result.length > 0) {
                return this.convertToBean(type, result[0]);
            } else {
                return null;
            }
        } catch (error) {
            this.checkAllowedError(error);
        }
    }

    protected checkAllowedError(error) {

        if (this.dbType == "sqlite") {
            if (error.errno == 1) {     // No such table
                return;
            }
        } else if (this.dbType == "mysql") {
            if (! error.startsWith("ER_NO_SUCH_TABLE")) {
                return;
            }
        }

        throw error;
    }

    /**
     * TODO: only update the fields which are changed to database
     * @protected
     */
    protected watchBean() {

    }

    async trash(bean: Bean) {
        if (bean.id) {
            let queryPromise = this.knex.table(bean.getType()).where({ id : bean.id }).delete();

            this.queryLog(queryPromise);

            await queryPromise;
            bean.id = 0;
        }
    }

    /**
     * TODO: Concurrent is better
     * @param beans
     */
    async trashAll(beans : Bean[]) {
        for (let bean of beans) {
            await this.trash(bean);
        }
    }

    async find(type: string, clause: string, data : readonly RawBinding[] | ValueDict | RawBinding = []) {
        let queryPromise = this.knex.table(type).whereRaw(clause, data);
        this.queryLog(queryPromise);

        let list = await queryPromise;
        return this.convertToBeans(type, list);
    }

    findAll(type: string, clause: string, data : readonly RawBinding[] | ValueDict | RawBinding = []) {
        return this.find(type, " 1=1 " + clause, data);
    }

    async findOne(type: string, clause: string, data : readonly RawBinding[] | ValueDict | RawBinding = []) {
        let queryPromise = this.knex.table(type).whereRaw(clause, data).first();
        this.queryLog(queryPromise);

        let obj = await queryPromise;

        if (! obj) {
            return null;
        }

        let bean = this.convertToBean(type, obj);

        return bean;
    }

    convertToBean(type : string, obj) : Bean {
        this.devLog("convertToBean", type, obj);

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

        this.queryLog(sql);

        let result = await this.normalizeRaw(sql, data);

        if (result.length > 0) {
            return result[0];
        } else {
            return null;
        }
    }

    async normalizeRaw(sql, data) {
        let result = await this.knex.raw(sql, data);

        this.queryLog(sql);

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

    protected devLog(...params : any[]) {
        if (this.devDebug) {
            console.log("[R]", ...params);
        }
    }

    protected queryLog(queryPromise : string | Promise<any>) {
        if (this._debug) {
            let sql;

            if (typeof queryPromise === "string") {
                sql = queryPromise;
            } else {
                sql = queryPromise.toString();
            }

            console.log('\x1b[36m%s\x1b[0m', "Query:", sql);
        }
    }

    /**
     * TODO: deep copy
     * @param targetBean
     * @param deepCopy
     */
    duplicate(targetBean : Bean, deepCopy = true) {
        let bean = R.dispense(targetBean.beanMeta.type);

        bean.import(targetBean.export());
        bean.id = undefined;

        if (! deepCopy) {
            return bean;
        }

        throw "Error: deep copy not implemented yet";
    }
}

export const R = new RedBeanNode();
