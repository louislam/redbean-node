import { R } from "./lib/redbean-node";

(async () => {
    R.setup("mysql", {
        host: "192.168.0.12",
        user: "root",
        password: "PYHjnKBBDl",
        database: "test"
    });

    let bean = R.dispense("shop");
    bean.longDescription = "123213";

    bean.

    await R.store(bean);
})();
