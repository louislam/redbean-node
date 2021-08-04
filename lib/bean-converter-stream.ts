import {PassThrough, TransformCallback} from "stream";
import {Knex} from "knex";
import QueryBuilder = Knex.QueryBuilder;
import {RedBeanNode} from "./redbean-node";

export default class BeanConverterStream extends PassThrough {

    public type;
    public R;

    constructor(type, R) {
        super({
            readableObjectMode: true,
            writableObjectMode: true,
        });
        this.type = type;
        this.R = R;
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        let bean = this.R.convertToBean(this.type, chunk);
        super._transform(bean, encoding, callback);
    }

    static createStream(type : string, R : RedBeanNode, queryPromise : QueryBuilder) {
        let converterStream = new BeanConverterStream(type, R);
        let stream = queryPromise.stream();
        return stream.pipe(converterStream);
        /*
        return new Promise<BeanConverterStream>((resolve, reject) => {
            let converterStream = new BeanConverterStream(type, R);

            queryPromise.stream((stream) => {
                resolve(stream.pipe(converterStream));
            }).catch((error) => { });
        });*/
    }
}

export class GetColConverterStream extends PassThrough {

    public type;
    public R;

    constructor(type, R) {
        super({
            readableObjectMode: true,
            writableObjectMode: true,
        });
        this.type = type;
        this.R = R;
    }

    _transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback) {
        let bean = this.R.convertToBean(this.type, chunk);
        super._transform(bean, encoding, callback);
    }

    static createStream(type : string, R : RedBeanNode, queryPromise : QueryBuilder) {
        return new Promise<BeanConverterStream>((resolve, reject) => {
            let converterStream = new BeanConverterStream(type, R);

            queryPromise.stream((stream) => {
                resolve(stream.pipe(converterStream));
            }).catch((error) => { });
        });
    }

}
