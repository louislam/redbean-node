import knex, { Knex } from "knex";
import {Bean} from "./bean";
import {isEmptyObject, LooseObject} from "./helper/helper";
import dayjs from "dayjs";
import { glob } from "glob";
import path from "path";
import {BeanModel} from "./bean-model";
import BeanConverterStream from "./bean-converter-stream";
import AwaitLock from "await-lock";
import StaticConnectionConfig = Knex.StaticConnectionConfig;
import PoolConfig = Knex.PoolConfig;
import Client = Knex.Client;
import RawBinding = Knex.RawBinding;
import QueryBuilder = Knex.QueryBuilder;
// import PromisePool from 'es6-promise-pool';

export class RedBeanNode {

    /**
     * For this library dev only
     */
    public devDebug = false;
    protected _debug = false;
    protected _freeze = false;

    protected _transaction;
    protected _knex! : Knex;
    public dbType : string = "";

    private _modelList : LooseObject<{new (type, R): BeanModel}> = {};

    protected schemaLock = new AwaitLock();

    /**
     * If use this on transaction
     */
    get knex() {
        if (this._transaction) {
            return this._transaction;
        }
        return this._knex;
    }

    isTransaction() {
        return !! this._transaction;
    }

    setup(dbType : string | Knex = 'sqlite', connection : StaticConnectionConfig = { filename: './dbfile.db' }, pool : PoolConfig = {  }) {

        if (typeof dbType === "string") {

            if (! pool.min) {
                if (dbType == "sqlite") {
                    pool.min = 1;
                } else {
                    pool.min = 2;
                }
            }

            if (! pool.max) {
                if (dbType == "sqlite") {
                    pool.max = 1;
                } else {
                    pool.max = 10;
                }
            }

            if (! pool.idleTimeoutMillis) {
                pool.idleTimeoutMillis = 30000;
            }

            if (dbType == "mariadb") {
                dbType = "mysql";
            }

            this.dbType = dbType;

            let useNullAsDefault = (dbType == "sqlite")

            this._knex = knex({
                client: dbType,
                connection,
                useNullAsDefault,
                pool
            });

        } else {
            this._knex = dbType;
            this.dbType = this._knex.client.config.client;

            if (this.dbType === "mysql2") {
                this.dbType = "mysql";
            }
        }
    }

    /**
     *
     * @param type
     */
    dispense(type : string) : Bean {
        return this.createBean(type);
    }

    protected createBean(type : string, isDispense = true) {
        if (type in this.modelList) {
             let bean : BeanModel = new this.modelList[type](type, this);

            if (isDispense) {
                bean.onDispense();
            }

            return bean;

        } else {
            return new Bean(type, this);
        }
    }

    freeze( v = true) {
        this.devLog("Freeze to" + v);
        this._freeze = v;
    }

    debug(v : boolean) {
        this._debug = v;
    }

    concurrent(promiseList : Promise<any>[]) {
        return Promise.all(promiseList);
    }

    storeAll(beans: Bean[], changedFieldsOnly = true) {
        let promiseList : Promise<any>[] = [];

        for (let bean of beans) {
            promiseList.push(this.store(bean, changedFieldsOnly));
        }

        return this.concurrent(promiseList);
    }

    async store(bean: Bean, changedFieldsOnly = true) {
        await bean.beanMeta.lock.acquireAsync();

        try {
            return await this.storeCore(bean, changedFieldsOnly);
        } finally {
            bean.beanMeta.lock.release();
        }
    }

