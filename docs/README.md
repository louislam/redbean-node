# RedBeanNode Docs

![Travis (.org)](https://img.shields.io/travis/louislam/redbean-node?style=for-the-badge) ![npm](https://img.shields.io/npm/v/redbean-node?style=for-the-badge)

## Welcome

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

## Playground

Try RedBeanNode in browser!

https://runkit.com/louislam/redbeannode-playground

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


## Zero Config

No verbose XML files, no annoying annotations, no YAML or INI. Zero Config. Just start coding.

## Fluid Schema

During development, RedBeanNode will adapt the database schema to fit your needs, giving you the **NoSQL** experience. When deploying to production servers, you can freeze the schema and benefit from performance gains and referential integrity.
RedBeanNode offers the best of both worlds!
