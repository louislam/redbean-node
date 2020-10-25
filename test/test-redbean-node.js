const {R} = require("../dist/redbean-node");
const assert = require('assert');

describe("Test RedBeanNode", () => {

    it("#R.setup() with knex object", () => {
        var knex = require('knex')({
            client: 'sqlite',
            connection: {
                filename: "./mydb.sqlite"
            }
        });

        R.setup(knex);
        assert.equal(R.dbType, "sqlite");
    });

});
