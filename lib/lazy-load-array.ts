import {magicMethods} from "./magic-methods";

@magicMethods
export class LazyLoadArray<T> {
    [key: string]: any;
    protected list : T[] = [];
    protected pendingAddList : T[] = [];
    protected pendingRemoveList : T[] = [];

    async loadData() {

    }

    __get(name) {
        console.log(name);

        // if then, loadData?!
    }

    push(...items): number {
        return this.pendingAddList.push(...items);
    }

    remove(item : T) {
        this.pendingRemoveList.push(item);
    }

    valueOf() {
        return this.list;
    }
}
