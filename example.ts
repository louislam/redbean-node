import { R } from "./lib/redbean-node";

(async () => {
    R.setup();

    let book = R.dispense("book");
    book.title = "Learn to Program";
    book.rating = 10;
    book.active = true;
    book.price = 29.99;

    try {
        // Create
        let id = await R.store(book);
        console.log(id);

        // Update
        book.title = "Learn to Program 2";
        book.active = false;
        await R.store(book);

        // Load
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

    } catch (error) {
        console.log(error);
    }

    await R.close();
})();




