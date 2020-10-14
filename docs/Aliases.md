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

fetchAs tells RedBeanPHP the **ID** has to be associated with a different type (in this case 'person' instead of 'teacher' or 'student'). This also works the other way:

```javascript
// returns all courses for this person
// where he/she is the teacher.
let courseList = await person.alias('teacher').ownCourseList;
```
