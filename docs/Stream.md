# Stream (Experiment)

> DO NOT USE ON PRODUCTION
>
> After implemented it, I realized that Stream is buggy in knex.js. Closing stream cannot release connections.

Stream is also known as Cursor. The advantage of using a cursor is that the entire collection will not be loaded into memory all at once. This is handy for dealing with large bean/row collections.

## R.findStream()

It is a stream version of R.find():

```javascript
let stream = R.findStream("book", " active = 1 ");

for await (const bean of stream) {
    console.log(bean);
}
```

## R.findAllStream()

It is a stream version of R.findAll():

```javascript
let stream = R.findStream("book", " ORDER BY id DESC ");

for await (const bean of stream) {
    console.log(bean);
}
```


## R.getAllStream()

It is a stream version of R.getAll():

```javascript
let stream = R.getAllStream(" SELECT * FROM book ORDER BY id DESC ");

for await (const row of stream) {
    console.log(row);
}
```

## IMPORTANT

If your app do not go through all records, you must close the stream manually. Otherwise, those unclosed streams may eat up all connections in your pool. 


For example:
```javascript
/* This is a negative example */

// SQLite, one connection only
R.setup();

(async () => {
    // Get a stream without using it or close it
    let stream = R.getAllStream("SELECT * FROM book ORDER BY id DESC")

    // No more free connections. Waiting for it forever!!
    let list = await R.getAll("SELECT * FROM book ORDER BY id DESC")

    // Cannot reach here!!
    console.log(list);
})();
```


Read more: https://github.com/knex/knex/wiki/Manually-Closing-Streams
