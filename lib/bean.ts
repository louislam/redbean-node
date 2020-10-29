import {RedBeanNode} from "./redbean-node";
import {magicMethods} from "./magic-methods";
import {camelCaseToUnderscore, underscoreToCamelCase} from "./helper/string-helper";
import {LazyLoadArray} from "./lazy-load-array";
import {SharedList} from "./shared-list";
import {OwnList} from "./own-list";
import {LooseObject} from "./helper/helper";
import AwaitLock from 'await-lock';

@magicMethods
export class Bean {
    [key: string]: any;
    beanMeta = new BeanMeta();

    constructor(type : string, R : RedBeanNode) {
        this.beanMeta.R = R;
        this.beanMeta.type = type;

        this.devLog("Instantiate");
    }

    /**
     * Magic Setter
     * @param name
     * @param value
     */
    __set(name, value) {
        this.devLog("Set Property:", name, "=", value);

        if (name.startsWith("_")) {
            throw "invalid property name: starts with underscore is not allowed";
        }

        let hasRelationField = (this[Bean.getInternalRelationFieldName(name)] !== undefined);

        if (value instanceof Bean || hasRelationField) {
            this.setRelationBean(name, value);
        } else {
            let key = Bean.internalName(name);

            this.beanMeta.old[key] = this[key];

            this[key] = value;

            // If this is a relation field, sync the relation bean too!
            if (Bean.isRelationField(key)) {
                this.devLog("It is a relation field");
                let type = Bean.getTypeFromRelationField(key);
                delete this.beanMeta.typeBeanList[type];
            }
        }

    }

    /**
     * Magic Getter
     * @param name
     */
    __get(name) {
        this.devLog("__get:", name);

        // starts with underscore and come in here = undefined
        if (name.startsWith("_")) {
            return undefined;
        }

        this.devLog("Get Property:", name);

        // Check if relation field
        // converting "product" to this["_productId"] for example
        let relationFieldName = Bean.getInternalRelationFieldName(name);

        this.devLog("Convert to relation field name, see is there any relation id:", relationFieldName)

        if (this.beanMeta.isChainBean()) {
            this.devLog("this.beanMeta.fetchAs:", this.beanMeta.fetchAs);
        }

        let id = this[relationFieldName];

        // if it is null or number, it is a relation field!
        // or there is a fetchAs
        if (id !== undefined || this.beanMeta.fetchAs) {
            this.devLog("Relation Bean Property detected");

            let alias = name;
            let type = name;

            if (this.beanMeta.fetchAs) {
                // Assign a true type for the query
                type = this.beanMeta.fetchAs;
            }

            return this.getRelationBean(alias, type, this.beanMeta.noCache);
        }

        // If own(???)List, here
        else if (Bean.isOwnListProperty(name)) {
            this.devLog("ownList Property detected");

            let alias = this.beanMeta.type;
            let type = Bean.getTypeFromOwnListProperty(name);
            this.devLog("type =", type);

            if (this.beanMeta.alias) {
                alias = this.beanMeta.alias;
            }

            return this.ownList(type, alias, this.beanMeta.noCache);
        }

        // If shared(???)List, here
        else if (Bean.isSharedListProperty(name)) {
            this.devLog("sharedList Property detected");
            let type = Bean.getTypeFromSharedListProperty(name);
            return this.sharedList(type, this.beanMeta.noCache);
        }

        else {
            let key = Bean.internalName(name);
            return this[key];
        }
    }

    __isset(name) {
        this.devLog("Check isset property of ", name);
        return (this[Bean.internalName(name)]) ? true : false;
    }


    /**
     * Many-to-one
     * product.shop = shop;
     * @param alias
     * @param bean
     */
    protected setRelationBean(alias : string, bean : Bean | null) {
        if (bean) {
            if (bean.id) {

                // Not allow self reference?
                if (this.getType() == bean.getType() && this.id === bean.id) {
                    throw "Error: self reference detected";
                }

                this[Bean.getRelationFieldName(alias)] = bean.id;
            }

            this.beanMeta.typeBeanList[alias] = bean;
        } else {
            delete this.beanMeta.typeBeanList[alias];
            this[Bean.getRelationFieldName(alias)] = null;
        }
    }

    /**
     * Many-to-one
     * let shop = product.shop
     * @param alias
     * @param type
     * @param force
     */
    protected async getRelationBean(alias : string, type? : string, force = false) : Promise<Bean | null> {
        this.devLog("Getting relation bean:", alias, type, force);

        if (! type) {
            type = alias;
        }

        let fieldName = Bean.getInternalRelationFieldName(alias);

        this.devLog("Relation Field Name:", fieldName);

        if (! this.beanMeta.typeBeanList[type] || force) {
            let id = this[fieldName];

            if (! id) {
                this.devLog("Return null, id = ", id);
                return null;
            }

            this.beanMeta.typeBeanList[type] = await this.R.load(type, id);
        }

        return this.beanMeta.typeBeanList[type];
    }

