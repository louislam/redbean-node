/**
 * From: https://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object
 * @param obj
 */
import dayjs from "dayjs";

export function isEmptyObject(obj : LooseObject) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop)) {
            return false;
        }
    }

    return JSON.stringify(obj) === JSON.stringify({});
}

export interface LooseObject<T = any> {
    [key: string]: T
}

export class SlowLogger {

    static enable = false;
    static threshold = 10000;

    private startTime: any;
    constructor() {
        this.startTime = dayjs().valueOf();
    }

    log(sql) {
        const time = (dayjs().valueOf() - this.startTime);

        if (time >= SlowLogger.threshold) {
            console.log(`[Slow Log][${time}ms] ${sql}`)
        }
    }
}
