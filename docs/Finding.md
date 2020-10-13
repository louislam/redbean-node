# Finding
If you do not know the **ID** of a bean, you can search for beans using the **find** method:

```javascript
let bookList  = await R.find('book', ' rating > 4 ');
```

## Find and SQL
The following example demonstrates how to use find() with bindings.

```javascript
let books = await R.find('book', ' title = ? ', [ 'Learn to fly' ]);
let books = await R.find('book', ' title LIKE ? ', [ 'Learn to%' ]);
```

This find operation will return all beans of type 'book' having a title that begins with the phrase: 'Learn to'.

If find() has no results it will return an **empty array**.

## Find One
If you want a single bean instead of an array, use:

```javascript
let book  = await R.findOne('book', ' title = ? ', [ 'SQL Dreams' ]);
```

If no beans match the criteria, this function will return **null**.


## Find All
Use **findAll** if you don't want to add any conditions (but you want to order or limit... )

```javascript
let books = R.findAll('book');
let books = R.findAll('book' , ' ORDER BY title DESC LIMIT 10 ');
```

## Named slots
TODO

## Cursors 
TODO: http://knexjs.org/#Interfaces-stream

## IN-queries
TODO
