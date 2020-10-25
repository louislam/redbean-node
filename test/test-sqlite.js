const {R}= require("../dist/redbean-node");
const assert = require('assert');
const fs = require("fs");

describe("Setup SQLite", () => {

    it("#R.setup()", () => {
        R.freeze(false);
        R.debug(false);

        if (fs.existsSync("dbfile.db"))
            fs.unlinkSync("dbfile.db")
        R.setup();
        assert.equal(R.dbType, "sqlite");
    });

    let commonDir = "common";
    let normalizedPath = require("path").join(__dirname, commonDir);

    fs.readdirSync(normalizedPath).forEach(function(file) {
        require(`./${commonDir}/` + file)();
    });


});

describe("Close Connection", () => {

    it("#R.close()", async () => {
        await R.close();
    });

});





