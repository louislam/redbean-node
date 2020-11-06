require('dotenv').config()
const https = require("https");
const axios = require('axios').default;
const httpsAgent = new https.Agent({
    ca: false,
})
axios.defaults.httpsAgent = httpsAgent;
axios.defaults.baseURL = "https://" + process.env.LXD_HOST + ":" + process.env.LXD_POST;


module.exports = {
    async init() {
        try {
            let result = await axios.put(`/1.0/certificates`, {
                "type": "client",
                "password": process.env.LXD_PASSWORD
            });
            console.log(result);
        } catch (e) {
            console.log(e);
        }
    },
    async start(name) {

        try {
            let result = await axios.put(`/1.0/instances/${name}/state`, {
                "action": "stop",       // State change action (stop, start, restart, freeze or unfreeze)
                "timeout": 30,
                "force": true,
                "stateful": true,
            });
            console.log(result);
        } catch (e) {
            console.log(e);
        }


    },
    async stop(name) {

    }
}
