# Raw Query
Querying the database manually is also possible with RedBeanNode. You can use the SQL query functions provided by **RedBeanNode**. To execute a query:

```javascript
await R.exec('UPDATE page SET title="test" WHERE id = 1');
```

To get an array of rows:

```javascript
let rows = await R.getAll('SELECT * FROM page');
```

The result of such a query will be an array of rows:

```javascript
[
    {
        id: 1,
        title: 'Learn to Program',
        rating: 10,
        price: 29.99,
    },
    {
        id: 2,
        title: 'Learn to fly',
        rating: 9,
        price: 32,
    },
]
```

Note that you can use **parameter bindings** as well:

```javascript
let rows = await R.getAll('SELECT * FROM page WHERE title = ?', [
    'Learn to fly'
]);
```

To fetch a **single row**:

```javascript
let row = await R.getRow('SELECT * FROM page WHERE title LIKE ? LIMIT 1', [
     '%Jazz%',
]);
```

To fetch a **single column**:

```javascript
let cols = await R.getCol('SELECT title FROM page');
```

To fetch a **single cell**:

```javascript
let value = await R.getCell('SELECT title FROM page LIMIT 1');
```

To get a **key-value object** with a specified key and value column use:

```javascript
let keyValueObject = await R::getAssoc('SELECT id, title FROM page');
```

## Converting records to beans
You can convert rows to beans using the **R.convertToBeans()** function:

```javascript
let rows = await R.getAll('SELECT * FROM page WHERE title = ?', [ 'Learn to fly' ]);
let pages = R.convertToBeans("page", rows);
```

You can also use **R::convertToBean()** for single row.

```javascript
let row = await R.getRow('SELECT * FROM page WHERE title = ? LIMIT 1', [ 'Learn to fly' ]);
let page = R.convertToBean("page", row);
```
