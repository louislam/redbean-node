const {R} = require("../dist/redbean-node");
const assert = require('assert');

describe("Setup SQLite", () => {

    it("#R.setup()", () => {
        R.setup();
        assert.equal(R.dbType, "sqlite");
    });

    let commonDir = "common";
    let normalizedPath = require("path").join(__dirname, commonDir);

    require("fs").readdirSync(normalizedPath).forEach(function(file) {
        require(`./${commonDir}/` + file)();
    });
});




