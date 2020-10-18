# Create/Update a Bean

## Working with beans

RedBeanNode works with beans. Most interactions with the **database** are accomplished using beans. Beans are used to carry data from and to the database.

Every bean has a **type** and an **ID**. The type of a bean tells you which **table** in the database is used to store the bean. Every type maps to a corresponding table. The ID of a bean is the **primary key** of the corresponding **record**.
You can create a new bean by dispensing one.


## Create

To create a new bean (of type 'book') use:

```javascript
let book = R.dispense('book');
```

You can now add properties:
```javascript
book.title = 'Learn to Program';
book.rating = 10;
```

You can also use array notation if you like:
```javascript
book['price'] = 29.99;
```

and store the bean in the database:
```javascript
let id = await R.store(book);
```

At this point, the bean will be stored in the database and all **tables** and **columns** have been created.
The bean will now have an ID, which is also returned for your convenience.

> RedBeanNode will build all the necessary structures to store your data. However custom indexes and constraints have to be added manually (after [freezing](Fluid-And-Frozen.md) your web application).


## Update
To update a bean in the database, **add** or **change** properties:

```javascript
book.title = 'Learn to fly';
book.rating = 'good';
book.published = '2015-02-15';
await R.store(book);
```




