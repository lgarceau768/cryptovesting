const express = require("express");
const logger = require('./logger.js')
const bodyParser = require('body-parser')
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = 4041;
const cors = require('cors')
const mysql = require('mysql')

// INFO setup mysql
const sqlData = {
    host: "localhost",
    user: "root",
    password: "Spook524*",
    database: "cryptovesting",
    insecureAuth: true
}
const connection = mysql.createConnection(sqlData)
connection.connect()

// INFO setup logger
let date = new Date().toISOString()
let path = "/home/fullsend/cryptovesting/app/back/logs/backendManualEntryServer_" + date + ".log"
logger.init(path)
_l = logger._l
const options = {
    inflate: true,
    limit: 1000,
    reviver: (key, value) => {
        if (key === 'age') {
            if (value < 50) {
                return 'young'
            } else {
                return 'old';
            }
        } else {
            return value;
        }
    }
};
const events = []
const _jstr = (json_dict) => JSON.stringify(json_dict, null, 2)
app.use(bodyParser.json(options));
app.use(bodyParser.urlencoded({extended: false}))
app.use(cors())
// enable CORS without external module
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post('/upload_event', (req, res) => {
    let newEvent = req.body;
    events.push(newEvent)
    res.send({"res": "OK"})
})

app.get('/pull_events', (req, res) => {
    res.send({events})
    events = []
})

app.post('/upload_token', (req, res) => {
    let body = req.body;
    let token = {
        "uuid": uuidv4(),
        "token_name": body["token_name"],
        "bscscan_link": body["bscscan_link"],
        "contract_hash": body["contract_hash"]
    }
    _l("Token: "+_jstr(token) +" being added", level="INPUT")
    let sql = "insert into tokens set ?"
    connection.query(sql, token, function (err, result) {
        if(err) {
            _l("Error adding token: "+_jstr(token) + " error: "+err, level="ERROR")
            res.send({"res": 'Error probably duplicate: '+err})
        } else {
            _l("Added token: "+_jstr(token), level="SUCCESS")
            res.send({"res": 'OK'})
        }
    })
})

app.post('/upload_token_bypass', (req, res) => {
    let body = req.body;
    let token = {
        "addedOn": Date.now().toISOString(),
        "tokenHash": body["contract_hash"]
    }
    _l("Token: "+_jstr(token) +" being added", level="INPUT")
    let sql = "insert into tokens_bypass_contract_check set ?"
    connection.query(sql, token, function (err, result) {
        if(err) {
            _l("Error adding token: "+_jstr(token) + " error: "+err, level="ERROR")
            res.send({"res": 'Error probably duplicate: '+err})
        } else {
            _l("Added token: "+_jstr(token), level="SUCCESS")
            res.send({"res": 'OK'})
        }
    })
})

// INFO run server
app.listen(port, host="25.89.250.119", () => {
    console.log(`Success! Your application is running on port ${port}`)
})