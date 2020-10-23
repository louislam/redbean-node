const assert = require('assert');
const {underscoreToCamelCase, camelCaseToUnderscore} = require("../dist/helper/string-helper");

describe('test string-helper', () => {

    describe('#camelCaseToUnderscore()', () => {

        it('should convert to underscore style', () => {
            assert.equal(camelCaseToUnderscore("nodeJS"), "node_j_s");
            assert.equal(camelCaseToUnderscore("nodeJs"), "node_js");
            assert.equal(camelCaseToUnderscore("node"), "node");
            assert.equal(camelCaseToUnderscore("getLastName"), "get_last_name");
            assert.equal(camelCaseToUnderscore("n"), "n");
            assert.equal(camelCaseToUnderscore("n1"), "n1");
            assert.equal(camelCaseToUnderscore("123"), "123");
        });

    });

    describe('#underscoreToCamelCase()', () => {

        it('should convert to camelCase style', () => {
            assert.equal(underscoreToCamelCase("node_js"), "nodeJs");
            assert.equal(underscoreToCamelCase("node_j_s"), "nodeJS");
            assert.equal(underscoreToCamelCase("node"), "node");
            assert.equal(underscoreToCamelCase("get_last_name"), "getLastName");
            assert.equal(underscoreToCamelCase("n"), "n");
            assert.equal(underscoreToCamelCase("123"), "123");
        });

    });

});
