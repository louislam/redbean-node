# One-to-many

In a one-to-many relation, one bean has a list of other beans but all those beans cannot belong to another bean at the same time. For instance, let's create a shop:

```javascript
let shop = R.dispense('shop');
shop.name = 'Antiques';
```

To add products to the shop, add beans to the ownProductList property, like this:

```javascript
let vase = R.dispense('product');
vase.price = 25;
shop.ownProductList.push(vase);
await R.store(shop);
```

## Load own-list

```javascript
let list = await shop.ownProductList.toArray();
```

## Remove

```javascript
shop.ownProductList.remove(vase);
R.store(shop);
```
