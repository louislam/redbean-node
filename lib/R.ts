import knex, {RawBinding, StaticConnectionConfig, ValueDict} from "knex";
import {Bean} from "./Bean";

export class R {

    protected static _freeze = false;

    public static knex;

    static setup(dbType = 'sqlite', connection : StaticConnectionConfig = { filename: './dbfile.db' }) {
        let useNullAsDefault = (dbType == "sqlite")

        R.knex = knex({
            client: dbType,
            connection,
            useNullAsDefault,
        });
    }

    static dispense(type) {
        return new Bean(type);
    }

    static async freeze( v = true) {
        R._freeze = v;
    }

    static async store(bean: Bean) {
        if (! R._freeze) {
            await R.updateTableSchema(bean);
        }

        // Update
        // else insert
        if (bean.id) {
            await R.knex(bean.getType()).where({ id: bean.id}).update(bean);
        } else {
            let result = await R.knex(bean.getType()).insert(bean);
            bean.id = result[0];
        }


        return bean.id;
    }

    protected static async updateTableSchema(bean : Bean) {

        let exists = await R.knex.schema.hasTable(bean.getType());

        if (! exists) {
            console.log("Create table: " + bean.getType());
            await R.knex.schema.createTable(bean.getType(), function (table) {
                table.increments().primary();
            });
        }

        // Don't put it inside callback, causes problem than cannot add columns!
        let columnInfo = await R.knex.table(bean.getType()).columnInfo();

        await R.knex.schema.table(bean.getType(), async (table) => {

            for (let fieldName in bean) {
                let value = bean[fieldName];
                let addField = false;
                let alterField = false;
                let valueType = R.getDataType(value);

                if (! columnInfo.hasOwnProperty(fieldName)) {
                    addField = true;
                }

                /**
                 else if (! R.isValidType(columnInfo[fieldName].type, valueType)) {
                    addField = true;
                    alterField = true;
                }
             */

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

                    } else {
                        console.log("Create field (String): " + fieldName);
                        col = table.string(fieldName);
                    }

                    if (alterField) {
                        col.alter();
                    }
                }
            }
        });
    }

    static getDataType(value) {
        let type = typeof value;
        if (type == "number") {
            if (Number.isInteger(value)) {
                return "integer";
            } else {
                return "float";
            }
        } else {
            return type;
        }
    }

    static isValidType(columnType, valueType) {
        if (columnType == "boolean") {
            if (valueType == "integer" || valueType == "float" || valueType == "string") {
                return false;
            }
        }

        if (columnType == "integer") {
            if (valueType == "float" || valueType == "string") {
                return false;
            }
        }

        return true;
    }

    static async close() {
        await R.knex.destroy();
    }

    static async load(type: string, id: number) {
        let result = await R.knex.select().table(type).whereRaw("id = ?", [
            id
        ]).limit(1);

        if (result.length > 0) {
            return R.convertToBean(type, result[0]);
        } else {
            return null;
        }
    }



    /**
     * TODO: only update the fields which are changed to database
     * @protected
     */
    protected static watchBean() {

    }

    static async trash(bean: Bean) {
        await R.knex.table(bean.getType()).where({ id : bean.id }).delete();
        delete bean.id;
    }

    static async trashAll(beans : Bean[]) {
        beans.forEach((bean) => {
            R.trash(bean);
        });
    }

    static async find(type: string, clause: string, data : readonly RawBinding[] | ValueDict | RawBinding = []) {
        let list = await R.knex.table(type).whereRaw(clause, data);
        return R.convertToBeans(type, list);
    }

    static findAll(type: string, clause: string, data : readonly RawBinding[] | ValueDict | RawBinding = []) {
        return R.find(type, " 1=1 " + clause, data);
    }

    static async findOne(type: string, clause: string, data : readonly RawBinding[] | ValueDict | RawBinding = []) {
        let obj = await R.knex.table(type).whereRaw(clause, data).first();

        if (! obj) {
            return null;
        }

        return R.convertToBean(type, obj);
    }

    static convertToBean(type : string, obj) : Bean {
        let bean = R.dispense(type);
        return Object.assign(bean, obj);
    }

    static convertToBeans(type : string, objList){
        let list : Bean[] = [];

        objList.forEach((obj) => {
            if (obj != null) {
                list.push(R.convertToBean(type, obj))
            }
        });

        return list;
    }

    static exec(sql: string, data: string[] = []) {
        R.knex.raw(sql, data);
    }

    static getAll(sql: string, data: string[] = []) {
        return R.knex.raw(sql, data);
    }

    static async getRow(sql: string, data: string[] = []) {
        let limitTemplate = R.knex.limit(1).toSQL().toNative();

        sql = sql + limitTemplate.sql.replace("select *", "");
        data = data.concat(limitTemplate.bindings);

        let result = await R.knex.raw(sql, data);

        if (result.length > 0) {
            return result[0];
        } else {
            return null;
        }
    }
}
