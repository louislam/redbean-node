# Connection

To connect to an SQLite testing database, without having to make one yourself, use:

```javascript
R.setup();
```

This code creates a test database in your project folder.


## MariaDB

MariaDB (formerly known as MySQL) is the most popular database among web developers. Use MariaDB or MySQL for light web development. To connect to a MySQL database or a MariaDB database:

```javascript
R.setup('mysql', {
    host: 'localhost',
    user: 'user',
    password: 'password',
    database: 'mydatabase'
});
```

It is ready to be used. You do not need to use await / callback before query.

## SQLite

SQLite is file based database, ideal for embedded applications, prototyping, small (and smart) applications, small websites (not too much traffic) and data analysis. To connect to an SQLite database:

```javascript
R::setup('sqlite', {
    filename: './dbfile.db'
});
```


## Closing

To disconnect use:

```javascript
await R::close();
```

This will close the database connection.
