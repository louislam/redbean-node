import {RedBeanNode} from "./redbean-node";

export class Bean {
    [key: string]: any;

    #R : RedBeanNode;
     readonly #type : string;
     readonly #typeBeanList : any = {};

    constructor(type : string, R : RedBeanNode) {
        this.#R = R;
        this.#type = type;
    }

    getType() {
        return this.#type;
    }

    set(alias : string, bean : Bean | null) {
        if (bean) {
            if (bean.id) {
                if (this.getType() == bean.getType() && this.id === bean.id) {
                    throw "Error, same type and id";
                }

                this[this.getTypeFieldName(alias)] = bean.id;
            }

            this.#typeBeanList[alias] = bean;
        } else {
            delete this.#typeBeanList[alias];
            this[this.getTypeFieldName(alias)] = null;
        }
    }

    async storeTypeBeanList(noIDOnly = true) {
        for (let type in this.#typeBeanList) {
            let bean = this.#typeBeanList[type];

            if (! bean.id) {
                await this.#R.store(bean);
            }

            this[this.getTypeFieldName(type)] = bean.id;
        }
    }

    getTypeFieldName(type : string) {
        return type + "_id";
    }

    async get(alias : string, type? : string, force = false) {
        if (! type) {
            type = alias;
        }

        let fieldName = this.getTypeFieldName(type);

        if (! this[fieldName]) {
            return null;
        }

        if (! this.#typeBeanList[type] || force) {
            let id = this[this.getTypeFieldName(type)];

            if (! id) {
                return null;
            }

            this.#typeBeanList[type] = await this.#R.load(type, id);
        }

        return this.#typeBeanList[type];
    }

    async refresh() {
        let updatedBean = await this.#R.load("book", this.id);
        Object.assign(this, updatedBean);
    }
}
