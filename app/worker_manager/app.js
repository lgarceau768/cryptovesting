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
        path: '/pull_events',
        method: 'GET'
    }
    event.timestamp = _t()
    await fetch(data.host+data.path, {
        method: 'POST',
        data: JSON.stringify(event)
    })
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
    workerBasePath = "./app/worker_manager/workers/"
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
        message: workerName+" spawned on token " + workerData,
        category: 'WORKER'
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
            message: 'ContractWorker Failed on '+workerData,
            category: 'FAIL=CONTRACT'
        })
    })
    worker.on('exit', (code) => {
        _l("ContractWorker: "+_jstr(workerInfo) +" exited with code: "+code, level="EXIT")
        sendEvent({
            message: 'ContractWorker Exited on '+workerData,
            category: 'EXIT=CONTRACT'
        })
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
                message: 'Token balance on ' + token + ' added, now: ' + amt,
                category: 'BALANCE'
            })
            return;
        case "rem":
            let query1 = 'delete from token_balances where contract_hash like "'+token+'"'
            connection.query(query1)
            connection.commit()
            sendEvent({
                message: 'Token balance remove ' + token,
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
        message: 'Spawning sell on '+token+ ' amount '+amt,
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
                message: 'Sold Token TX '+resultVal
            })
        } else {
            let failResult = stringVal.split('Fail=')[1]
            _l("Sell failed "+failResult, level="SELLFAIL")
        }
    })    
    sellProcess.stderr.on('data', (data) => _l("Sell Exception: "+data, level="CRITICAL"))
    sellProcess.on('error', () => _l("Sell Error"+data, level="CRITICAL"))
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
    watchProcess.stdout.on('data', (data) => {
        let stringVal = data.toString().trim()
        let successIndex = stringVal.indexOf('Success=')
        if(successIndex != -1){
            // FIXME (make constant) now sell token (currently sell 0.75 of token)
            spawnSellWorker(token, parseInt(amtToken * SELL_PERCENT))
        } else {
            let failResult = stringVal.split('Fail=')[1]
            _l("Watch failed: "+failResult, level="WATCHFAIL")
        }
    });
    watchProcess.stderr.on('data', (data) => _l("Watch Exception: "+data, level="CRITICAL"))
    watchProcess.on('error', () => _l("Watch Error"+data, level="CRITICAL"))
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
            _l("Buy Failed: "+failResult, level="BUYFAIL")
        }
    })
    buyProcess.stderr.on('data', (data) => _l("Buy Exception: "+data, level="CRITICAL"))
    buyProcess.on('error', () => _l("Buy Error"+data, level="CRITICAL"))
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
        statement: "INSERT",
        onEvent: (event) => {
            console.log('triggered')
            spawnWorker({
                workerData: event,
                worker: 'contractCheckWorker.js'
            }, logCompleteCallback)
        }
    })

    instance.addTrigger({
        name: "Token Added for ByPass",
        expression: 'cryptovesting.tokens_bypass_contract_check',
        statement: "INSERT",
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
                _l("ByPass exception: "+err.toString(), level="CRITICAL")
            }
            
        }
    })

}

program()