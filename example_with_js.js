const {R} = require("./dist/lib/redbean-node");

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

})();
