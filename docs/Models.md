# Models

A model is a place to put validation and business logic. Imagine a Jazz band that can only have up to 4 members. We could implement this rule like this:

```javascript
    if (members.length > 4) {
        throw 'Too many!';
    }

    band.ownMemberList.push(...members);
    R.store(band);
```

However, now we need to add this check everytime we call R::store(). It would be much more convenient if R::store() was smart enough to perform this check by itself. We can accomplish this by putting the **validation rule** in our model. RedBeanNode automatically discovers the models that belong to beans, so we can implement this validation like this:
