# Counting
Counting records is very easy with RedBeanNode. For instance, to count all beans of type book use:

```javascript
let numOfBooks = R.count('book');
```

You can use additional SQL here as well:

```javascript
let numOfBooks = R.count('book', ' pages > ? ', [ 250 ]);
```