    /**
     * One-to-many
     * @param alias
     * @param type
     * @param force
     */
    protected ownList(type : string, alias : string, force = false) {
        let key = type + "_" + alias;

        if (! this.beanMeta.ownListList[key] || force) {
            this.beanMeta.ownListList[key] = new OwnList(this, type, alias);

            if (this.beanMeta.withCondition) {
                this.beanMeta.ownListList[key].withCondition = this.beanMeta.withCondition;
                this.beanMeta.ownListList[key].withConditionData = this.beanMeta.withConditionData;
            }
        }

        return this.beanMeta.ownListList[key];
    }


    protected sharedList(type : string, force = false) {
        let via;

        if (this.beanMeta.via) {
            via = this.beanMeta.via;
        } else {
            let typeList = [this.beanMeta.type, type].sort(function (a, b) {
                return ('' + a).localeCompare(b);
            });

            via = typeList[0] + "_" + typeList[1];
        }

        if (! this.beanMeta.sharedListList[via]) {
            this.beanMeta.sharedListList[via] = new SharedList(this, type, via);

            if (this.beanMeta.withCondition) {
                this.beanMeta.sharedListList[via].withCondition = this.beanMeta.withCondition;
                this.beanMeta.sharedListList[via].withConditionData = this.beanMeta.withConditionData;
            }

        }

        return this.beanMeta.sharedListList[via];
    }

    /**
     * Store all relation beans
     * All beans without id will be stored.
     */
    async storeTypeBeanList() {
        this.devLog("storeTypeBeanList");

        // Own List
        for (let type in this.beanMeta.typeBeanList) {
            let bean = this.beanMeta.typeBeanList[type];
            if (! bean.id) {
                await this.R.store(bean);
            }
            this[Bean.getRelationFieldName(type)] = bean.id;
        }

    }

    /**
     * Store all shared list
     * All beans without id will be stored.
     */
    async storeSharedList() {
        let promiseList : Promise<any>[] = [];

        // Shared List
        for (let key in this.beanMeta.sharedListList) {
            let sharedList = this.beanMeta.sharedListList[key];

            if (sharedList instanceof SharedList) {
                promiseList.push(sharedList.store());
            }
        }

        await this.R.concurrent(promiseList);
    }

    /**
     * Store all own list
     * All beans without id will be stored.
     */
    async storeOwnList() {
        let promiseList : Promise<any>[] = [];

        for (let key in this.beanMeta.ownListList) {
            let ownList = this.beanMeta.ownListList[key];

            if (ownList instanceof OwnList) {
                promiseList.push(ownList.store());
            }
        }

        await this.R.concurrent(promiseList);
    }


    async refresh() {
        let updatedBean = await this.R.load(this.beanMeta.type, this.id);

        if (updatedBean != null) {
            this.import(updatedBean.export());
            this.beanMeta.refresh();
        } else {
            // Deleted in database?!
            // Do Nothing for now
            // TODO: Maybe remove all property?
        }
    }

    import(obj : any) {
        this.devLog("Import");

        for (let key in obj) {
            if (key !== "beanMeta") {
                this[key] = obj[key];
            }
        }
    }

    export(camelCase = true) {
        let obj : any = {};

        for (let key in this) {
            if (key !== "beanMeta") {
                if (camelCase) {
                    obj[Bean.removePrefixUnderscore(key)] = this[key];
                } else {
                    obj[Bean.dbFieldName(key)] = this[key];
                }
            }
        }

        return obj;
    }

    /**
     * The chain bean can get relation bean only
     * All property cannot be accessed.
     * @param type
     */
    fetchAs(type : string) : Bean {
        this.devLog("fetchAs:", type)

        let chainBean = this.createChainBean();
        chainBean.beanMeta.fetchAs = type;

        return chainBean;
    }

    alias(alias : string) : Bean {
        this.devLog("alias:", alias)

        let chainBean = this.createChainBean();
        chainBean.beanMeta.alias = alias;

        return chainBean;
    }

    via(via : string) : Bean {
        let chainBean = this.createChainBean();
        chainBean.beanMeta.via = via;

        return chainBean;
    }

    withCondition(condition : string, data : any[] = []) : Bean {
        let chainBean = this.createChainBean();
        chainBean.beanMeta.withCondition = condition;
        chainBean.beanMeta.withConditionData = data;
        return chainBean;
    }

    with(value : string, data = []) {
        return this.withCondition(" 1=1 " + value, data);
    }

/**
     * If it is a chain bean already, it will return this. Otherwise it will return a new chain bean.
     * @private
     */
    private createChainBean() : Bean {

        if (this.beanMeta.isChainBean()) {
            this.devLog("I am a chain bean");
            return this;
        } else {
            this.devLog("Create a chain bean");
            let chainBean = this.R.duplicate(this, false);
            chainBean.id = this.id;
            chainBean.beanMeta.chainParentBean = this;
            chainBean.beanMeta.noCache = true;

            return chainBean;
        }
    }

