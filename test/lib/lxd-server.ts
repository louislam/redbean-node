const {R} = require('redbean-node');
const express = require('express');
const bodyParser = require('body-parser');
const {execSync} = require('child_process');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/start/:name/:password', async (req, res) => {
    if (process.env.LXD_PASSWORD == req.params.password) {
        res.end(execSync("lxc start " + req.params.name));
    } else {
        res.end("Wrong Password");
    }
});

app.post('/stop/:name/:password', async (req, res) => {
    if (process.env.LXD_PASSWORD == req.params.password) {
        res.end(execSync("lxc stop " + req.params.name));
    } else {
        res.end("Wrong Password");
    }
});

app.listen(process.env.LXD_PORT);
