// INFO worker manager app.js
// Author Luke Garceau
const mysql = require('mysql')
const { spawn } = require('child_process')
const fetch = require('node-fetch')
const {
    _l, init
} = require('./workers/scripts/logger')
const mysqlEvents = require('@rodrigogs/mysql-events')
const { shared } = require('./workers/scripts/shared')
const {
    sqlData,
    _jstr,
    setLog
} = shared()
const { Worker } = require('worker_threads')
const BNB_AMT_ETHER = 50000000000000000;
const BNB_AMT = 0.05;
const SLIPPAGE = 0.8;
const PERCENT_GAIN = 1.5;
const SELL_PERCENT = 0.75
const BINANCE_NET = "test"

// INFO setup mysql
const connection = mysql.createConnection(sqlData)
connection.connect()
const IP = '25.89.250.119' //'192.168.1.224'

// INFO setup log
let isoString = new Date()
try {
    let logFilePath = "/home/fullsend/cryptovesting/app/worker_manager/logs/workerManagerLog_" + isoString.toISOString() + ".log"
    init(logFilePath, "workerManager")
} catch {
    let logFilePath = "app/worker_manager/logs/workerManagerLog_" + Date.now() + ".log"
    init(logFilePath, "workerManager")
}

// INFO function to send an event
async function sendEvent(event) {
    let data = {
        host: 'http://'+IP+':4041',
        path: '/upload_event',
        method: 'GET'
    }
    event.timestamp = _t()
    let res = await fetch(data.host+data.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify(event)
    })
    let json = await res.json();
    console.log(json)
    // event setup
    /*
    event {         
        message,
        category
    }
    */
}

// INFO function to get timestamp
function _t() {
    let date = new Date()
    return date.toISOString()
}

// INFO function to spawn worker
function spawnWorker(workerInfo, onMessage) {
    let workerBasePath = "/home/fullsend/cryptovesting/app/worker_manager/workers/"
    let workerName = workerInfo["worker"]
    let workerPath = workerBasePath+workerName
    let workerData = workerInfo["workerData"]
    switch (workerName) {
        case 'contractCheckWorker.js':
            workerData = workerData["affectedRows"][0]["after"]["contract_hash"]
            break;
        case 'sniperWorker.js':
            workerData = workerData["affectedRows"][0]["after"]["contractHash"]
            break;
        default:
            break;
    }
    _l("Worker Spawned: "+workerName+ " with data: "+_jstr(workerData)+ " and base info: "+_jstr(workerInfo), level="SPAWN")
    sendEvent({
        message: workerName+" spawned on token |" + workerData,
        category: 'IMPT'
    })
    console.log(workerPath)
    const worker = new Worker(workerPath, {
        workerData: workerData
    })
    worker.once('message', (strResponse) => {
        onMessage(strResponse)
    })
    worker.on('error', (error) => {
        _l("ContractWorker: "+_jstr(workerInfo) +" has error: " +error, level="ERROR")
        sendEvent({
            message: workerInfo['worker']+' Failed on |'+workerData,
            category: 'FAIL=manager'
        })
    })
    worker.on('exit', (code) => {
        _l("ContractWorker: "+_jstr(workerInfo) +" exited with code: "+code, level="EXIT")
    })
}

// INFO function to add / remove token from token_balances
function token_balances(token, amt="", op="add") {
    switch (op) {
        case "add":
            let query = "insert into token_balances set ?"
            connection.query(query, {
                "contract_hash": token,
                "amount": amt.toString()
            })
            connection.commit()
            sendEvent({
                message: 'Token balance on |'+_jstr({token, amt}),
                category: 'BALANCE'
            })
            return;
        case "rem":
            let query1 = 'delete from token_balances where contract_hash like "'+token+'"'
            connection.query(query1)
            connection.commit()
            sendEvent({
                message: 'Token balance remove |'+ token,
                category: 'BALANCE'
            })
            return;
        default:
            return;
    }
}

