import {PassThrough, TransformCallback} from "stream";

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

    static createStream(type, R, queryPromise) {
        return new Promise<BeanConverterStream>((resolve, reject) => {
            let converterStream = new BeanConverterStream(type, R);

            queryPromise.stream((stream) => {
                resolve(stream.pipe(converterStream));
            });
        });
    }
}
