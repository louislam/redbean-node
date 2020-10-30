import {magicMethods} from "./magic-methods";
import {Bean} from "./bean";
import {RedBeanNode} from "./redbean-node";
import {RawBinding} from "knex";

export abstract class LazyLoadArray {

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
    protected _pendingAddList : Bean[]= [];
    protected _pendingRemoveList : Bean[] = [];
    protected _list : Bean[] = [];

    public withCondition = "";
    public withConditionData : RawBinding[] = [];

    protected constructor(parentBean: Bean, type : string) {
        this.parentBean = parentBean;
        this.type = type;
    }

    abstract async toArray(force : boolean);
    abstract async store();

    push(...items : (Bean)[]): number {
        for (let item of items) {
            this.removeItem(this._pendingRemoveList, item);
        }

        return this._pendingAddList.push(...items);
    }

    remove(...items : Bean[]) {
        this.devLog("Remove item from LazyLoadArray");

        for (let item of items) {
            this.removeItem(this._pendingAddList, item);
        }

        this._pendingRemoveList.push(...items);
    }

    protected removeItem(arr : Bean[], value : Bean) {
        var i = 0;
        while (i < arr.length) {
            if (arr[i] === value || (value.id && arr[i].id === value.id)) {
                arr.splice(i, 1);
            } else {
                ++i;
            }
        }
        return arr;
    }

    refresh() {
        return this.toArray(true);
    }

    get R() : RedBeanNode {
        return this.parentBean.R;
    }

    protected devLog(...params : any[]) {
        if (this.R.devDebug) {
            console.log("[SharedList]", ...params);
        }
    }

    get list(): Bean[] {
        return this._list;
    }

    get pendingRemoveList(): Bean[] {
        return this._pendingRemoveList;
    }

    get pendingAddList(): (number | Bean)[] {
        return this._pendingAddList;
    }

}
