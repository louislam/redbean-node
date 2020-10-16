import {magicMethods} from "./magic-methods";
import {Bean} from "./bean";
import {RedBeanNode} from "./redbean-node";

export abstract class LazyLoadArray extends Array<Bean> {

    /**
     * This is a normal bean without proxy!
     * @protected
     */
    protected parentBean : Bean;

    protected type : string;
    protected loaded = false;

    /**
     * Accept Bean or id (int)
     * @private
     */
    #pendingAddList : (number | Bean)[]= [];
    #pendingRemoveList : Bean[] = [];

    protected constructor(parentBean: Bean, type : string) {
        super(0);
        this.parentBean = parentBean;
        this.type = type;
    }

    abstract async load(force : boolean);

    push(...items : (Bean)[]): number {
        for (let item of items) {
            this.removeItem(this.#pendingRemoveList, item);
        }

        return this.#pendingAddList.push(...items);
    }

    remove(...items : Bean[]) {
        for (let item of items) {
            this.removeItem(this.#pendingRemoveList, item);
        }

        this.#pendingRemoveList.push(...items);
    }

    protected removeItem(arr : Bean[], value : Bean) {
        var i = 0;
        while (i < arr.length) {
            if (arr[i] === value || arr[i].id === value.id) {
                arr.splice(i, 1);
            } else {
                ++i;
            }
        }
        return arr;
    }

    store() {

    }

    reload() {
        return this.load(true);
    }

    get R() : RedBeanNode {
        return this.parentBean.R;
    }

    protected devLog(...params : any[]) {
        if (this.R.devDebug) {
            console.log("[SharedList]", ...params);
        }
    }
}
