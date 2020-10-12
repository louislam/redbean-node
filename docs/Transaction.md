# Transaction
RedBeanNode offers three simple methods to use database transactions: **begin()**, **commit()** and **rollback()**. Usage:

```javascript
await R::begin();
try {
    await R::store(page);
    await R::commit();
} catch (error) {
    await R::rollback();
}
```

> Note: Transaction is working only if you have set **R.freeze(true)**


## Transaction closure
You can also use this variation:

```javascript
await R.transaction(async () => {
    await R.store(page);

    // Throw error if you want to rollback
    // If you want to commit, comment out the following line
    throw "this is an error"
});
```
