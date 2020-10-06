import { R } from "./redbean-node";

export class Bean {
    [key: string]: any;
     readonly #type : string;

    constructor(type : string) {
        this.#type = type;
    }

    getType() {
        return this.#type;
    }

    async refresh() {
        let updatedBean = await R.load("book", this.id);
        Object.assign(this, updatedBean);
    }
}
