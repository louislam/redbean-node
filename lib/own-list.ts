import {LazyLoadArray} from "./lazy-load-array";
import {Bean} from "./bean";

export class OwnList extends LazyLoadArray {

    alias : string;

    constructor(parentBean: Bean, type: string, alias : string) {
        super(parentBean, type);
        this.alias = alias;
    }

    async toArray(force: boolean = false) : Promise<Bean[]> {

        // Not yet save, must empty
        if (! this.parentBean._id) {
            this.devLog("Parent Bean no id", this.parentBean._id);
            return this.list;
        }

        if (! this.loaded || force) {
            this._list = [];
            this.loaded = true;

            let field = Bean.dbFieldName(Bean.getRelationFieldName(this.alias));

            let condition = " ?? = ? ";
            let data = [
                field,
                this.parentBean._id
            ];

            if (this.withCondition) {
                condition += " AND " + this.withCondition;
                data.push(...this.withConditionData);
            }

            try  {
                this._list = await this.R.find(this.type, condition, data);
            } catch (error) {

                try {
                    this.R.checkAllowedError(error);
                } catch (e) {
                    this.loaded = false;
                    throw e;
                }

            }

        }
        return this.list;
    }

    async store() {
        this.devLog("Store Own List");

        let promiseList : Promise<any>[] = [];

        // Add
        while (this._pendingAddList.length > 0) {
            let bean = this._pendingAddList.pop();

            if (! bean) {
                continue;
            }

            bean[this.fieldName] = this.parentBean._id;
            promiseList.push(this.R.store(bean));
        }

        // Remove
        while (this._pendingRemoveList.length > 0) {
            let bean = this._pendingRemoveList.pop();

            if (! bean) {
                continue;
            }

            bean[this.fieldName] = null;
            promiseList.push(this.R.store(bean));
        }

        // Refresh the list from db next time
        this.loaded = false;

        await this.R.concurrent(promiseList);
    }

    get fieldName() {
        return this.alias + "_id";
    }
}
