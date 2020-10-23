/**
 * From: https://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object
 * @param obj
 */
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
