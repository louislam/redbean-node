const assert = require('assert');
const {Bean} = require("../../dist/bean");
const {expect} = require("chai");
const {R} = require("../../dist/redbean-node");


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
           })
        })

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

        describe('#R.freeze()', () => {
            it('set freeze to true', () => {
                R.freeze(true);
                assert.strictEqual(R._freeze, true)
            });
        });


    });

}


