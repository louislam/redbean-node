const {R} = require("./dist/lib/redbean-node");

(async () => {
    R.setup();

    let bean = R.dispense("shop");
    console.log(bean);
})();