    protected async storeCore(bean: Bean, changedFieldsOnly = true) : Promise<number> {
        this.devLog("Store", bean.beanMeta.type, bean.id);

        await bean.storeTypeBeanList();

        if (bean instanceof BeanModel) {
            bean.onUpdate();
        }

        if (! this._freeze) {
            await this.updateTableSchema(bean);
        }

        let obj = bean.export(false);
        delete obj.id;

        // Update
        // else insert
        if (bean.id) {

            // Update the changed fields only
            if (changedFieldsOnly) {
                for (let key in obj) {

                    if (! (Bean.internalName(key) in bean.beanMeta.old)) {
                        this.devLog(key + " is not updated");
                        delete obj[key];
                    }
                }
            }

            this.devLog("values to be updated:");
            this.devLog(obj);

            if (! isEmptyObject(obj)) {
                let queryPromise = this.knex(bean.getType()).where({ id: bean.id }).update(obj);
                this.queryLog(queryPromise);
                await queryPromise;
            } else {
                this.devLog("Empty obj, no need to make query");
            }

        } else {
            let queryPromise = this.knex(bean.getType()).insert(obj);

            this.queryLog(queryPromise);
            let result = await queryPromise;
            bean.id = result[0];
        }



        // Store Shared List
        // Must be here, because the bean id is needed
        await bean.storeSharedList();
        await bean.storeOwnList();

        // Clear History, tainted to false
        bean.beanMeta.old = {};

        if (bean instanceof BeanModel) {
            bean.onAfterUpdate();
        }

        return bean.id;
    }

    protected async updateTableSchema(bean: Bean, changedFieldsOnly = true) {
        await this.schemaLock.acquireAsync();

        try {
            await this.updateTableSchemaCore(bean);
        } finally {
            this.schemaLock.release();
        }
    }

    protected async updateTableSchemaCore(bean : Bean) {
        this.devLog("Check Update Table Schema");

        if (! this._knex) {
            throw "Error: Please execute R.setup(.....) first.";
        }

        let exists = await this.hasTable(bean.getType());

        if (! exists) {
            this.debugLog("Table is not found, create table: " + bean.getType());

            try {
                let queryPromise = this._knex.schema.createTable(bean.getType(), function (table) {
                    table.increments().primary();
                });
                this.queryLog(queryPromise);
                await queryPromise;
            } catch (error) {
                this.checkAllowedSchemaError(error);
            }

        }

        // Don't put it inside callback, causes problem than cannot add columns!
        let columnInfo = await this.inspect(bean.getType());
        //console.devLog(columnInfo);

        try {
            let queryPromise = this._knex.schema.table(bean.getType(), async (table) => {

                let obj = bean.export(false);

                for (let fieldName in obj) {
                    let value = obj[fieldName];
                    let addField = false;
                    let alterField = false;
                    let valueType = this.getDataType(value, fieldName);
                    this.devLog("Best column type =", valueType);


                    // Check if the field exists in current database
                    if (! columnInfo.hasOwnProperty(fieldName)) {
                        addField = true;
                    }

                    // If exists in current database, but the type is not good for the data
                    else if (! this.isValidType(columnInfo[fieldName].type, valueType)) {
                        this.debugLog(`Alter column is needed: ${fieldName} (dbType: ${columnInfo[fieldName].type}) (valueType: ${valueType})`);
                        addField = true;
                        alterField = true;
                    }

                    if (addField) {
                        let col;

                        if (valueType == "integer") {
                            this.debugLog("Create field (Int): " + fieldName);
                            col = table.integer(fieldName);

                        } else if (valueType == "bigInteger") {
                            this.debugLog("Create field (bigInteger): " + fieldName);
                            col = table.bigInteger(fieldName);

                        } else if (valueType == "float") {
                            this.debugLog("Create field (Float): " + fieldName);
                            col = table.float(fieldName);

                        } else if (valueType == "boolean") {
                            this.debugLog("Create field (Boolean): " + fieldName);
                            col = table.boolean(fieldName);

                        } else if (valueType == "text") {
                            this.debugLog("Create field (Text): " + fieldName);
                            col = table.text(fieldName, "longtext");

                        } else if (valueType == "datetime") {
                            this.debugLog("Create field (Datetime): " + fieldName);
                            col = table.dateTime(fieldName);

                        } else if (valueType == "datetimemillis") {
                            this.debugLog("Create field (Datetimemillis): " + fieldName);
                            col = table.dateTime(fieldName);

                        } else if (valueType == "date") {
                            this.debugLog("Create field (Date): " + fieldName);
                            col = table.date(fieldName);

                        } else if (valueType == "time") {
                            this.debugLog("Create field (Time): " + fieldName);
                            col = table.time(fieldName);

                        } else if (valueType == "timemillis") {
                            this.debugLog("Create field (Timemillis): " + fieldName);
                            col = table.time(fieldName);

                        } else {
                            this.debugLog("Create field (String): " + fieldName);
                            col = table.string(fieldName);
                        }

                        if (alterField) {
                            this.debugLog("This is modify column");
                            col.alter();
                        }

                        // Add index key for relation fields
                        // TODO: foreign key too
                        if (fieldName.endsWith("_id")) {
                            table.index(fieldName)
                        }
                    }
                }
            });
            this.queryLog(queryPromise);
            await queryPromise;
        } catch (error) {
            this.checkAllowedSchemaError(error);
        }

    }

