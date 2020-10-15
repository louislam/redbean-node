import {RedBeanNode} from "./redbean-node";
import {magicMethods} from "./magic-methods";
import {camelCaseToUnderscore, underscoreToCamelCase} from "./helper/string-helper";

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

        let hasRelationField = (this[Bean.getRelationFieldName(name)] !== undefined);

        if (value instanceof Bean || hasRelationField) {
            this.setRelationBean(name, value);
        } else {
            let key = Bean.internalName(name);
            this[key] = value;

            // If this is a relation field, sync the relation bean too!
            if (Bean.isRelationField(key)) {
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
        // converting product to this["product_id"] for example
        let relationFieldName = Bean.getRelationFieldName(name);

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
                return null;
            }

            this.beanMeta.typeBeanList[type] = await this.R().load(type, id);
        }

        return this.beanMeta.typeBeanList[type];
    }

    /**
     * One-to-many
     * @param alias
     * @param type
     * @param force
     */
    protected async ownList(type : string, alias : string, force = false) {
        if (! this.beanMeta.ownListList[type] || force) {
            this.devLog("load", type, "list from db");

            let field = Bean.dbFieldName(Bean.getRelationFieldName(alias));

            this.beanMeta.ownListList[type] = await this.R().find(type, ` ?? = ? `, [
                field,
                this._id
            ]);
        }

        return this.beanMeta.ownListList[type];
    }

    protected async sharedList(type : string, force = false) {
        let via;

        if (this.beanMeta.via) {
            via = this.beanMeta.via;
        } else {
            let typeList = [this.beanMeta.type, type].sort(function (a, b) {
                return ('' + a).localeCompare(b);
            });

            via = typeList[0] + "_" + typeList[1];

            // Check product_tag and tag_product tables
            if (! await this.R().hasTable(via)) {
                via = typeList[1] + "_" + typeList[0];

                if (! await this.R().hasTable(via)) {
                    return [];
                }
            }
        }

        if (! this.beanMeta.sharedListList[via] || force) {
            let id1 = type + ".id";     // tag.id
            let id2 =  via + "." + type + "_id";    // product_tag.tag_id

            let queryPromise = this.R().knex.table(type).select(type + ".*")
                .join(via, id1, "=", id2)
                //.whereRaw(clause, data);
            this.R().queryLog(queryPromise);

            let list = await queryPromise;
            this.beanMeta.sharedListList[via] = this.convertToBeans(type, list);
        }

        return this.beanMeta.sharedListList[via];
    }

    /**
     * Store all relation beans
     * @param noIDOnly
     */
    async storeTypeBeanList(noIDOnly = true) {
        this.devLog("storeTypeBeanList");

        for (let type in this.beanMeta.typeBeanList) {
            let bean = this.beanMeta.typeBeanList[type];
            if (! bean.id) {
                await this.R().store(bean);
            }
            this[Bean.getRelationFieldName(type)] = bean.id;
        }
    }

    async refresh() {
        let updatedBean = await this.R().load(this.beanMeta.type, this.id);

        if (updatedBean != null) {
            this.beanMeta.refresh();
            this.import(updatedBean.export());
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
            let chainBean = this.R().duplicate(this, false);
            chainBean.id = this.id;
            chainBean.beanMeta.chainParentBean = this;
            chainBean.beanMeta.noCache = true;

            return chainBean;
        }
    }

    getType() {
        return this.beanMeta.type;
    }

    R() {
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

    protected static getRelationFieldName(type : string) {
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

    protected static internalName(name : string) {
        return Bean.prefixUnderscore(underscoreToCamelCase(name));
    }

    protected devLog(...params : any[]) {
        if (this.R().devDebug) {
            console.log("[" + this.beanMeta.type, this._id + "]", ...params);
        }
    }
}

/**
 * All true private variables are here, haha
 */
class BeanMeta {
    #_R! : RedBeanNode;
    #_type! : string;

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

    /*
    * These variables are for cache
    * Should be cleared if refresh() is called.
    */

    /**
     *
     * @private
     */
    #_typeBeanList : any = {};

    /**
     * Contains a list of own list
     * @private
     */
    #_ownListList : any = {};

    /**
     * Key is via table name
     * @private
     */
    #_sharedListList : any = {};


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

    get ownListList(): any {
        return this.#_ownListList;
    }

    get sharedListList(): any {
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

    refresh() {
        this.#_typeBeanList = {};
        this.#_ownListList = {};
        this.#_sharedListList = {};
    }


}
