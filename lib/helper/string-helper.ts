/**
 * From: https://stackoverflow.com/questions/18379254/regex-to-split-camel-case
 * @param input
 */
export function splitCamelCase(input : string) {
    let list = input.match(/^[A-Z]?[^A-Z]*|[A-Z][^A-Z]*/g);

    if (list === null) {
        return [];
    }

    return list.map((item) => {
        return item.toLowerCase();
    });
}

export function camelCaseToUnderscore(input : string) {
    return splitCamelCase(input).join("_");
}

export function underscoreToCamelCase(input : string) {
    return input.split("_").map((word, index) => {
        if (index > 0) {
            return word.charAt(0).toUpperCase() + word.slice(1)
        } else {
            return word;
        }
    }).join("");
}
