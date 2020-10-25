const assert = require('assert');
const {R} = require("../../dist/redbean-node");

module.exports = () => {

    describe('Test RedBeanNode', () => {
        describe('#R.dispense()', () => {
            it('dispense a product bean', () => {
                let product = R.dispense("product");
                assert.equal(product.beanMeta.type, "product");
            });
        });

        describe('#R.freeze()', () => {
            it('set freeze to true', () => {
                R.freeze(true);
                assert.equal(R._freeze, true)
            });
        });
    });

}


