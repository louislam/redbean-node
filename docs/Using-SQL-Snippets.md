# Using SQL Snippets

You can modify the contents of an own-list and a shared-list using additional **SQL snippets**. Use **with()** to order or limit the list and **withCondition** to add additional filtering.

```javascript
let pages = await book
    .with(' ORDER BY pagenum ASC ')
    .ownPageList
    .toArray();

let vases = await shop
    .withCondition(' category = ? ', [ 'vase' ])
    .ownProductList
    .toArray(); 

 // combine condition and order
let vases = await shop
    .withCondition(' category = ? ORDER BY price ASC ', [ 'vase' ])
    .ownProductList
    .toArray();

let employees = await project
    .withCondition(' priority > 40 ')
    .sharedEmployeeList
    .toArray();

// special case, filter on linking records...
let employees = await project
    .withCondition(' employee_project.assigned < ? ', [ date ])
    .sharedEmployeeList
    .toArray();

```

Note the last case in this example. Here we use a column from the link table to filter the rows. This technique allows you to filter on relational qualifications like the duration of the assignment to the project.

> You **CANNOT** combine **with()** and **withCondition()**. Instead, you can append additional clauses like in the third example.

### ⚠ **Important** note about **AND/OR statements** in snippets.
If you plan to use AND/OR statements in your conditions, please remember your snippet is integrated into a larger query. For the best results, it is recommended that you put your AND/OR snippets between **parenthesis** like this:

```javascript
let posts = await category
    .withCondition(' ( deleted IS NULL OR deleted = 0 ) ')
    .ownPostList
    .toArray()
```

## Via and SQL

Via can be used with SQL snippets as well:

```javascript
let designers = await project
    .withCondition(' participant.role = ? ', [ 'designer' ])
    .via( 'participant' )
    .sharedEmployeeList
    .toArray();
```
