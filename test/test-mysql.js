const {R} = require("../dist/redbean-node");
const assert = require('assert');

describe("Setup MySQL", () => {

    it("#R.setup()", () => {
        R.setup("mysql", {
            host: "192.168.0.12",
            user: "root",
            password: "PYHjnKBBDl",
            database: "test"
        });
        assert.equal(R.dbType, "mysql");
    });

    it("#R.setup() with mariadb", () => {
        R.setup("mariadb", {
            host: "192.168.0.12",
            user: "root",
            password: "PYHjnKBBDl",
            database: "test"
        });
        assert.equal(R.dbType, "mysql");
    });

    let commonDir = "common";
    let normalizedPath = require("path").join(__dirname, commonDir);

    require("fs").readdirSync(normalizedPath).forEach(function(file) {
        require(`./${commonDir}/` + file)();
    });


});