// INFO base log complete callback
function logCompleteCallback(strMessage) {
    _l(strMessage, level="WORKER_COMPLETE")
}

// INFO spawn sell worker
function spawnSellWorker(token, amt) {
    const constant_values = {
        NET: BINANCE_NET,
        TOKEN: token,
        AMOUNT: amt
    }
    const ARGS = [
        "-u", constant_values.NET,
        "-t", constant_values.TOKEN,
        "-a", constant_values.AMOUNT
    ]
    const path = "./app/worker_manager/workers/sellWorker.py"
    const sellProcess = spawn('python3', [path, ...ARGS])
    _l("Sell worker spawned for token: "+token, level="SELL")
    sendEvent({
        message: 'Spawning sell on |'+_jstr({token, amt}),
        category: 'IMPT'
    })
    sellProcess.stdout.on('data', (data) => {
        let stringVal = data.toString().trim()
        let successIndex = stringVal.indexOf('Success=')
        if(successIndex != -1) {
            // INFO remove token from balances tracking table      
            let resultVal = JSON.parse(stringVal.split('Success=')[1])
            token_balances(token, op="rem")
            _l("Sell Reply: "+_jstr(resultVal), level="SOLD")
            sendEvent({
                message: 'Sold Token TX |'+_jstr(resultVal), 
                category: 'IMPT'
            })
        } else {
            let failResult = stringVal.split('Fail=')[1]
            sendEvent({
                message: 'Sold Token Failed |'+resultVal,
                category: 'FAIL=sell'
            })
            _l("Sell failed "+failResult, level="SELLFAIL")
        }
    })    
    sellProcess.stderr.on('data', (data) => {
        _l("Sell Exception: "+data, level="CRITICAL")
        sendEvent({
            message: 'Sold Token Exception |'+data,
            category: 'FAIL=sell'
        })
    })
    sellProcess.on('error', (err) => {
        _l("Sell Error"+err, level="CRITICAL")
        sendEvent({
            message: 'Sold Token Error |0',
            category: 'FAIL=sell'
        })
    })
}

// INFO spawn token watcher
function spawnTokenWatcher(token, amtBNB, amtToken) {
    const constant_values = {
        NET: BINANCE_NET,
        AMOUNT: amtBNB,
        AMOUNT_TOKEN: amtToken,
        PERCENT: PERCENT_GAIN,
        TOKEN: token
    }
    const ARGS = [
        "-u", constant_values.NET,
        "-t", constant_values.TOKEN,
        "-i", constant_values.AMOUNT,
        "-a", constant_values.AMOUNT_TOKEN,
        "-p", constant_values.PERCENT
    ]
    const path = "./app/worker_manager/workers/tokenWatcherWorker.py"
    const watchProcess = spawn('python3', [path, ...ARGS])
    _l("Watcher worker spawned for token: "+token, level="WATCH");
    sendEvent({
        message: 'Watching token |'+token, 
        category: 'IMPT'
    })
    watchProcess.stdout.on('data', (data) => {
        let stringVal = data.toString().trim()
        let successIndex = stringVal.indexOf('Success=')
        if(successIndex != -1){
            // FIXME (make constant) now sell token (currently sell 0.75 of token)
            spawnSellWorker(token, parseInt(amtToken * SELL_PERCENT))
        } else {
            let failResult = stringVal.split('Fail=')[1]
            sendEvent({
                message: 'Watching token failed |'+failResult, 
                category: 'FAIL=tokenWatcher'
            })
            _l("Watch failed: "+failResult, level="WATCHFAIL")
        }
    });
    watchProcess.stderr.on('data', (data) => {
        _l("Watch Exception: "+data, level="CRITICAL")
        sendEvent({
            message: 'Watching token Exception |'+data, 
            category: 'FAIL=tokenWatcher'
        })
    })
    watchProcess.on('error', () => {
        _l("Watch Error", level="CRITICAL")
        sendEvent({
            message: 'Watching token Error |0', 
            category: 'FAIL=tokenWatcher'
        })
    })
}

