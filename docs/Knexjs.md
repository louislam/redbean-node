## Knex.js

RedBeanNode is built on top of Knex.js. If you need advanced features, you can easily switch back to Knex.js: 

```javascript
// It is a knex object
R.knex
```
You do not need to setup the connection again. It is ready to use.

```javascript
let result = await R.knex.select('name').from('user')
    .whereIn('id', [1, 2, 3])
    .orWhereIn('id', [4, 5, 6])
```


For more powerful features, please read the documentation: https://knexjs.org
