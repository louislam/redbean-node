# RedBeanNode

[![pipeline status](https://img.shields.io/gitlab/pipeline/louislam/redbean-node/master?label=build)](https://gitlab.com/louislam/redbean-node/-/commits/master) [![Coverage Status](https://coveralls.io/repos/github/louislam/redbean-node/badge.svg?branch=master)](https://coveralls.io/github/louislam/redbean-node?branch=master) ![npm](https://img.shields.io/npm/v/redbean-node) 


(Early Development)

RedBeanNode is an easy to use **ORM** tool for Node.js, strongly inspired by RedBeanPHP. 

* **Automatically** creates **tables** and **columns** as you go
* No configuration, just fire and forget
* Ported RedBeanPHP's main features and api design
* Build on top of knex.js
* Supports **JavaScript** & **TypeScript**
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
