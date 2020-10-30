# RedBeanNode Docs

[![npm](https://img.shields.io/npm/dt/redbean-node)](https://www.npmjs.com/package/redbean-node)
[![pipeline status](https://img.shields.io/gitlab/pipeline/louislam/redbean-node/master?label=build)](https://gitlab.com/louislam/redbean-node/-/commits/master) 
[![Coverage Status](https://img.shields.io/coveralls/github/louislam/redbean-node)](https://coveralls.io/github/louislam/redbean-node?branch=master) 
[![npm](https://img.shields.io/npm/v/redbean-node)](https://www.npmjs.com/package/redbean-node) 

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

    // retrieve from database
    post = await R.load('post', id);

    console.log("Post ID is " + post.id);
    console.log("Post text is " + post.text);

    // delete
    await R.trash(post);

    // close connection
    await R.close();
})();
```

<div id="my-element"></div>

<script>
fetch("/example/simple.txt")
    .then((res) => res.text())
    .then((src) => { 
        let notebook = RunKit.createNotebook({
            element: document.querySelector("#my-element"),
            source: src,
            //mode: 'endpoint',
            onLoad: (arg) => {
                    document.querySelector("pre[data-lang=\"javascript\"]").remove();
                    notebook.evaluate();
            }
        });
        console.log("Loaded Source Code");
    })
</script>

This **automatically generates** the tables and columns... on-the-fly. It infers relations based on naming conventions.


## Zero Config

No verbose XML files, no annoying annotations, no YAML or INI. Zero Config. Just start coding.

## Fluid Schema

During development, RedBeanNode will adapt the database schema to fit your needs, giving you the **NoSQL** experience. When deploying to production servers, you can freeze the schema and benefit from performance gains and referential integrity.
RedBeanNode offers the best of both worlds!