    getDataType(value, fieldName : string = "") {
        let type = typeof value;

        this.devLog("Date Type of", value, "=", type);

        // Relation field as integer
        if (fieldName.endsWith("_id")) {
            return "integer";
        }

        if (type == "boolean") {
            return "boolean";

        } else if (type == "number") {
            if (Number.isInteger(value)) {

                if (value > 2147483647) {
                    return "bigInteger";
                } else if ((this.dbType == "mysql" || this.dbType == "mssql") && (value == 1 || value == 0)) {
                    return "boolean";   // Tinyint, for mysql only
                } else {
                    return "integer";
                }

            } else {
                return "float";
            }
        } else if (type == "string") {
            if (value.length > 230) {
                return "text";
            } else {

                if (this.isDateTime(value)) {
                    return "datetime";
                } else if (this.isDateTimeMillis(value)) {
                    return "datetimemillis";
                } else if (this.isDate(value)) {
                    return "date";
                }  else if (this.isTime(value)) {
                    return "time";
                }  else if (this.isTimeMillis(value)) {
                    return "timemillis";
                }

                return "varchar";
            }
        } else {
            return "varchar";
        }
    }

    isValidType(columnType, valueType) {
        this.devLog("isValidType", columnType, valueType);

        // Boolean
        if (columnType == "boolean" || columnType == "tinyint" || columnType == "bit") {
            if (
                valueType == "integer" || valueType == "float" || valueType == "varchar" ||
                valueType == "text" || valueType == "bigInteger" ||
                valueType == "datetime" || valueType == "datetimemillis" || valueType == "date" ||
                valueType =="time" || valueType == "timemillis"
            ) {
                return false;
            }
        }

        // Int
        if (columnType == "integer" || columnType == "int") {
            if (
                valueType == "float" || valueType == "varchar" || valueType == "text" || valueType == "bigInteger" ||
                valueType == "datetime" || valueType == "datetimemillis" || valueType == "date" ||
                valueType =="time" || valueType == "timemillis"
            ) {
                return false;
            }
        }

        // Big Int
        if (columnType == "bigInteger" || columnType == "bigint") {
            if (
                valueType == "float" || valueType == "varchar" || valueType == "text" ||
                valueType == "datetime" || valueType == "datetimemillis" || valueType == "date" ||
                valueType =="time" || valueType == "timemillis"
            ) {
                return false;
            }
        }

        // Float
        if (columnType == "float") {
            if (
                valueType == "varchar" || valueType == "text" || valueType == "datetime" ||
                valueType == "datetimemillis" || valueType == "date" || valueType =="time" ||
                valueType == "timemillis"
            ) {
                return false;
            }
        }

        // Time
        if (columnType == "time") {
            if (
                valueType == "varchar" || valueType == "text" ||
                valueType == "datetime" || valueType ==  "datetimemillis" || valueType == "date"
            ) {
                return false;
            }
        }

        // Date
        if (columnType == "date") {
            if (
                valueType == "varchar" || valueType == "text" ||
                valueType == "datetime" || valueType == "datetimemillis"
            ) {
                return false;
            }
        }

        // DateTime
        if (columnType == "datetime" || columnType == "datetime2") {
            if (
                valueType == "varchar" || valueType == "text"
            ) {
                return false;
            }
        }

        // Varchar
        // Varchar cannot store text only
        if (columnType == "varchar" || columnType == "nvarchar") {
            if (valueType == "text") {
                return false;
            }
        }

        return true;
    }



    async close() {
        await this.knex.destroy();
    }

    load(type: string, id: number) {
        return this.findOne(type, " id = ?", [
            id
        ]);
    }

