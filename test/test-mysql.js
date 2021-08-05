require('dotenv').config();
const {R} = require("../dist/redbean-node");
const assert = require('assert');
const knex = require("knex");

let dbName = "test" + Date.now();
let host, user, password, port;
if (process.env.MYSQL_HOST !== undefined) {
    console.log("Using MySQL config from env")
    host = process.env.MYSQL_HOST;
    user = process.env.MYSQL_USER;
    password = process.env.MYSQL_PASSWORD;
    port = process.env.MYSQL_PORT;
} else {
    host = "192.168.0.147";
    user = "root";
    password = "PYHjnKBBDl_1";
    port = 3306;
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
            database: dbName
        });

        assert.equal(R.dbType, "mysql");
    });

    it("#R.setup() with mariadb", () => {
        R.setup("mariadb", {
            host: host,
            user: user,
            password: password,
            database: dbName
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
            }
        });
        await k.raw('DROP DATABASE ??', [dbName]);
        await k.destroy();
    });
})
