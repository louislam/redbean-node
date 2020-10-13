# Debugging

The **R.debug()** method will reveal all queries being executed by RedBeanNode:

```javascript
// turns debugging ON (classic)
R.debug(true);

// turns debugging OFF
R.debug(false);
```

The queries will be printed on the console screen. The output of the debugging function looks like this:

```
Query: select * from `shop` where id = 8 limit 1
Query: select * from `product` where  shop_id = 8
```

## Inspecting Beans

The easiest way to inspect a bean is to just 'console.log' it.

```javascript
console.log(product);
```

The output look like this:

```
Bean { beanMeta: BeanMeta {}, _id: 6, _shopId: 8, _name: 'Vase' }
```
