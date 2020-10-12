# Many-to-one
Now let's look at this relation from the perspective of a product. A product belongs to a shop, so you can access the shop like this:

```javascript
let shop = await product.shop;
```

> Due to product.shop can return **Promise<Bean | null>** or **value**, using promise .then() is not safe in this case. However, **await** is safe here.


## Setting a parent bean
To set a parent bean:

```javascript
product.shop = someShop;
R.store(product);
```
