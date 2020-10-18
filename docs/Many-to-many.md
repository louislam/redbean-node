# Many-to-many

A **shared list** contains beans that may be associated with more than just one other bean (**many-to-many relation**). Tags are a common example:

```javascript
let vase = R.dispense("product");
let lamp = R.dispense("product");

let tag = R.dispense("tag");
tag.name = 'Art Deco';

vase.sharedTagList.push(tag);
lamp.sharedTagList.push(tag);

await R.storeAll([
    vase,
    lamp
]);

```

In this example, a product can have multiple tags and every tag in the list can be associated with other products as well. The latter was not possible in the one-to-many relation.

Like the **own-list** the name of the **shared-list** has to match the type of beans it contains. In the database, these associations will be stored using a link table called **'product_tag'**.

The default link table name is always sorted in ascending, which means it is always 'aaa_bbb' rather than 'bbb_aaa'.

## Load Shared List

"bean.share**Type**List" is a magic property when you can get a shared-list of **Type** by the property name:

```javascript
let tagList = await vase.sharedTagList.toArray();
```

The list will be cached. In case you need to refresh:

```javascript
let tagList = await vase.sharedTagList.refresh();
```

## Add Bean to Shared List

```javascript
vase.sharedTagList.push(tag);
await R.store(vase);
```

> If you pushed an unsaved bean into the share-list, the bean will be also stored together. It is because RedBeanNode need the id to store the relation. On the other hand, 

## Remove Bean from Shared List

```javascript
vase.sharedTagList.remove(tag);
await R.store(vase);
```

> Add / Remove a bean will not appear in the list immediately, you have to store and load the list again.

## Via relations
Using the via() method, you can treat normal beans as if they were N-M relations:

```javascript
let project = R.dispense("project");
let lisa = R.dispense("employee");

let participant = R.dispense("participant");
participant.project = project;
participant.employee = lisa;
participant.role = 'developer';
await R.store(participant);

let employees = await project
    .via('participant')
    .sharedEmployeeList.toArray();
console.log(employees);
```

Remember that, removing bean from shared-list causes the link beans (participant bean) to be removed! However, you can always nullify the relations manually of course.

> Due to JavaScript's limitation, this page's api is a bit different to RedBeanNode.
