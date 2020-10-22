# Models

A model is a place to put validation and business logic.

```javascript
// user.js
export default class User extends BeanModel {
    get fullName() {
        return this.firstName + " " + this.lastName;
    }
}
```

The class should be "export default".

```javascript
user.firstName = "Chris";
user.lastName = "Wong";
console.log(user.fullName);
```

## Auto Load Models

You can auto load all models at the beginning of your app. RedBeanNode maps the **filename as the bean type**.

```javascript
    await R.addModels("./model");
```

## Custom mapping

JavaScript:
```javascript
const User = require("./model/user");
R.modelList["user"] = User;
```

TypeScript:
```typescript
import User from "./model/user";
R.modelList["user"] = User;
```

## Event Listener 

```javascript
export default class User extends BeanModel {
    
    /**
    * Trigger after the dispense a bean
    */
    onDispense() {
        console.log("onDispense");
    }

    /**
    * Trigger after the bean with id loaded from database
    */
    onOpen() {
        console.log("onOpen");
    }

    /**
    * Trigger before storing the bean
    */
    onUpdate() {
        console.log("onUpdate");
    }

    /**
    * Trigger after stored the bean
    */
    onAfterUpdate() {
        console.log("onAfterUpdate");
    }

    /**
    * Trigger before deleting the bean
    */
    onDelete() {
        console.log("onDelete");
    }
    
    /**
    * Trigger after deleted the bean
    */
    onAfterDelete() {
        console.log("onAfterDelete")
    }
}
```