// INFO buy token with bnb
function spawnBuyPythonScript(token) {
    // FIXME move bnb amount higher
    const constant_values = {
        SLIPPAGE: SLIPPAGE,
        AMOUNT: BNB_AMT, // 50000000000000000
        NET: BINANCE_NET,
        TOKEN: token
    }
    const ARGS = [
        "-u", constant_values.NET,
        "-t", constant_values.TOKEN,
        "-a", constant_values.AMOUNT,
        "-s", constant_values.SLIPPAGE
    ]
    const path = "./app/worker_manager/workers/buyWorker.py"
    const buyProcess = spawn('python3', [path, ...ARGS])
    _l("Buy Worker Spawned with args: "+_jstr(ARGS), level="BUY")
    sendEvent({
        message: 'Buying token |'+token, 
        category: 'IMPT'
    })
    buyProcess.stdout.on('data', (data) => {
        _l("Reply from BuyWorker "+data, level="REPLY")
        let stringVal = data.toString().trim()
        let successIndex = stringVal.indexOf("Success=")
        if(successIndex != -1){
            let resultVal = JSON.parse(stringVal.split("Success=")[1])
            _l("Buy Success, resultVal: "+resultVal, level="BUYSUCCESS")
            spawnTokenWatcher(token, BNB_AMT_ETHER, resultVal['initalAmount'])
            token_balances(token, resultVal['initialAmount'])
        } else {
            let failResult = stringVal.split("Fail=")
            sendEvent({
                message: 'Buying token fail |'+failResult, 
                category: 'FAIL=buy'
            })
            _l("Buy Failed: "+failResult, level="BUYFAIL")
        }
    })
    buyProcess.stderr.on('data', (data) => {
        _l("Buy Exception: "+data, level="CRITICAL")
        sendEvent({
            message: 'Buying token Exception |'+data, 
            category: 'FAIL=buy'
        })
    })
    buyProcess.on('error', () => {
        _l("Buy Error"+data, level="CRITICAL")
        sendEvent({
            message: 'Buying token Error |0', 
            category: 'FAIL=buy'
        })
    })
}

const program = async () => {
    const instance = new mysqlEvents(connection, {
        startAtEnd: true,
        excludeSchemas: {
            mysql: true,
        }
    })

    await instance.start()

    // token being added trigger
    instance.addTrigger({
        name: "Token Added",
        expression: 'cryptovesting.tokens',
        statement: mysqlEvents.STATEMENTS.INSERT,
        onEvent: (event) => {
            console.log('triggered')
            try {
                spawnWorker({
                    workerData: event,
                    worker: 'contractCheckWorker.js'
                }, logCompleteCallback)
            } catch (e) {
                sendEvent({
                    message: 'Contract check on '+event['affectedRows'][0]['after']['contract_hash']+' failed |'+e,
                    category: 'FAIL=contract'
                })
            }
        }
    })

    instance.addTrigger({
        name: "Token Added for ByPass",
        expression: 'cryptovesting.tokens_bypass_contract_check',
        statement: mysqlEvents.STATEMENTS.INSERT,
        onEvent: (event) => {
            try {
                spawnWorker({
                    workerData: event,
                    worker: 'sniperWorker.js'
                }, (reply) => {
                    if(reply.indexOf('Mint=') != -1){
                        // token minted spawn buy script
                        let token = reply.split('Mint=')[1]
                        spawnBuyPythonScript(token)
                    }
                })
            } catch (err) {
                sendEvent({
                    message: 'Sniping token '+event["affectedRows"][0]["after"]["contractHash"]+' error |'+err,
                    category: 'FAIL=sniper'
                })
                _l("ByPass exception: "+err.toString(), level="CRITICAL")
            }
            
        }
    })

    instance.on(mysqlEvents.EVENTS.CONNECTION_ERROR, (err) => _l(err, level="CONNECTION_ERROR"));
    instance.on(mysqlEvents.EVENTS.ZONGJI_ERROR, (err) => _l(err, level="ZONGJI_ERROR"));

}

program()