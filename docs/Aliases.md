# Aliases
Sometimes you want to refer to a bean using a different name. For instance, when you have a course referring to a teacher and a student, both of which are people. In this case you can use **fetchAs**:

```javascript
let course = R.dispense('course');

// At assignment time, no difference...
course.teacher = R.dispense('person');
course.student = R.dispense('person');

let id = await R.store(course);

// Load same course from database
let sameCourse = await R.load('course', id);

if (sameCourse) {


    // when accessing the aliased properties,
    // tell RedBeanNode how to find the bean:
    let teacher = await sameCourse.fetchAs( 'person' ).teacher;
    console.log(teacher);
}
```
