import {LazyLoadArray} from "./lazy-load-array";
import {Bean} from "./bean";

export class SharedList extends LazyLoadArray {

    via : string;

    constructor(parentBean: Bean, type: string, via : string) {
        super(parentBean, type);
        this.via = via;
    }

    async load(force: boolean = false) {

        // Not yet save, must empty
        if (! this.parentBean._id) {
            this.devLog("Parent Bean no id", this.parentBean._id);
            return this;
        }

        if (! this.loaded || force) {
            this.loaded = true;

            let id1 = this.type + ".id";     // tag.id
            let id2 =  this.via + "." + this.type + "_id";    // product_tag.tag_id

            let queryPromise = this.R.knex.table(this.type).select(this.type + ".*")
                .join(this.via, id1, "=", id2)
                .where(id1, "=", "?", [
                    this.parentBean._id
                ])
               // .whereRaw("1=1")

            this.R.queryLog(queryPromise);

            try  {
                let list = await queryPromise;
                list = this.R.convertToBeans(this.type, list);

                for (let item of list) {
                    this.push(list);
                }
            } catch (error) {
                this.R.checkAllowedError(error);
                this.loaded = false;
            }

        }
        return this;
    }

}
