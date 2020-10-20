# RedBeanNode

> Caution: Not Production Ready

Status: Early Development / No Unit Testing yet / API will be changed

RedBeanNode is an easy to use **ORM** tool for Node.js, strongly inspired by RedBeanPHP. 

* **Automatically** creates **tables** and **columns** as you go
* No configuration, just fire and forget
* Ported RedBeanPHP's main features and api design
* Build on top of knex.js
* Supports **JavaScript (ES6)** & **TypeScript**
* **async/await** or **promise** friendly

## Supported Databases

* MySQL / MariaDB
* SQLite

## Installation

```shell script
npm install redbean-node --save
```

## Read More

Docs:
http://redbean-node.whatsticker.online

## Code Example

This is how you do CRUD in RedBeanNode:

```javascript
const {R} = require("redbean-node");

// Setup connection
R.setup();

(async () => {
    let post = R.dispense('post');
    post.text = 'Hello World';

    // create or update
    let id = await R.store(post);

    // retrieve
    post = await R.load('post', id);

    console.log(post);

    // delete
    await R.trash(post);

    // close connection
    await R.close();
})();

```

This **automatically generates** the tables and columns... on-the-fly. It infers relations based on naming conventions.
