# Database
This chapter discusses general database functionality of RedBeanNode.

## Reflection
To get all the columns of table '**book**':

```javascript
let fields = await R.inspect('book');
```

## Multiple databases

**R** is just a **RedBeanNode** object exported from the module. You can create another RedBeanNode object for another connection:

```javascript
const R2 = new RedBeanNode();
R2.setup();
// do anything query on R2
```
