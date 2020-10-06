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

    set(bean : Bean) {
        let type = bean.getType();

        if (bean.id) {
            if (this.getType() == bean.getType() && this.id === bean.id) {
                throw "Error, same type and id";
            }

            this[this.getTypeFieldName(type)] = bean.id;
        }

        this.#typeBeanList[type] = bean;
    }

    async storeTypeBeanList(noIDOnly = true) {
        for (let type in this.#typeBeanList) {
            let bean = this.#typeBeanList[type];

            if (! bean.id) {
                await this.#R.store(bean);
                this[this.getTypeFieldName(type)] = bean.id;
            }
        }
    }

    getTypeFieldName(type : string) {
        return type + "_id";
    }

    async get(type : string) {
        if (! this.#typeBeanList[type]) {
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
