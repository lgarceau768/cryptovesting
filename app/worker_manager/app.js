// INFO worker manager app.js
// Author Luke Garceau
const mysql = require('mysql')
const { spawn } = require('child_process')
const fetch = require('node-fetch')
const path = require('path')
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
const BNB_AMT = 0.01;
const SLIPPAGE = 0.8;
const PERCENT_GAIN = 1.5;
const SELL_PERCENT = 0.75
const BINANCE_NET = "main"
let running = false
// INFO setup mysql
let connection = mysql.createConnection(sqlData)
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
        method: 'POST'
    }
    event.timestamp = _t()
    let res = await fetch(data.host+data.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify(event)
    })
    let json = await res.json();
    console.log(json)
}

async function tryWrap(funct, args) {
    try {
        funct(...args)
    } catch (e) {
        _l(funct.name+" error: "+e+"\n"+_jstr(e), level="ERROR")
    }
}

// INFO function to get timestamp
function _t() {
    let date = new Date()
    return date.toISOString()
}

// INFO function to spawn worker
function spawnWorker(workerInfo, onMessage) {
    let workerBasePath = path.join(__dirname, "workers")
    let workerName = workerInfo["worker"]
    let workerPath = path.join(workerBasePath, workerName)
    let workerData = workerInfo["workerData"]
    switch (workerName) {
        case 'contractCheckWorker.js':
            workerData = workerData["affectedRows"][0]["after"]["contract_hash"]
            break;
        case 'sniperWorker.js':
            workerData = workerData["affectedRows"][0]["after"]["tokenHash"]
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
        if (strResponse.indexOf('=') == -1) return
        onMessage(strResponse)
    })
    worker.on('error', (error) => {
        _l(workerName+": "+_jstr(workerInfo) +" has error: " +error, level="ERROR")
        sendEvent({
            message: workerInfo['worker']+' Failed on |'+workerData,
            category: 'FAIL=manager'
        })
    })
    worker.on('exit', (code) => {
        _l(workerName+": "+_jstr(workerInfo) +" exited with code: "+code, level="EXIT")
    })
}

// INFO function to add / remove token from token_balances
function token_balances(token, amt, op="add") {
    switch (op) {
        case "add":
            let query = "insert into token_balances set ?"
            connection.query(query, {
                "contract_hash": token,
                "amount": amt
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
        "-a", constant_values.AMOUNT,
        "-s", SLIPPAGE
    ]
    const pathFile = path.join(__dirname, "workers/sellWorker.py")
    const sellProcess = spawn('python3', [pathFile, ...ARGS])
    _l("Sell worker spawned for token: "+token+"\n"+_jstr(ARGS), level="SELL")
    sendEvent({
        message: 'Spawning sell on |'+_jstr({token, amt}),
        category: 'IMPT'
    })
    sellProcess.stdout.on('data', (data) => {
        if(data.indexOf('=') == -1) return
        let stringVal = data.toString().trim()
        let successIndex = stringVal.indexOf('Success=')
        if(successIndex != -1) {
            // INFO remove token from balances tracking table      
            let resultVal = JSON.parse(stringVal.split('=')[1])
            token_balances(token, 0, op="rem")
            _l("Sell Reply: "+_jstr(resultVal), level="SOLD")
            sendEvent({
                message: 'Sold Token TX |'+_jstr(resultVal), 
                category: 'IMPT'
            })
        } else {
            let failResult = stringVal.split('=')[1]
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
    const pathFile = path.join(__dirname, "workers/tokenWatcherWorker.py")
    const watchProcess = spawn('python3', [pathFile, ...ARGS])
    _l("Watcher worker spawned for token: "+token+"\n"+_jstr(ARGS), level="WATCH");
    sendEvent({
        message: 'Watching token |'+token, 
        category: 'IMPT'
    })
    watchProcess.stdout.on('data', (data) => {
        if(data.indexOf('=') == -1) return
        let stringVal = data.toString().trim()
        let successIndex = stringVal.indexOf('Success=')
        if(successIndex != -1){
            // FIXME (make constant) now sell token (currently sell 0.75 of token)
            _l("Selling "+parseFloat(amtToken * SELL_PERCENT), "SLIPPAGE")
            spawnSellWorker(token, parseFloat(amtToken * SELL_PERCENT))
        } else {
            let failResult = stringVal.split('=')[1]
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
    const pathFile = path.join(__dirname, "workers/buyWorker.py")
    const buyProcess = spawn('python3', [pathFile, ...ARGS])
    _l("Buy Worker Spawned with args: "+_jstr(ARGS), level="BUY")
    sendEvent({
        message: 'Buying token |'+token, 
        category: 'IMPT'
    })
    buyProcess.stdout.on('data', (data) => {
        _l("Reply from BuyWorker "+data, level="REPLY")
        if(data.indexOf('=') == -1) return
        let stringVal = data.toString().trim()
        let successIndex = stringVal.indexOf("Success=")
        if(successIndex != -1){
            let resultVal = JSON.parse(stringVal.split("=")[1])
            _l("Buy Success, resultVal: "+_jstr(resultVal), level="BUYSUCCESS")
            sendEvent({
                message: 'Bought token '+token+' |'+resultVal['initalAmount'].toString(),
                category: 'IMPT'
            })
            spawnTokenWatcher(token, BNB_AMT_ETHER, resultVal['initalAmount'])
            token_balances(token, resultVal['initalAmount'])
        } else {
            let failResult = stringVal.split("=")
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
    running = true
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
            tryWrap(() => {
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
                        message: 'Sniping token '+event["affectedRows"][0]["after"]["tokenHash"]+' error |'+err,
                        category: 'FAIL=sniper'
                    })
                    _l("ByPass exception: "+err.toString(), level="CRITICAL")
                }
            }, [])                      
        }
    })

    instance.addTrigger({
        name: "Sell Token Amount",
        expression: 'cryptovesting.tokens_to_sell',
        statement: mysqlEvents.STATEMENTS.INSERT,
        onEvent: (event) => {
            tryWrap(function(event) {
                let tokenData = event["affectedRows"][0]["after"]
                spawnSellWorker(tokenData['token'], tokenData['amt'])
            }, event)
        }
    })

    instance.on(mysqlEvents.EVENTS.CONNECTION_ERROR, (err) => {
        running = false
        console.log(err)
        _l(err, level="CONNECTION_ERROR")
    });
    instance.on(mysqlEvents.EVENTS.ZONGJI_ERROR, (err) => {
        running = false
        console.log(err)
        _l(err, level="ZONGJI_ERROR")
    });

}

function connectSql() {    
    connection = mysql.createConnection(sqlData)
    connection.connect()
}


// Handle SQL Issues
connection.on('error', (err) => {
    console.log(err)
    console.log(_jstr(err))
    _l('Connection Error: '+_jstr(err))
    connection = null
    connectSql()
})

function run() {
    runing = true
    connectSql()
    program()
        .then(() => console.log("Cryptovesting Main Service Listener Started"))
        .catch((err) => {
            console.log(err)
            running = false
            connection = null
    })
}


setInterval(() => {
    if(!running){
        tryWrap(run, [])
    }
}, 1000)