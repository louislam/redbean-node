const assert = require('assert');
const {Bean} = require("../../dist/bean");
const {expect} = require("chai");
const {R} = require("../../dist/redbean-node");
const dayjs = require('dayjs');
const {OwnList} = require("../../dist/own-list");

module.exports = () => {

    describe('Test RedBeanNode', () => {

        it("has knex", () => {
            expect(R.knex).to.be.not.undefined;
        })

        describe('#R.dispense()', () => {
            it('dispenses a bean with type', () => {
                let product = R.dispense("product");
                assert.strictEqual(product.beanMeta.type, "product");
            });

            it("throws exception", () => {
                expect(() => R.dispense(".")).to.throw();
                expect(() => R.dispense("")).to.throw();
            })

            it("does not throw exception", () => {
                expect(() => R.dispense("page")).to.not.throw();
                expect(() => R.dispense("my_product")).to.not.throw();
                expect(() => R.dispense("my-product")).to.not.throw();
            })

            it("dispenses a working bean", () => {
                let bean = R.dispense("testbean");
                expect(bean).to.be.instanceof(Bean)
                expect(bean.id).to.be.undefined

                bean.property = 123
                expect(bean["property"]).to.equal(123)
                expect(bean.property).to.equal(123)

                bean["abc"] = "def";
                expect(bean["abc"]).to.equal("def")
                expect(bean.abc).to.equal("def")

                expect("abc" in bean).to.be.true
                expect("property" in bean).to.be.true

            });
        });

        describe('#R.store()', () => {
            it('stores a bean to database', async () => {
                let book = R.dispense('book');
                book.title = 'Learn to Program';
                book.rating = 10;
                book['price'] = 29.99;
                let id = await R.store(book);

                expect(id).gte(1)
                expect(book.id).gte(1)

                let book2 = R.dispense('book');
                book2.title = 'Learn to Program 2';
                book2.rating = 10;
                book2['price'] = 29.99;
                let id2 = await R.store(book2);

                expect(id2).gte(1)
                expect(book2.id).gte(1)

                let bookFromDB = await R.load("book", id);
                let book2FromDB = await R.load("book", id2);

                expect(bookFromDB).not.to.be.undefined;
                expect(book2FromDB).not.to.be.undefined;

                expect(bookFromDB.id).to.equal(id)
                expect(book2FromDB.id).to.equal(id2)

                // Store again
                book.title = 'Learn to Program 3';
                await R.store(book);
                bookFromDB = await R.load("book", book.id);

                expect(bookFromDB.title).to.equal("Learn to Program 3")
                expect(bookFromDB.rating).to.equal(10)
                expect(bookFromDB.price).to.equal(29.99)
                expect(bookFromDB["title"]).to.equal("Learn to Program 3")
                expect(bookFromDB["rating"]).to.equal(10)
                expect(bookFromDB["price"]).to.equal(29.99)

            });
        });

        describe("R.load()", () => {
           it("loads a bean from database", async () => {
               let book = R.dispense('book');
               book.title = 'Learn to Program';
               await R.store(book);

               let book2 = await R.load("book", book.id);
               let book3 = await R.findOne('book', ' id = ? ', [
                   book.id
               ]);

               expect(book2.id).to.equal(book3.id);

               let book4 = await R.findOne('book', ' id = 0 ', );
               expect(book4).to.be.null
           })
        })

        describe("R.find()", () => {
            it("find without binding", async () => {
                let bean = R.dispense("test_find");
                bean.active = true;
                await R.store(bean);
                bean = R.dispense("test_find");
                bean.active = true;
                await R.store(bean);

                let list  = await R.find('test_find', ' active = 1 ');

                expect(list.length).gt(0);

                list  = await R.findAll('test_find', ' LIMIT 1 ');
                expect(list.length).to.equal(1);
            })

            it("find with binding", async () => {
                let bean = R.dispense("test_find");
                bean.active = true;
                await R.store(bean);
                bean = R.dispense("test_find");
                bean.active = true;
                await R.store(bean);

                let list  = await R.find('test_find', ' active = ? ', [
                    true
                ]);

                expect(list.length).gt(0);
            })
        })

        describe("Raw Query", () => {
            describe("#R.getCell()", () => {
                it('SELECT 1', async () => {
                    let result = await R.getCell("SELECT 1");
                    assert.strictEqual(result, 1);
                });

                it("SELECT 'abc'", async () => {
                    let result = await R.getCell("SELECT 'abc'");
                    assert.strictEqual(result, "abc");
                });
            })

            it("R.exec", async () => {

                let bean = R.dispense("page");
                bean.title = "test R.exec";
                await R.store(bean);

                await R.exec('UPDATE page SET title = ? WHERE title = ?' , [
                    "ok!",
                    "test R.exec"
                ]);

                await bean.refresh();
                expect(bean.title).to.equal("ok!");

                // without binding
                await R.exec('UPDATE page SET title = \'ok!ok!\' WHERE title = \'ok!\'');

                await bean.refresh();
                expect(bean.title).to.equal("ok!ok!");
            });

            it("getAll()", async () => {

                let promiseList = [];

                for (let i = 1; i <= 10; i++) {
                    let bean = R.dispense("test_getall");
                    bean.title = "test R.getAll";
                    promiseList.push(R.store(bean));
                }

                let bean = R.dispense("test_getall");
                bean.title = "other name";
                promiseList.push(R.store(bean));

                await Promise.all(promiseList);

                let rows = await R.getAll('SELECT * FROM `test_getall` WHERE title = ? ', [
                    "test R.getAll"
                ]);

                expect(rows.length).to.equal(10);

            });

            it("getCol()", async () => {

                let promiseList = [];

                for (let i = 1; i <= 10; i++) {
                    let bean = R.dispense("test_getcol");
                    bean.title = "test R.getCol";
                    promiseList.push(R.store(bean));
                }

                let bean = R.dispense("test_getcol");
                bean.title = "other name";
                promiseList.push(R.store(bean));

                await Promise.all(promiseList);

                let cols = await R.getCol('SELECT title FROM `test_getcol` WHERE title = ? ', [
                    "test R.getCol"
                ]);

                expect(Array.isArray(cols)).to.be.true;
                expect(cols.length).to.equal(10);
                expect(cols[0]).to.equal("test R.getCol");
            });

            it("getRow()", async () => {

                let promiseList = [];

                for (let i = 1; i <= 2; i++) {
                    let bean = R.dispense("test_getrow");
                    bean.title = "get a row";
                    promiseList.push(R.store(bean));
                }

                let bean = R.dispense("test_getrow");
                bean.title = "other name";
                promiseList.push(R.store(bean));

                await Promise.all(promiseList);

                let row = await R.getRow('SELECT * FROM test_getrow WHERE title LIKE ? LIMIT 1', [
                    '%row%',
                ]);

                expect(row.title).includes("row");

                row = await R.getRow('SELECT * FROM test_getrow WHERE title LIKE ? LIMIT 1', [
                    '%123%',
                ]);

                expect(row).to.be.not.ok

            });

            it("getAssoc()", async () => {

                let promiseList = [];

                for (let i = 1; i <= 5; i++) {
                    let bean = R.dispense("get_assoc");
                    bean.title = "get_assoc";
                    promiseList.push(R.store(bean));
                }

                let bean = R.dispense("get_assoc");
                bean.title = "other name";
                promiseList.push(R.store(bean));

                await Promise.all(promiseList);

                let keyValueObject = await R.getAssoc('SELECT id, title FROM get_assoc');
                expect(Object.keys(keyValueObject).length).to.equal(6);

                keyValueObject = await R.getAssoc('SELECT id, title FROM get_assoc WHERE title = ?', [
                    "get_assoc"
                ]);
                expect(Object.keys(keyValueObject).length).to.equal(5);

            });
        });

        it("convertToBean", async () => {
            let bean = R.dispense("convert");
            bean.title = "convert"
            await R.store(bean);

            bean = R.dispense("convert");
            bean.title = "convert"
            await R.store(bean);

            let rows = await R.getAll('SELECT * FROM `convert` WHERE title = ?', [ 'convert' ]);
            let convertBeanList = R.convertToBeans("convert", rows);

            expect(convertBeanList.length).to.equal(2);
            expect(convertBeanList[0].beanMeta.type).to.equal("convert");
            expect(convertBeanList[0].id).gt(0);
            expect(convertBeanList[0].title).to.equal("convert")
        });

        it("R.storeAll", async () => {
            let bean = R.dispense("store_all");
            let bean2 = R.dispense("store_all");
            let bean3 = R.dispense("store_all");

            await R.storeAll([
                bean,
                bean2,
                bean3
            ]);

            expect(bean.id).gt(0);
            expect(bean2.id).gt(0);
            expect(bean3.id).gt(0);
        });

        describe('#isoDateTime', () => {
            it('get the correct datetime with new Date()', () => {
                let d = new Date(2018, 11, 24, 10, 33, 30, 0);
                expect(R.isoDateTime(d)).to.equal("2018-12-24 10:33:30");
                expect(R.isoDate(d)).to.equal("2018-12-24");
                expect(R.isoTime(d)).to.equal("10:33:30");
            });

            it('get the correct datetime with new Dayjs', () => {
                let d = dayjs(new Date(2018, 11, 24, 10, 33, 30, 0));
                expect(R.isoDateTime(d)).to.equal("2018-12-24 10:33:30");
                expect(R.isoDate(d)).to.equal("2018-12-24");
                expect(R.isoTime(d)).to.equal("10:33:30");
            });
        });


    });


    describe('Data Type', () => {
        it('test', () => {
            expect(R.getDataType(true)).to.equal("boolean");
            expect(R.getDataType(false)).to.equal("boolean");
            expect(R.getDataType(0)).to.equal("boolean");
            expect(R.getDataType(1)).to.equal("boolean");
            expect(R.getDataType(2)).to.equal("integer");
            expect(R.getDataType(2147483647)).to.equal("integer");
            expect(R.getDataType(2147483648)).to.equal("bigInteger");
            expect(R.getDataType(12147483648)).to.equal("bigInteger");
            expect(R.getDataType(0.1)).to.equal("float");
            expect(R.getDataType(0.11)).to.equal("float");
            expect(R.getDataType(0.111)).to.equal("float");
            expect(R.getDataType(0.01)).to.equal("float");
            expect(R.getDataType(1.01)).to.equal("float");
            expect(R.getDataType(2.01)).to.equal("float");
            expect(R.getDataType(2147483647.1)).to.equal("float");
            expect(R.getDataType(2147483648.1)).to.equal("float");
            expect(R.getDataType("")).to.equal("varchar");
            expect(R.getDataType("1")).to.equal("varchar");
            expect(R.getDataType("🐷🐷🐷")).to.equal("varchar");
            expect(R.getDataType("12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890")).to.equal("varchar");
            expect(R.getDataType("123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901")).to.equal("text");

            expect(R.getDataType(R.isoDateTime())).to.equal("datetime");
            expect(R.getDataType(R.isoDate())).to.equal("date");
            expect(R.getDataType(R.isoTime())).to.equal("time");


            expect(R.getDataType(0, "shop_id")).to.equal("integer");
            expect(R.getDataType(1, "shop_id")).to.equal("integer");
            expect(R.getDataType(2, "shop_id")).to.equal("integer");
            expect(R.getDataType(-1, "shop_id")).to.equal("integer");
        });

        it('isValidType', () => {
            expect(R.isValidType("boolean", "integer")).to.be.false;
            expect(R.isValidType("tinyint", "integer")).to.be.false;
        });

        it('check created column type', async () => {
            let bean = R.dispense("test_field");
            await R.store(bean);

            let info = await R.inspect("test_field");

            expect(["integer", "int"]).to.include(info["id"].type);

            bean.big = 2147483648;
            await R.store(bean);
            info = await R.inspect("test_field");
            expect(["bigint"]).to.include(info["big"].type);

            bean.string = "123";
            bean.value = "abc";
            await R.store(bean);
            info = await R.inspect("test_field");
            expect(["varchar"]).to.include(info["string"].type);
            expect(["varchar"]).to.include(info["value"].type);

            bean.float = 1.1;
            await R.store(bean);
            info = await R.inspect("test_field");
            expect(["float"]).to.include(info["float"].type);

            bean.bool = 1;
            bean.bool2 = false;
            await R.store(bean);
            info = await R.inspect("test_field");
            expect(["boolean", "tinyint"]).to.include(info["bool"].type);
            expect(["boolean", "tinyint"]).to.include(info["bool2"].type);

            bean.text = "RedBeanNode works with beans. Most interactions with the database are accomplished using beans. Beans are used to carry data from and to the database. Every bean has a type and an ID. The type of a bean tells you which table in the database is used to store the bean. Every type maps to a corresponding table. The ID of a bean is the primary key of the corresponding record. You can create a new bean by dispensing one.";
            await R.store(bean);
            info = await R.inspect("test_field");
            expect(["text", "longtext"]).to.include(info["text"].type);

            bean.dateTime = R.isoDateTime();
            await R.store(bean);
            info = await R.inspect("test_field");
            expect(["datetime"]).to.include(info["date_time"].type);

            bean.date = R.isoDate();
            await R.store(bean);
            info = await R.inspect("test_field");
            expect(["date"]).to.include(info["date"].type);

            bean.time = R.isoTime();
            await R.store(bean);
            info = await R.inspect("test_field");
            expect(["time"]).to.include(info["time"].type);

            bean.bool = 2

            try {
                await R.store(bean);
                info = await R.inspect("test_field");
                expect(["int"]).to.include(info["bool"].type);
            } catch (e) {
                if (R.dbType != "sqlite") {
                    throw e;
                }
            }

        });
    });

    describe("Relations", () => {

        it("Many-to-one", async () => {
            //R.devDebug = true;
            //R.debug(true);
            let product1 = R.dispense("product");
            let product2 = R.dispense("product");

            let shop1 = R.dispense("shop");
            let shop2 = R.dispense("shop");

            expect(product1.shop).to.be.undefined
            product1.shop = shop1;
            await R.store(product1);

            expect(product1.id).gt(0);
            expect(shop1.id).gt(0);

            let product1FromDB = await R.load("product", product1.id);
            expect(product1FromDB.id).to.equal(product1.id)
            expect(product1FromDB.shopId).to.equal(shop1.id)
            expect(product1FromDB.shop_id).to.equal(shop1.id)

            let shop1FromDB = await product1FromDB.shop;
            expect(shop1FromDB).to.not.be.undefined;
            expect(shop1FromDB.id).to.equal(shop1.id)

            // Change shop
            await R.store(shop2);
            product1.shopId = shop2.id
            await R.store(product1)

            product1FromDB = await R.load("product", product1.id);
            expect(product1FromDB.shopId).to.equal(shop2.id)

            product1.shop_id = shop1.id

            expect((await product1.shop).id).to.equal(shop1.id)
            await R.store(product1)

            product1FromDB = await R.load("product", product1.id);
            expect(product1FromDB.shopId).to.equal(shop1.id)

            // Remove shop
            expect(await product1.shop).to.be.not.undefined;
            product1.shop_id = null;
            expect(await product1.shop).to.not.be.ok;
            await R.store(product1);

            product1FromDB = await R.load("product", product1.id);
            expect(product1FromDB.shopId).to.not.be.ok;

            product1.shopId = shop2.id;
            await R.store(product1);

            product1FromDB = await R.load("product", product1.id);
            expect(product1FromDB.shopId).to.equal(shop2.id)

            product1FromDB.shop = null;
            await R.store(product1FromDB);

            product1FromDB = await R.load("product", product1.id);
            expect(product1FromDB.shopId).to.not.be.ok;

            let shop3 = R.dispense("shop")
            product1FromDB.shop3 = shop3;
            await R.store(product1FromDB);

            // Alias
            product1FromDB = await R.load("product", product1.id);
            expect(product1FromDB.shop3Id).to.equal(shop3.id);

            let shop3FromDB = await product1FromDB.fetchAs("shop").shop3;
            expect(shop3FromDB.id).to.equal(shop3.id);
        })

        it("One-to-many", async () => {
            let shop2 = R.dispense('shop2');
            shop2.name = 'Antiques';

            let vase = R.dispense('product2');
            vase.price = 25;
            expect(shop2.ownProduct2List).instanceof(OwnList);
            shop2.ownProduct2List.push(vase);
            await R.store(shop2);

            let shop2FromDB = await R.load("shop2", shop2.id);
            expect(shop2FromDB.id).to.equal(shop2.id)
            expect(shop2FromDB.ownProduct2List).instanceof(OwnList);
            let list = await shop2FromDB.ownProduct2List.toArray();

            expect(list.length).to.equal(1);
            expect(list[0].id).to.equal(vase.id)

            let vase2 = R.dispense('product2');
            shop2.ownProduct2List.push(vase2);
            await R.store(shop2);

            await shop2FromDB.refresh();
            list = await shop2FromDB.ownProduct2List.toArray();
            expect(list.length).to.equal(2);

            // Remove
            shop2FromDB.ownProduct2List.remove(vase)
            await R.store(shop2FromDB);
            list = await shop2FromDB.ownProduct2List.toArray();
            expect(list.length).to.equal(1);

            // Alias
            let t = R.dispense('person');
            let course = R.dispense('course');
            course.teacher = t;

            let course2 = R.dispense('course');
            course2.teacher = t;

            await R.storeAll([
                course,
                course2
            ])

            expect(t.id).gt(0);

            let person = await R.load("person", t.id);
            expect(person.id).gt(0);
            R.debug(true);
            let courseList = await person.alias('teacher').ownCourseList.toArray();
            expect(courseList.length).to.equal(2)
            console.log(courseList);
        });

        it("Many-to-many", async () => {

        });
    });

    // Always test it at the end
    describe('#R.freeze()', () => {
        it('set freeze to true', (done) => {
            R.freeze(true);
            assert.strictEqual(R._freeze, true)

            let bean = R.dispense("no_this_table");
            bean.date = R.isoDateTime();

            R.store(bean).then(() => {
                done(new Error('Expected method to reject.'))
            }).catch((err) => {
                done();
            })
        });
    });
}