    getType() {
        return this.beanMeta.type;
    }

    get R() {
        return this.beanMeta.R;
    }

    static isOwnListProperty(name : string) {
        return name.startsWith("own") && name.endsWith("List");
    }

    static getTypeFromOwnListProperty(name : string) {
        if (this.isOwnListProperty(name)) {
            // slice 3(own) and 4(List)
            return name.slice(3, name.length - 4).toLowerCase();
        } else {
            throw name + " is not an own list property!";
        }
    }

    static isSharedListProperty(name : string) {
        return name.startsWith("shared") && name.endsWith("List");
    }

    static getTypeFromSharedListProperty(name : string) {
        if (this.isSharedListProperty(name)) {
            // slice 6(shared) and 4(List)
            return name.slice(6, name.length - 4).toLowerCase();
        } else {
            throw name + " is not an shared list property!";
        }
    }

    static isRelationField(name : string) {
        return name.endsWith("Id");
    }

    protected static getInternalRelationFieldName(type : string) {
        return Bean.prefixUnderscore(Bean.getRelationFieldName(type));
    }

    public static getRelationFieldName(type : string) {
        return type + "Id";
    }

    static prefixUnderscore(name : string) {
        return "_" + name;
    }

    static getTypeFromRelationField(name : string) {
        let s = name;

        if (s.endsWith("Id")) {
            s = s.slice(0, s.length - 2);
        }

        return Bean.removePrefixUnderscore(s);
    }

    static removePrefixUnderscore(name : string) {
        if (name.startsWith("_")) {
            return name.slice(1);
        } else {
            return name;
        }
    }

    static dbFieldName(name : string) {
        return Bean.removePrefixUnderscore(camelCaseToUnderscore(name));
    }

    static internalName(name : string) {
        return Bean.prefixUnderscore(underscoreToCamelCase(name));
    }

    protected devLog(...params : any[]) {
        if (this.R.devDebug) {
            console.log("[" + this.beanMeta.type, this._id + "]", ...params);
        }
    }


    isTainted() {
        return Object.keys(this.beanMeta.old).length > 0;
    }
}

/**
 * All true private variables are here, haha
 */
class BeanMeta {
    #_R! : RedBeanNode;
    #_type! : string;
    #_lock : AwaitLock = new AwaitLock();

    /**
     * For chain operation
     */
    #_chainParentBean! : Bean;

    /**
     * ownList / shareList etc will be cache by default
     */
    noCache = false;

    /* Variables for Chaining function */

    /**
     * For chain fetchAs() / fetchAs()
     */
    fetchAs = "";
    alias = "";
    via = "";
    withCondition = "";
    withConditionData : any[] = [];

    /*
    * These variables are for cache
    * Should be cleared if refresh() is called.
    */

    /**
     *
     * @private
     */
    #_typeBeanList : LooseObject<Bean> = {};

    /**
     * Contains a list of own list
     * @private
     */
    #_ownListList : LooseObject<OwnList> = {};

    /**
     * Key is via table name
     * @private
     */
    #_sharedListList : LooseObject<SharedList> = {};

    #_old : LooseObject = {};

    get R(): RedBeanNode {
        return this.#_R;
    }

    set R(value: RedBeanNode) {
        this.#_R = value;
    }

    get typeBeanList(): any {
        return this.#_typeBeanList;
    }

    get type(): string {
        return this.#_type;
    }

    set type(value: string) {

        // Limit english, number, _ and - only
        // Because Unicode table name is not tested and should be hard to test
        if (value.match(/^[a-zA-Z0-9_-]+$/) == null) {
            throw `type name '${value}' is not allowed`
        }

        this.#_type = value;
    }

    get ownListList() {
        return this.#_ownListList;
    }

    get sharedListList() {
        return this.#_sharedListList;
    }

    set chainParentBean(value: Bean) {
        this.#_chainParentBean = value;
    }

    /**
     * Has a Parent bean = it is a chain bean
     * No parent bean = not a chain bean
     */
    isChainBean() {
        return (this.#_chainParentBean) ? true : false;
    }

    get old(): LooseObject {
        return this.#_old;
    }

    set old(value: LooseObject) {
        this.#_old = value;
    }

    clearCache() {
        this.#_typeBeanList = {};
        this.#_ownListList = {};
        this.#_sharedListList = {};
    }

    clearHistory() {
        this.#_old = {};
    }

    refresh() {
        this.clearCache();
        this.clearHistory();
    }

    get lock(): AwaitLock {
        return this.#_lock;
    }

}