    /**
     *
     * @param error
     * @return string
     * @protected
     */
    protected normalizeErrorMsg(error) {

        let e;

        if (this.dbType == "sqlite") {
            e = error.message;

        } else if (this.dbType == "mysql") {
            e = error.code;

        } else if (this.dbType == "mssql") {
            e = error.message;

        }

        if (!e) {
            e = JSON.stringify(error);
        }

        return e;
    }

    protected checkError(error, allowedErrorList : (string | string[])[]) {
        this.devLog(error);

        let msg = this.normalizeErrorMsg(error);

        for (let allowedError of allowedErrorList) {

            if (Array.isArray(allowedError)) {
                let allMatch = true;

                for (let s of allowedError) {
                    if (! msg.includes(s)) {
                        allMatch = false;
                        break;
                    }
                }

                if (allMatch) {
                    return;
                }

            } else if (msg.includes(allowedError)) {
                return;
            }
        }

        throw error;
    }

    /**
     * For internal use
     * @param error
     */
    public checkAllowedError(error) {
        this.devLog("Check Allowed Error for bean query");
        this.checkError(error, [
            // SQLITE
            "SQLITE_ERROR: no such table:",

            // BETTER_SQLITE3
            " - no such table: ",

            // MYSQL
            "ER_NO_SUCH_TABLE",

            // MSSQL
            "Invalid object name",
        ]);
    }

    /**
     * Schema maybe modified by other promises, instance or applications at the same
     * @param error
     */
    public checkAllowedSchemaError(error) {
        this.devLog("Check Schema Error");

        this.checkError(error, [
            // SQLITE
            ["SQLITE_ERROR: table ", "already exists"],
            "SQLITE_ERROR: duplicate column name:",

            // MYSQL
            "ER_TABLE_EXISTS_ERROR",
            "ER_DUP_FIELDNAME"
        ]);
    }

