# Models

A model is a place to put validation and business logic.

For JavaScript, you need to export your class like this:

```javascript
// ./model/user.js
const {BeanModel} = require("redbean-node/dist/bean-model");

class User extends BeanModel {
    get fullName() {
        return this.firstName + " " + this.lastName;
    }
}

module.exports = User;
```

For TypeScript, you could "export default":

```typescript
// ./model/user.ts
import {BeanModel} from "redbean-node/dist/bean-model";

export default class User extends BeanModel {
    get fullName() : string {
        return this.firstName + " " + this.lastName;
    }
}
```

## Auto Load all Models

You can autoload all models at the beginning of your app. RedBeanNode maps the **filename as the table name**.

```javascript
    await R.autoloadModels("./model");
```

## Using your models

```javascript
let user = R.dispense("user");  // Return User type rathen Bean type in this case
user.firstName = "Chris";
user.lastName = "Wong";
console.log(user.fullName);     // Print "Chris Wong"

// Finding is working too
let user2 = await R.findOne("user", " id = ? ", [1]);
console.log(user.fullName);
```

For TypeScript, adding "as User" at the end could cast the object to the correct type. 
```typescript
let user = R.dispense("user") as User;
```

## More Details

The model relations are like this:

```javascript
class Bean {}
class BeanModel extends Bean {}
class YourModel extends BeanModel {}

// So YourModel is still instanceof Bean and BeanModel 
console.log(YourModel instanceof Bean);    // true
console.log(YourModel instanceof BeanModel);    // true
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
class User extends BeanModel {
    
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

module.exports = User;
```
