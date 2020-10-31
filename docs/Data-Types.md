# Data Types

The column data type is automatically decided by RedBeanNode.

You can use **R.isoDate()** and **R.isoDateTime()** to generate the current date(time) or parse your date.


## DateTime

```javascript
// Current Date Time
book.created_at = R.isoDateTime()

// Datetime string format with YYYY-MM-DD HH:mm:ss
book.created_at = "2020-10-20 17:43:00"

// JS Date object
book.created_at = R.isoDateTime(new Date())

// Dayjs
book.created_at = R.isoDateTime(dayjs())
```

## Date

```javascript
// Current Date
book.publish_date = R.isoDate()

// Date string format with YYYY-MM-DD
book.publish_date = "2020-10-20"

// JS Date object
book.publish_date = R.isoDate(new Date())

// Dayjs
book.publish_date = R.isoDate(dayjs())
```

## Time

```javascript
// Current Time
book.time = R.isoTime()

// Time string format with HH:mm:ss
book.time = "17:50:00"

// JS Date object
book.time = R.isoTime(new Date())

// Dayjs
book.time = R.isoTime(dayjs())
```


## varchar

If the string length < 230, the column type will be varchar(255) in the database.

```javascript
book.title = "I go to school by bus"
```

## text

If the string length >= 230, the column type will be text in the database.

```javascript
book.description = "RedBeanNode works with beans. Most interactions with the database are accomplished using beans. Beans are used to carry data from and to the database. Every bean has a type and an ID. The type of a bean tells you which table in the database is used to store the bean. Every type maps to a corresponding table. The ID of a bean is the primary key of the corresponding record. You can create a new bean by dispensing one.";
```


## int

```javascript
book.totalPage = 120
```

## float

```javascript
book.price = 12.99
```

## boolean / tinyint

```javascript
book.active = true;
```

> Due to MySQL does not have real Boolean type, any bean query from MySQL becomes 0/1


## Big Integer

```javascript
book.timestamp = Date.now() // 1603186462926
```


## Change Column Type

For MySQL, the column can be altered on-the-fly.

```javascript
book.price = 120
// Create a Integer column
await R.store(book);

book.price = 120.5
// alter to be a Float column
await R.store(book);
```


!> For SQLite, because there is no alter column, you have to drop the column manually and run your program again.
