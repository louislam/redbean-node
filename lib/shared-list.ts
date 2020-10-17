import {LazyLoadArray} from "./lazy-load-array";
import {Bean} from "./bean";

export class SharedList extends LazyLoadArray {

    via : string;

    constructor(parentBean: Bean, type: string, via : string) {
        super(parentBean, type);
        this.via = via;
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

            let id1 = this.type + ".id";     // tag.id
            let id2 =  this.via + "." + this.type + "_id";    // product_tag.tag_id
            let parentBeanFieldName = this.parentBean.beanMeta.type + "_id";

            let queryPromise = this.R.knex.table(this.type).select(this.type + ".*")
                .join(this.via, id1, "=", id2)
                .where(parentBeanFieldName, this.parentBean._id);
               // .whereRaw("1=1")

            this.R.queryLog(queryPromise);

            try  {
                let list = await queryPromise;

                console.log("Result length: ", list.length)

                list = this.R.convertToBeans(this.type, list);

                for (let item of list) {
                    this.list.push(item);
                }

            } catch (error) {
                this.R.checkAllowedError(error);
                this.loaded = false;
            }

        }
        return this.list;
    }

    async store() {
        this.devLog("Store Shared List");

        let id1 = this.parentBean.beanMeta.type + "_id";
        let id2 = this.type + "_id";

        // Add
        while (this._pendingAddList.length > 0) {
            let bean = this._pendingAddList.pop();

            if (! bean) {
                continue;
            }

            if (! bean.id) {
                await this.R.store(bean);
            }

            let viaBean = this.R.dispense(this.via);
            viaBean[id1] = this.parentBean._id;
            viaBean[id2] = bean.id;

            await this.R.store(viaBean);
        }

        let promiseList : Promise<any>[] = [];

        // Remove
        while (this._pendingRemoveList.length > 0) {
            let bean = this._pendingRemoveList.pop();

            if (! bean || ! bean.id) {
                continue;
            }

            let queryPromise = this.R.knex(this.via)
                .where(id1, this.parentBean._id)
                .where(id2, bean.id)
                .del()

            this.R.queryLog(queryPromise);

            promiseList.push(queryPromise);
        }

        await this.R.concurrent(promiseList);
    }

}
