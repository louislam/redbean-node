// SQLite3
// -------
const defaults = require('lodash/defaults');
const map = require('lodash/map');
const {promisify} = require('util');

const Client = require('knex/lib/client');

const Raw = require('knex/lib/raw');
const Transaction = require('./execution/sqlite-transaction');
const SqliteQueryCompiler = require('./query/sqlite-querycompiler');
const SchemaCompiler = require('./schema/sqlite-compiler');
const ColumnCompiler = require('./schema/sqlite-columncompiler');
const TableCompiler = require('./schema/sqlite-tablecompiler');
const SQLite3_DDL = require('./schema/ddl');
const Formatter = require('knex/lib/formatter');
const Database = require('@louislam/better-sqlite3-with-prebuilds');

class Client_SQLite3 extends Client {

    private db;
    options = {};

    constructor(config) {
        super(config);
        if (config.useNullAsDefault === undefined) {
            this.logger.warn(
                'sqlite does not support inserting default values. Set the ' +
                '`useNullAsDefault` flag to hide this warning. ' +
                '(see docs http://knexjs.org/#Builder-insert).'
            );
        }
    }

    _driver() {
        return Database;
    }

    schemaCompiler() {
        return new SchemaCompiler(this, ...arguments);
    }

    transaction() {
        return new Transaction(this, ...arguments);
    }

    queryCompiler(builder, formatter) {
        return new SqliteQueryCompiler(this, builder, formatter);
    }

    columnCompiler() {
        return new ColumnCompiler(this, ...arguments);
    }

    tableCompiler() {
        return new TableCompiler(this, ...arguments);
    }

    ddl(compiler, pragma, connection) {
        return new SQLite3_DDL(this, compiler, pragma, connection);
    }

    wrapIdentifierImpl(value) {
        return value !== '*' ? `\`${value.replace(/`/g, '``')}\`` : '*';
    }

    async acquireConnection() {
        if (! this.db) {
            this.db = new Database(this.connectionSettings.filename, this.options);
        }
        return this.db;
    }

    // Get a raw connection from the database, returning a promise with the connection object.
    async acquireRawConnection() {
        throw new Error("Not used");
    }

    // Used to explicitly close a connection, called internally by the pool when
    // a connection times out or the pool is shutdown.
    async destroyRawConnection(connection) {
        throw new Error("Not used");
    }

    async destroy(callback) {
        if (this.db) {
            this.db.close();
        }
    }

    // Runs the query on the specified connection, providing the bindings and any
    // other necessary prep work.
    _query(connection, obj) {
        if (!obj.sql) throw new Error('The query is empty');

        const {method} = obj;
        let callMethod = 'run';

        let list = [
            "select",
            "pragma"
        ]

        let lowerCaseSQL = obj.sql.toLowerCase().trim();

        for (let keyword of list) {
            if (lowerCaseSQL.startsWith(keyword)) {
                callMethod = 'all';
                break;
            }
        }

        try {
            if (! connection) {
                throw new Error(`Error: connection is undefined.`);
            }

            const statement = connection.prepare(obj.sql);

            if (! statement[callMethod]) {
                throw new Error(`Error calling ${callMethod} on connection.`);
            }

            if (obj.bindings) {

                // Process the binding data
                // Boolean to int
                for (let i = 0; i < obj.bindings.length; i++) {
                    if (typeof obj.bindings[i] === "boolean") {
                        obj.bindings[i] = obj.bindings[i] ? 1 : 0;
                    }
                }

                obj.response = statement[callMethod](obj.bindings);
            } else {
                obj.response = statement[callMethod]();
            }

            obj.context = this;

            return new Promise((resolve) => resolve(obj));
        } catch (e) {
            return new Promise((resolve, reject) => reject(e));
        }

    }

    _stream(connection, obj, stream) {
        if (!obj.sql) throw new Error('The query is empty');

        const client = this;
        return new Promise(function (resolver, rejecter) {
            stream.on('error', rejecter);
            stream.on('end', resolver);
            return client
                ._query(connection, obj)
                .then((obj : any) => obj.response)
                .then((rows) => rows.forEach((row) => stream.write(row)))
                .catch(function (err) {
                    stream.emit('error', err);
                })
                .then(function () {
                    stream.end();
                });
        });
    }

    // Ensures the response is returned in the same format as other clients.
    processResponse(obj, runner) {
        const ctx = obj.context;
        const {response} = obj;
        if (obj.output) return obj.output.call(runner, response);
        switch (obj.method) {
            case 'select':
                return response;
            case 'first':
                return response[0];
            case 'pluck':
                return map(response, obj.pluck);
            case 'insert':
                return [obj.response.lastInsertRowid];
            case 'del':
            case 'update':
            case 'counter':
                return ctx.changes;
            default:
                return response;
        }
    }

    poolDefaults() {
        return defaults({min: 1, max: 1}, super.poolDefaults());
    }

    formatter(builder) {
        return new Formatter(this, builder);
    }

    values(values, builder, formatter) {
        if (Array.isArray(values)) {
            if (Array.isArray(values[0])) {
                return `( values ${values
                    .map(
                        (value) =>
                            `(${this.parameterize(value, undefined, builder, formatter)})`
                    )
                    .join(', ')})`;
            }
            return `(${this.parameterize(values, undefined, builder, formatter)})`;
        }

        if (values instanceof Raw) {
            return `(${this.parameter(values, builder, formatter)})`;
        }

        return this.parameter(values, builder, formatter);
    }
}

Object.assign(Client_SQLite3.prototype, {
    dialect: 'sqlite3',
    driverName: 'sqlite3',
});

module.exports = Client_SQLite3;
