# Transaction
RedBeanNode offers three simple methods to use database transactions: **begin()**, **commit()** and **rollback()**.

Use **trx.** instead of **R.**:

```javascript
let trx = await R.begin();

try {
    let page = trx.dispense("page");
    await trx.store(page);
    await trx.commit();
} catch (error) {
    await trx.rollback();
}
```

> Note: Transaction is working only if you have set **R.freeze(true)**


## Transaction closure
You can also use this variation:

```javascript
await R.transaction(async (trx) => {
    let page = trx.dispense("page");
    
    await trx.store(page);
    
    // Throw error if you want to rollback
    // If you want to commit, comment out the following line
    throw "this is an error"
});
```
