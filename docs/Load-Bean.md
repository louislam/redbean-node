# Load a Bean

To load a bean, simply pass the **type** and **ID** of the bean you're looking for:

```javascript
let book = await R.load('book', id);
// or with condition
let bookList  = await R.find('book', ' rating > 4 ');
```

Read more in [Finding](Finding.md) section.
