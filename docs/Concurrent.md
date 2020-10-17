# Concurrent

This part is not in RedBeanPHP originally, because PHP is a blocking programming language. Node.js allows us executing multiple queries at the same time!

> Following example only works with MySQL/MariaDB due to SLEEP() function.

Without concurrent, the queries will be executed one by one:

```javascript
let result = [
    await R.getAll("SELECT 1, SLEEP(2)"),
    await R.getAll("SELECT 2, SLEEP(2)"),
    await R.getAll("SELECT 3, SLEEP(2)"),
    await R.getAll("SELECT 4, SLEEP(2)"),
    await R.getAll("SELECT 5, SLEEP(2)"),
];

// After 10 seconds
console.log(result);
```

## Promise.all()

In above context, the execution sequence of these queries actually does not matter. We can use JavaScript's built-in function **Promise.all()** to execute them at the same time.

```javascript
let result = await Promise.all([
    R.getAll("SELECT 1, SLEEP(2)"),
    R.getAll("SELECT 2, SLEEP(2)"),
    R.getAll("SELECT 3, SLEEP(2)"),
    R.getAll("SELECT 4, SLEEP(2)"),
    R.getAll("SELECT 5, SLEEP(2)"),
]);

// After 2 seconds
console.log(result);
```

By default, the max concurrent is limited by the pooling config. Default value is **10**. Read more in [Connection](Connection.md#connection-pool) section.

