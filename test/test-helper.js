const assert = require('assert');
const {isEmptyObject} = require("../dist/helper/helper");


class TestObject {

}

class TestObject2 {
    id = 2;
}

describe('test helper', () => {

    describe('#isEmptyObject()', () => {

        it('should work', () => {
            assert.equal(isEmptyObject({}), true);
            assert.equal(isEmptyObject({ id : 1}), false);
            assert.equal(isEmptyObject(new TestObject()), true);
            assert.equal(isEmptyObject(new TestObject2()), false);
        });

    });

});
