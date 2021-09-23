const express = require("express");
const logger = require('./workers/scripts/logger.js')
const bodyParser = require('body-parser')
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = 4041;
const cors = require('cors')
const { app: Cryptovesting } = require('./app');
const { _l, init } = require("./workers/scripts/logger.js");
const IP = '25.89.250.119' //'192.168.1.224'
const path = require('path');
const fs = require('fs')

// INFO setup logger
let date = new Date().toISOString()
let logPath = ""
try {
    logPath= "/home/fullsend/cryptovesting/app/worker_manager/logs/cryptovestingAPI_" + date + ".log"
    init(logPath, "cryptovestingAPI")
} catch {
    logPath = 'logs/cryptovestingAPI_' + Date.now() + '.log'
    init(logPath, "cryptovestingAPI")
}
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

function logReq(url, req) {
    _l(url+" "+_jstr({
        params: req.params, 
        body: req.body,
        headers: req.headers,
        ip: req.ip,
        cookies: req.cookies,
        readable: req.readable
    }), level="REQUEST")
}

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

function sendEvent(event) {
    try {
        let newEvent = event
        if(newEvent == null) {
            _l("Upload event issue null value", level="INPUTERROR")
            return
        }
        newEvent.timestamp = new Date().toISOString()
        events.push(newEvent)
    } catch (e) {        
        _l("Upload Event Error: "+e+" request\n"+_jstr(req), level="FAIL")
    }
}

app.post('/upload_event', (req, res) => {
    logReq('/upload_event', req)
    sendEvent(req.body)
})

app.get('/pull_events', (req, res) => {
    try {
        res.send({events})
        events = []
    } catch (e) {
        logReq('/pull_events', req)
        _l("Pull Events Error: "+e+" request\n"+_jstr(req), level="FAIL")
    }
})

app.get('/active_workers', (req, res) => {
    res.send({workers: Cryptovesting.getWorkers()})
})

app.post('/upload_token', (req, res) => {
    logReq('/upload_token', req)
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
            res.send({"success": false, "error": "incorrect body values"})
            return
        }
        _l("Token: "+token +" being added", level="INPUT")
        res.send({success: true})
        Cryptovesting.spawnWorker({
            workerData: token,
            worker: 'contractCheckWorker.js'
        }, (response) => {
            _l('Contract Check worker result '+response.toString(), level="CONTRACT")
        }, sendEvent, _l)
    } catch (e) {
        _l("Upload Error: "+e+" request\n"+_jstr(req), level="FAIL")
    }
})

function persistOp(data, op='add', table='sniper'){ 
    _l('persistOp() '+_jstr({data, op, table}), level="CALL")
    let existingPersistData = fs.readFileSync(path.join(__dirname, 'data', 'coins.json'), 'utf-8')
    existingPersistData = JSON.parse(existingPersistData);
    if(op === 'add') {
        existingPersistData[table].push(data)
    } else if(op === 'remove') {
        let foundIndex = -1;
        for(let i = 0; i < existingPersistData[table].length; i++){
            if(existingPersistData[table][i] == data){
                foundIndex = i;
            }
        }
        existingPersistData[table].splice(foundIndex, 1);
    } 
    fs.writeFileSync(path.join(__dirname, 'data', 'coins.json'), JSON.stringify(existingPersistData))
}

app.post('/upload_token_bypass', (req, res) => {
    logReq('/upload_token_bypass', req)
    try {
        let body = req.body;
        let token = {
            "addedOn": new Date().toISOString(),
            "tokenHash": body["contract_hash"],
        }
        if(checkAllNonNull(token)){
            _l("Upload called with incorrect values: "+_jstr(token), level="INPUTERROR")
            res.send({"success": false, "error": "incorrect body values"})
            return
        }
        _l("Token: "+_jstr(token) +" being added", level="INPUT")
        res.send({success: true})
        persistOp(token['tokenHash'], op="add", table="sniping")
        Cryptovesting.spawnSniperWorker(token['tokenHash'], 
        (reply) => {
            _l('Worker Reply: '+reply, level="WORKERREPLY")
            if(reply.indexOf('Mint=') != -1){
                persistOp(token, op='remove', table='sniping')
                let token = reply.split('Mint=')[1]
                Cryptovesting.spawnBuyPythonScript(token, sendEvent, _l)
            } else {
                _l('Unknown Sniper reply: '+reply, level="SNIPER")
            }
        }, sendEvent, _l)
    } catch (e) {
        _l("Upload Bypass Error: "+e+" request\n"+_jstr(req), level="FAIL")        
    }
})

app.post('/upload_sell_token', (req, res) => {
    logReq('/upload_sell_token', req)
    try {
        let body = req.body;
        let token = {
            "token": body['token'],
            "amt": body["amt"],
        }
        if(checkAllNonNull(token)){
            _l("Upload called with incorrect values: "+_jstr(token), level="INPUTERROR")
            res.send({"success": false, "error": "incorrect body values"})
            return
        }
        _l("Token: "+_jstr(token) +" being added", level="INPUT")
        res.send({success: true})
        Cryptovesting.spawnSellWorker(token['token'], token['amt'], sendEvent, _l)
    } catch (e) {
        _l("Upload Sell Error: "+e+" request\n"+_jstr(req), level="FAIL")        
    }
})


app.post('/upload_buy_token', (req, res) => {
    logReq('/upload_buy_token', req)
    try {
        let body = req.body;
        let token = {
            "token": body['token']
        }
        if(checkAllNonNull(token)){
            _l("Upload called with incorrect values: "+_jstr(token), level="INPUTERROR")
            res.send({"success": false, "error": "incorrect body values"})
            return
        }
        _l("Token: "+_jstr(token) +" being added", level="INPUT")
        res.send({success: true})
        Cryptovesting.spawnBuyPythonScript(token['token'], sendEvent, _l)
    } catch (e) {
        _l("Upload Sell Error: "+e+" request\n"+_jstr(req), level="FAIL")        
    }
})

// INFO run server
app.listen(port, host=IP, () => {
    console.log(`Success! Your application is running on port ${port}`)
})

// Need to read in data from the data/coins.json file
let coinsFile = fs.readFileSync(path.join(__dirname, 'data', 'coins.json'), 'utf-8')
let persistedCoins = JSON.parse(coinsFile)
persistedCoins['watching'].forEach((token) => {
    _l('Read persisted token: '+_jstr(token)+ " was watching, respawning watcher", level="PERSIST")
    let { tokenAddress, tokenAmount, bnbAmount } = token
    Cryptovesting.spawnTokenWatcher(tokenAddress, bnbAmount, tokenAmount, sendEvent, _l)
})
persistedCoins['sniping'].forEach((token) => {
    _l('Read persisted token: '+token.toString()+ " was sniping, respawning sniper", level="PERSIST")
    Cryptovesting.spawnWorker({
        workerData: token.toString(),
        worker: 'sniperWorker.js'
    }, (reply) => {
        _l('Worker Reply: '+reply, level="WORKERREPLY")
        if(reply.indexOf('Mint=') != -1){
            let token = reply.split('Mint=')[1]
            Cryptovesting.spawnBuyPythonScript(token, sendEvent, _l)
        } else {
            _l('Unknown Sniper reply: '+reply, level="SNIPER")
        }
    }, sendEvent, _l)
})