    async trash(bean: Bean) {
        if (bean.id) {
            if (bean instanceof BeanModel) {
                bean.onDelete();
            }

            let queryPromise = this.knex.table(bean.getType()).where({ id : bean.id }).delete();

            this.queryLog(queryPromise);

            await queryPromise;
            bean.id = 0;

            if (bean instanceof BeanModel) {
                bean.onAfterDelete();
            }
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

    protected findCore(type: string, clause: string, data : readonly RawBinding[] = []) : QueryBuilder {
        let queryPromise = this.knex.table(type).whereRaw(clause, data);
        this.queryLog(queryPromise);
        return queryPromise;
    }

    async find(type: string, clause: string = "", data : readonly RawBinding[] = []) {
        try {
            let list = await this.findCore(type, clause, data);
            return this.convertToBeans(type, list);
        } catch (error) {
            this.checkAllowedError(error);
            return [];
        }
    }

    findStream(type: string, clause: string = "", data : readonly RawBinding[] = []) {
        return BeanConverterStream.createStream(type, this, this.findCore(type, clause, data));
    }

    protected findAllCore(type: string, clause: string, data : readonly RawBinding[] = []) {
        return this.findCore(type, " 1=1 " + clause, data);
    }

    async findAll(type: string, clause: string = "", data : readonly RawBinding[] = []) {
        try {
            let list = await this.findAllCore(type, clause, data);
            return this.convertToBeans(type, list)
        } catch (error) {
            this.checkAllowedError(error);
            return [];
        }
    }

    findAllStream(type: string, clause: string, data : readonly RawBinding[] = []) {
        return BeanConverterStream.createStream(type, this, this.findAllCore(type, clause, data));
    }


    async findOne(type: string, clause: string = "", data : readonly RawBinding[] = []) {
        let queryPromise = this.knex.table(type).whereRaw(clause, data).first();
        this.queryLog(queryPromise);
        let obj;

        try {
            obj = await queryPromise;
        } catch (error) {
            this.checkAllowedError(error);
        }

        if (! obj) {
            return null;
        }

        let bean = this.convertToBean(type, obj);
        return bean;
    }

    convertToBean(type : string, obj) : Bean {
        this.devLog("convertToBean", type, obj);

        let isDispense;

        if (obj.id) {
            isDispense = false;
        } else {
            isDispense = true;
        }

        let bean = this.createBean(type, isDispense);
        bean.import(obj);

        // Call on after import value
        if (! isDispense && bean instanceof BeanModel) {
            bean.onOpen();
        }

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

    getAll(sql: string, data: readonly RawBinding[] = []) {
        return this.normalizeRaw(sql, data);
    }

    getAllStream(sql: string, data: string[] = []) {
        return this.normalizeRawCore(sql, data).stream();
    }

    async getRow(sql: string, data: RawBinding[] = [], autoLimit = false) {

        if (autoLimit) {

            if (this.dbType == "mssql") {
                // SELECT TOP 1
                if (sql.trim().toLowerCase().startsWith("select ")) {
                    sql = sql.replace(/select/i, '$& TOP 1')
                }

            } else {
                let limitTemplate = this.knex.limit(1).toSQL().toNative();

                // LIMIT 1
                sql = sql + limitTemplate.sql.replace("select *", "");
                data = data.concat(limitTemplate.bindings);
            }

        }

        this.queryLog(sql);

        let result = await this.normalizeRaw(sql, data);

        if (result.length > 0) {
            return result[0];
        } else {
            return null;
        }
    }

    protected normalizeRawCore(sql, data) {
        let queryPromise = this.knex.raw(sql, data);
        this.queryLog(queryPromise);
        return queryPromise;
    }

    async normalizeRaw(sql, data) : Promise<LooseObject[]> {
        let result = await this.normalizeRawCore(sql, data);
        this.queryLog(sql);

        if (this.dbType == "mysql") {
            result = result[0];
        }

        return result;
    }

    async getCol(sql: string, data: readonly RawBinding[] = []) : Promise<any[]> {
        let list = await this.getAll(sql, data);
        let key : string;

        return list.map((obj) => {
            // Use first column as key
            if (! key) {
                for (let k in obj) {
                    key = k;
                    break;
                }
            }
            return obj[key];
        });
    }

    async getCell(sql: string, data: RawBinding[] = [], autoLimit = true) {
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

    async count(type : string, clause : string = "", data : RawBinding[] = [], autoLimit = true) {
        let where = "";

        if (clause) {
            where = "WHERE " + clause;
        }

        try {
            return await this.getCell(`SELECT COUNT(*) FROM ?? ${where}`, [
                type,
                ...data,
            ], autoLimit)
        } catch (error) {
            this.checkAllowedError(error);
            return 0;
        }
    }

    inspect(type) {
        let queryPromise = this.knex.table(type).columnInfo();
        this.queryLog(queryPromise);
        return queryPromise;
    }

    /**
     * @param callback
     */
    async begin() : Promise<RedBeanNode> {
        if (! this._freeze) {
            console.warn("Warning: Transaction is not working in non-freeze mode.");
            return this;
        }

        if (this._transaction) {
            throw "Previous transaction is not committed";
        }

        let redBeanNode = new RedBeanNode();
        redBeanNode.setup(this._knex);
        redBeanNode._debug = this._debug;
        redBeanNode._freeze = this._freeze;
        redBeanNode.devDebug = this.devDebug;
        redBeanNode._transaction = await this.knex.transaction();

        return redBeanNode;
    }

    /**
     * @param callback
     */
    async commit() {
        if (this._transaction) {
            await this._transaction.commit();
            this._transaction = null;
        }
    }

    /**
     * @param callback
     */
    async rollback() {
        if (this._transaction) {
            await this._transaction.rollback();
            this._transaction = null;
        }
    }

    /**
     * @param callback
     */
    async transaction(callback: (trx : RedBeanNode) => void) {
        let trx = await this.begin();

        try {
            await callback(trx);
            await trx.commit();
        } catch (error) {
            await trx.rollback();
        }

    }

    protected devLog(...params : any[]) {
        if (this.devDebug) {
            console.log("[R]", ...params);
        }
    }

    protected debugLog(...params : any[]) {
        if (this.isDebug()) {
            console.log("[R]", ...params);
        }
    }

    public queryLog(queryPromise : string | Promise<any>) {
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
        let bean = this.dispense(targetBean.beanMeta.type);

        bean.import(targetBean.export());
        bean.id = undefined;

        if (! deepCopy) {
            return bean;
        }

        throw "Error: deep copy not implemented yet";
    }

    hasTable(tableName : string) {
        let queryPromise = this.knex.schema.hasTable(tableName);
        this.queryLog(queryPromise);
        return queryPromise;
    }

    isFrozen() {
        return this._freeze;
    }

    isDebug() {
        return this._debug;
    }

    isoDateTime(dateTime : dayjs.Dayjs | Date | undefined = undefined) : string {
        let dayjsObject;

        if (dateTime instanceof dayjs) {
            dayjsObject = dateTime;
        } else {
            dayjsObject =  dayjs(dateTime);
        }

        return dayjsObject.format('YYYY-MM-DD HH:mm:ss');
    }

    isoDateTimeMillis(dateTime : dayjs.Dayjs | Date | undefined = undefined) : string {
        let dayjsObject;

        if (dateTime instanceof dayjs) {
            dayjsObject = dateTime;
        } else {
            dayjsObject =  dayjs(dateTime);
        }

        return dayjsObject.format('YYYY-MM-DD HH:mm:ss.SSS');
    }

    isoDate(date : dayjs.Dayjs | Date | undefined = undefined) : string {
        let dayjsObject;

        if (date instanceof dayjs) {
            dayjsObject = date;
        } else {
            dayjsObject =  dayjs(date);
        }

        return dayjsObject.format('YYYY-MM-DD');
    }

    /**
     * HH:mm:ss
     * @param date
     */
    isoTime(date : dayjs.Dayjs | Date | undefined = undefined) {
        let dayjsObject;

        if (date instanceof dayjs) {
            dayjsObject = date;
        } else {
            dayjsObject =  dayjs(date);
        }

        return dayjsObject.format('HH:mm:ss');
    }

    /**
     * HH:mm:ss.SSS
     * @param date
     */
    isoTimeMillis(date : dayjs.Dayjs | Date | undefined = undefined) {
        let dayjsObject;

        if (date instanceof dayjs) {
            dayjsObject = date;
        } else {
            dayjsObject =  dayjs(date);
        }

        return dayjsObject.format('HH:mm:ss.SSS');
    }

    isDate(value : string) {
        let format = "YYYY-MM-DD";
        return dayjs(value, format).format(format) === value;
    }

    isDateTime(value : string) {
        let format = "YYYY-MM-DD HH:mm:ss";
        return dayjs(value, format).format(format) === value;
    }

    isDateTimeMillis(value : string) {
        let format = "YYYY-MM-DD HH:mm:ss.SSS";
        return dayjs(value, format).format(format) === value;
    }

    isTime(value : string) {
        // Since dayjs is not supporting time only format, so prefix a fake date to parse
        value = "2020-10-20 " + value;
        let format = "YYYY-MM-DD HH:mm:ss";
        return dayjs(value, format).format(format) === value;
    }

    isTimeMillis(value : string) {
        // Since dayjs is not supporting time only format, so prefix a fake date to parse
        value = "2020-10-20 " + value;
        let format = "YYYY-MM-DD HH:mm:ss.SSS";
        return dayjs(value, format).format(format) === value;
    }

    /**
     *
     * @param dir
     * @param lang undefined = auto detect
     */
    autoloadModels(dir: string, lang: undefined | "ts" | "js") {
        let tsFileList, jsFileList;

        let isTS;

        if (lang === "ts") {
            isTS = true;
        } else if (lang === "js") {
            isTS = false;
        } else {
            isTS = !! process[Symbol.for("ts-node.register.instance")]
        }

        let ext, fileList;

        if (isTS) {
            ext = ".ts";
        } else {
            ext = ".js";
        }

        if (this.devDebug && dir == "./model") {
            fileList = glob.sync("./lib/model/*" + ext);
        } else {
            fileList = glob.sync(dir + "/*" + ext);
        }

        for (let file of fileList) {
            if (file.endsWith(".d.ts")) {
                continue;
            }

            if (this.devDebug) {
                file = file.replace("lib/", "");
            }

            let info = path.parse(file);
            let obj = require(path.resolve(file));

            if ("default" in obj && obj.default.prototype instanceof BeanModel) {
                this.modelList[info.name] = obj.default;

            } else if (obj.prototype instanceof BeanModel)  {
                this.modelList[info.name] = obj;

            } else {
                console.log(file, "is not a valid BeanModel, skipped");
            }

        }

    }

    get modelList() {
        return this._modelList;
    }

}

export let R = new RedBeanNode();
