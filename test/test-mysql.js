let env = {};

try {
    env = require('../.env.json');
} catch (e) {}

const {R} = require("../dist/redbean-node");
const assert = require('assert');
const knex = require("knex");

let dbName = "test" + Date.now();
let host, user, password, port;
if (env.MYSQL_HOST) {
    console.log("Using MySQL config from env")
    host = env.MYSQL_HOST;
    user = env.MYSQL_USER;
    password = env.MYSQL_PASSWORD;
    port = env.MYSQL_PORT;
}

describe("Prepare MySQL database", () => {
    R.freeze(false);
    R.devDebug = false;
    R.debug(false);
    R._modelList  = {}

    it("create database", async () => {

        let k = knex({
            client: "mysql",
            connection: {
                host: host,
                user: user,
                password: password,
                port: port,
            }
        });
        await k.raw('CREATE DATABASE ??', [dbName]);
        await k.destroy();
    });
})

describe("MySQL", () => {


    it("#R.setup()", async () => {

        R.setup("mysql", {
            host: host,
            user: user,
            password: password,
            database: dbName,
            port: port,
        });

        assert.equal(R.dbType, "mysql");
    });

    it("#R.setup() with mariadb", () => {
        R.setup("mariadb", {
            host: host,
            user: user,
            password: password,
            database: dbName,
            port: port,
        });
        assert.equal(R.dbType, "mysql");
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
            client: "mysql",
            connection: {
                host: host,
                user: user,
                password: password,
                port: port,
            }
        });
        await k.raw('DROP DATABASE ??', [dbName]);
        await k.destroy();
    });
})
