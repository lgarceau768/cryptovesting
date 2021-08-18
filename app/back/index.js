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
const IP = '25.89.250.119' //'192.168.1.224'
let connection = mysql.createConnection(sqlData)

function connectSql() {    
    connection = mysql.createConnection(sqlData)
    connection.connect()
}
connectSql()


// Handle SQL Issues
connection.on('error', (err) => {
    console.log(err)
    console.log(_jstr(err))
    _l('Connection Error: '+_jstr(err))
    connection = null
    connectSql()
})

// INFO setup logger
let date = new Date().toISOString()
let path = ""
try {
    path= "/home/fullsend/cryptovesting/app/back/logs/backendManualEntryServer_" + date + ".log"
    logger.init(path)
} catch {
    path = 'logs/backendManualEntryServer_' + Date.now() + '.log'
    logger.init(path)
}
_l = logger._l
let events = []
const _jstr = (json_dict) => {
    try {
        return JSON.stringify(json_dict, null, 2)
    } catch (e) {
        _l("JSON Error "+json_dict+"\n"+e, level="JSON Parse Error")
        if (e != null) {
            return e
        } else {
            return ""
        }
    }
} 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))
app.use(cors())
// enable CORS without external module
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post('/upload_event', (req, res) => {
    try {
        let newEvent = req.body
        if(newEvent == null) {
            _l("Upload event issue null value", level="INPUTERROR")
            res.send({"res": "Fail", "error": "incorrect event posted"})
            return
        }
        events.push(newEvent)
        res.send({"res": "OK"})
    } catch (e) {        
        _l("Upload Event Error: "+e+" request\n"+_jstr(req), level="FAIL")
    }
})

app.get('/pull_events', (req, res) => {
    try {
        res.send({events})
        events = []
    } catch (e) {
        _l("Pull Events Error: "+e+" request\n"+_jstr(req), level="FAIL")
    }
})

function checkAllNonNull(val) {
    for (const key in val) {
        if (Object.hasOwnProperty.call(val, key)) {
            const element = val[key];
            if(element == null) {
                return true
            }
            if(element == "") {
                return true
            }
        }
    }
    return false
}

app.post('/upload_token', (req, res) => {
    try {
        let body = JSON.parse(req.body);
        let token = {
            "uuid": uuidv4(),
            "token_name": body["token_name"],
            "bscscan_link": body["bscscan_link"],
            "contract_hash": body["contract_hash"]
        }
        if(checkAllNonNull(token)){
            _l("Upload called with incorrect values: "+_jstr(token), level="INPUTERROR")
            res.send({"res": "fail", "error": "incorrect body values"})
            return
        }
        _l("Token: "+token +" being added", level="INPUT")
        let sql = "insert into tokens set ?"
        connection.query(sql, token, function (err, result) {
            if(err) {
                _l("Error adding token: "+token + " error: "+err, level="ERROR")
                res.send({"res": 'Error probably duplicate: '+err})
            } else {
                _l("Added token: "+token, level="SUCCESS")
                res.send({"res": 'OK'})
            }
        })
    } catch (e) {
        _l("Upload Error: "+e+" request\n"+_jstr(req), level="FAIL")
    }
})

app.post('/upload_token_bypass', (req, res) => {
    try {
        let body = req.body;
        let token = {
            "addedOn": new Date().toISOString(),
            "tokenHash": body["contract_hash"],
        }
        if(checkAllNonNull(token)){
            _l("Upload called with incorrect values: "+_jstr(token), level="INPUTERROR")
            res.send({"res": "fail", "error": "incorrect body values"})
            return
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
    } catch (e) {
        _l("Upload Bypass Error: "+e+" request\n"+_jstr(req), level="FAIL")        
    }
})

app.post('/upload_sell_token', (req, res) => {
    try {
        let body = req.body;
        let token = {
            "token": body['token'],
            "amt": body["amt"],
        }
        if(checkAllNonNull(token)){
            _l("Upload called with incorrect values: "+_jstr(token), level="INPUTERROR")
            res.send({"res": "fail", "error": "incorrect body values"})
            return
        }
        _l("Token: "+_jstr(token) +" being added", level="INPUT")
        let sql = "insert into tokens_to_sell set ?"
        connection.query(sql, token, function (err, result) {
            if(err) {
                _l("Error adding token: "+_jstr(token) + " error: "+err, level="ERROR")
                res.send({"res": 'Error probably duplicate: '+err})
            } else {
                _l("Added token: "+_jstr(token), level="SUCCESS")
                res.send({"res": 'OK'})
            }
        })
    } catch (e) {
        _l("Upload Sell Error: "+e+" request\n"+_jstr(req), level="FAIL")        
    }
})

// INFO run server
app.listen(port, host=IP, () => {
    console.log(`Success! Your application is running on port ${port}`)
})
