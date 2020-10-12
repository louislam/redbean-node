import {RedBeanNode} from "./redbean-node";
import {magicMethods} from "./magic-methods";
import {camelCaseToUnderscore, underscoreToCamelCase} from "./helper/string-helper";

@magicMethods
export class Bean {
    [key: string]: any;
    protected beanMeta = new BeanMeta();

    constructor(type : string, R : RedBeanNode) {
        this.beanMeta.R = R;
        this.beanMeta.type = type;
    }

    __set(name, value) {
        if (name.startsWith("_")) {
            throw "invalid property name: starts with underscore is not allowed";
        }

        if (value instanceof Bean) {
            this.set(name, value);
        } else {
            let key = Bean.internalName(name);
            this[key] = value;
        }

    }

    __get(name) {
        // Check if relation field
        // converting product to this["product_id"] for example
        let id = this[Bean.getTypeFieldName(name)];

        // if it is null or number, it is a relation field!
        if (id !== undefined) {
            return this.get(name);
        } else {
            let key = Bean.internalName(name);
            return this[key];
        }
    }


    /**
     * product.shop = shop;
     * @param alias
     * @param bean
     */
    set(alias : string, bean : Bean | null) {
        if (bean) {
            if (bean.id) {
                if (this.getType() == bean.getType() && this.id === bean.id) {
                    throw "Error, same type and id";
                }

                this[Bean.getTypeFieldName(alias)] = bean.id;
            }

            this.beanMeta.typeBeanList[alias] = bean;
        } else {
            delete this.beanMeta.typeBeanList[alias];
            this[Bean.getTypeFieldName(alias)] = null;
        }
    }

    async storeTypeBeanList(noIDOnly = true) {
        for (let type in this.beanMeta.typeBeanList) {
            let bean = this.beanMeta.typeBeanList[type];

            if (! bean.id) {
                await this.R().store(bean);
            }

            this[Bean.getTypeFieldName(type)] = bean.id;
        }
    }

    /**
     * let shop = product.shop
     * @param alias
     * @param type
     * @param force
     */
    async get(alias : string, type? : string, force = false) : Promise<Bean | null> {
        if (! type) {
            type = alias;
        }

        let fieldName = Bean.getTypeFieldName(type);

        if (! this[fieldName]) {
            return null;
        }

        if (! this.beanMeta.typeBeanList[type] || force) {
            let id = this[Bean.getTypeFieldName(type)];

            if (! id) {
                return null;
            }

            this.beanMeta.typeBeanList[type] = await this.R().load(type, id);
        }

        return this.beanMeta.typeBeanList[type];
    }

    async refresh() {
        let updatedBean = await this.R().load("book", this.id);

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

    async ownList(alias : string, type? : string, force = false) {
        if (! type) {
            type = alias;
        }
    }


    getType() {
        return this.beanMeta.type;
    }

    R() {
        return this.beanMeta.R;
    }


    static getTypeFieldName(type : string) {
        return this.prefixUnderscore(type + "Id");
    }

    static prefixUnderscore(name : string) {
        return "_" + name;
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

    toString() {
        return JSON.stringify(this.export());
    }

    inspect() {
        return this.export()
    }
}

class BeanMeta {

    #_R! : RedBeanNode;
    #_type! : string;
    #_typeBeanList : any = {};

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
        this.#_type = value;
    }

    refresh() {
        this.#_typeBeanList = {};
    }
}
