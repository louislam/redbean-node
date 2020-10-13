# Many-to-one
Now let's look at this relation from the perspective of a product. A product belongs to a shop, so you can access the shop like this:

```javascript
let shop = await product.shop;
```

> Due to product.shop can return **Promise<Bean | null>** or **value**, using promise .then() is not safe in this case. However, **await** is always safe.


## Setting a parent bean
To set a parent bean:

```javascript
product.shop = someShop;
await R.store(product);
```

## Removing the parent
To remove the shop from our product in the example above, simply assign the value **null** to the property 'shop_id':

```javascript
product.shop_id = null;    // removes product from shop
product.shopId = null;  // same but in camelCase
```

(Not recommended) You can remove the relation by setting the product.shop to null too. 

However, if RedBeanNode cannot recognize it is a relation field (shop_id) in the bean, it will create a field called 'shop' unexpectedly. Please use it carefully.

```
product.shop = null  // In some cases, it will create a field called 'shop' unexpectedly
```

> This method is suggested by RedBeanPHP, but not recommended in RedBeanNode




