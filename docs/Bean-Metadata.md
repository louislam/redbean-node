# Bean Metadata

Beans contain metadata (**bean.beanMeta**). For instance, the type of the bean is stored in the metadata. To obtain the type of bean:

```javascript
let type = bean.beanMeta.type
```

# Tainted

Some metadata is accessible using convenience method. For instance, if you would like to know whether a bean has been changed since it got retrieved from the database.

```javascript
let isTainted = bean.isTainted()
```


# Old Values

To determine if a certain property has changed:

```javascript
user.age = 20;
let oldValues = bean.beanMeta.old
```

> RedBeanNode use this to determine whether it is need to be inserted/updated into the database.
