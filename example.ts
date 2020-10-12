import { R } from "./lib/redbean-node";

(async () => {
    R.setup();


    let book = R.dispense("book");
    book.title = "Learn to Program";
    book.title = "Learn to Program";
    book.rating = 10;
    book.active = true;
    book.price = 29.99;

    console.log(book);

    try {
        // Create
        let id = await R.store(book);
        console.log(id);

        // Update
        book.title = "Learn to Program 2";
        book.active = false;

        await R.store(book);


        // Refresh
        await book.refresh();
        console.log(book);

        // Load
        console.log("load");
        let book2 = await R.load( 'book', id);
        console.log(book2);

        if (book2 != null) {

            // Trash
            await R.trash(book2);
        }

        // Find
        let bookList = await R.find("book", " rating > 4 ");
        console.log(bookList);
        bookList = await R.find( 'book', ' title LIKE ? ', [ '%2' ] );
        console.log(bookList);

        // Find One
        let book3 = await R.findOne("book", " price = ? ", [29.99]);
        console.log(book3);

        // Find All
        bookList = await R.findAll( 'book' , ' ORDER BY title DESC LIMIT 10 ' );
        console.log(bookList);

        await R.exec("INSERT INTO book(title) VALUES(?)", [
            "RAW INSERT"
        ]);

        console.log("SELECT get All");
        let objList  = await R.getAll("SELECT * FROM book WHERE id = 1");
        console.log(objList);

        let obj  = await R.getRow("SELECT * FROM book WHERE id = 1");
        console.log(obj);

        let col = await R.getCol('SELECT title FROM book');
        console.log(col);

        let cell = await R.getCell('SELECT title FROM book LIMIT 1', [], false);
        console.log(cell);

        let assoc = await R.getAssoc( 'SELECT id, title FROM book' );
        console.log(assoc);

        console.log(await R.inspect("book"));

        //R.freeze(true);

        // Transaction
        await R.transaction(async () => {
            let page = R.dispense("page");
            page.title = "About us in callback 3";
            await R.store(page);
            throw "this is an error"
        });

        await R.begin();
        let page = R.dispense("page");
        page.title = "About us";
        await R.store(page);

        //await R.commit();
        await R.rollback();


        // Many-to-one
        R.freeze(false);

        book = R.dispense("book");
        book.title = "Learn to Program 2";
        book.active = false;

        page = R.dispense("page");
        page.title = "Many-to-one";

        book.set("page", page);
        book.set("page2", page);

        console.log(book);
        await R.store(book);
        console.log(book);
        //book.set("page2", null);
        await R.store(book);
        console.log(book);

        console.log(page);
        console.log(await book.get("page"));

        let b2 = await R.load("book", book.id);

        if (b2) {
            console.log(await b2.get("page2", "page"));
        }


        let shop = R.dispense("shop");
        shop.name = "My Shop"

        let product = R.dispense("product");
        product.name = "Apple";

        shop.add(product);

        let list = await shop.ownList("product");

    } catch (error) {
        console.log(error);
    }

    await R.close();
})();




