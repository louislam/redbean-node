
const lxd = require("./lib/lxd");
const {R} = require("../dist/redbean-node");
const assert = require('assert');
const knex = require("knex");

let dbName = "test" + Date.now();
let host, user, password;

host = process.env.MSSQL_HOST;
user = process.env.MSSQL_USER;
password = process.env.MSSQL_PASSWORD;
port = process.env.MSSQL_PORT;

describe("Start MSSQL2019 Container", function () {
    this.timeout(60000);

    it("call LXD API", async () => {
        await lxd.init();
        // Start the MSSQL container
      //  await lxd.start("mssql");
    });
})


describe("Prepare MSSQL database", () => {

    R.freeze(false);
    R.devDebug = false;
    R.debug(false);
    R._modelList  = {}

    it("create database", async () => {

        let k = knex({
            client: "mssql",
            connection: {
                host: host,
                options: {
                    port: port
                },
                user: user,
                password: password,
            }
        });
        await k.raw('CREATE DATABASE ??', [dbName]);
        await k.destroy();
    });
})

describe("MSSQL", () => {

    it("#R.setup()", async () => {

        R.setup("mssql", {
            host: host,
            options: {
                port: port
            },
            user: user,
            password: password,
            database: dbName
        });

        assert.equal(R.dbType, "mssql");
    });

    let commonDir = "common";
    let normalizedPath = require("path").join(__dirname, commonDir);

    require("fs").readdirSync(normalizedPath).forEach(function(file) {
        require(`./${commonDir}/` + file)();
    });


});

describe("Close Connection", () => {
    it("#R.close()", async () => {
        await R.close();
    });
});

describe("Cleanup MySQL database", () => {
    it("drop database", async () => {
        let k = knex({
            client: "mssql",
            connection: {
                host: host,
                options: {
                    port: port
                },
                user: user,
                password: password,
            }
        });
        await k.raw('DROP DATABASE ??', [dbName]);
        await k.destroy();
    });
})
