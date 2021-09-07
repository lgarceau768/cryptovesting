/**
 * Imports for the Main Cryptovesting Service
 * @author Luke Garceau
 * @version 2.0
 * @date 9/5/21
 */
const { spawn } = require('child_process');
const fetch = require('node-fetch');
const path = require('path')
const { _l, init } = require('./workers/scripts/logger')
const { shared } = require('./workers/scripts/shared')
const fs = require('fs')
const {
    _jstr
} = shared()
const { Worker } = require('worker_threads')


// Import constants
const { 
    BNB_AMT_ETHER, 
    BNB_AMT, 
    SLIPPAGE, 
    PERCENT_GAIN, 
    SELL_PERCENT, 
    BINANCE_NET, 
    IP 
} = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'constants.json')))

/**
 * Functions Below
 * FIXME need to define an onEventCallback
 */

// Function to get timestamp
function _t() {
    let date = new Date()
    return date.toISOString()
}

function persistOp(data, op='add', table='sniper'){ 
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

// INFO spawn sell worker
function spawnSellWorker(token, amt, sendEvent, _l) {
    const constant_values = {
        NET: BINANCE_NET,
        TOKEN: token,
        AMOUNT: amt
    }
    const ARGS = [
        constant_values.TOKEN,
        constant_values.AMOUNT
    ]
    const pathFile = path.join(__dirname, "workers/sellWorker.py")
    const sellProcess = spawn('python3', [pathFile, ...ARGS])
    _l("Sell worker spawned for token: "+token+"\n"+_jstr(ARGS), level="SELL")
    sendEvent({
        message: 'Spawning sell on |'+token,
        category: 'IMPT'
    })
    sellProcess.stdout.on('data', (data) => {
        try {
            _l('Sell Reply: '+data, level="SELLREPLY")
            if(data.indexOf('=') == -1) return
            let stringVal = data.toString().trim()
            _l('Sell Reply: '+data, level="SELLREPLY")
            let successIndex = stringVal.indexOf('Success=')
            if(successIndex != -1) {
                // INFO remove token from balances tracking table      
                let resultVal = stringVal.split('=')[1]
                token_balances(token, 0, op="rem", sendEvent, _l)
                _l("Sell Reply: "+_jstr(resultVal), level="SOLD")
                sendEvent({
                    message: 'Sold Token TX |'+resultVal, 
                    category: 'IMPT'
                })
            } else {
                let failResult = stringVal.split('=')[1]
                sendEvent({
                    message: 'Sold Token Failed |'+failResult,
                    category: 'FAIL=sell'
                })
                _l("Sell failed "+failResult, level="SELLFAIL")
            }
        } catch (e) {
            _l("Sell reply interpret exception "+e, level="SELLFAIL")
            _l(_jstr(e))
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
function spawnTokenWatcher(token, amtBNB, amtToken, sendEvent, _l) {
    persistOp({
        tokenAddress: token,
        tokenAmount: amtToken,
        bnbAmount: amtBNB
    }, op='add', table='watching')
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
        _l('Watcher Reply: '+data, level="WATCHERREPLY")
        if(data.indexOf('=') == -1) return
        let stringVal = data.toString().trim()
        let successIndex = stringVal.indexOf('Success=')
        if(successIndex != -1){
            // FIXME (make constant) now sell token (currently sell 0.75 of token)
            persistOp({
                tokenAddress: token,
                tokenAmount: amtToken,
                bnbAmount: amtBNB
            }, op='remove', table='watching')
            _l("Selling "+parseFloat(amtToken * SELL_PERCENT), "SLIPPAGE")
            spawnSellWorker(token, parseFloat(amtToken * SELL_PERCENT), sendEvent, _l)
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
function spawnBuyPythonScript(token, sendEvent, _l) {
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
            let resultVal = stringVal.split("=")[1]
            _l("Buy Success, resultVal: "+_jstr(resultVal), level="BUYSUCCESS")
            resultVal = JSON.parse(resultVal)
            sendEvent({
                message: 'Bought token '+token+' |'+resultVal['amountToken'].toString(),
                category: 'IMPT'
            })
            spawnTokenWatcher(token, BNB_AMT_ETHER, resultVal['amountEther'], sendEvent, _l)
            token_balances(token, resultVal['amountEther'], sendEvent, _l)
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

// INFO function to add / remove token from token_balances
function token_balances(token, amt, sendEvent, op="add") {
    switch (op) {
        case "add":
            // FIXME
            sendEvent({
                message: 'Token balance on |'+_jstr({token, amt}),
                category: 'BALANCE'
            })
            return;
        case "rem":
            // FIXME
            sendEvent({
                message: 'Token balance remove |'+ token,
                category: 'BALANCE'
            })
            return;
        default:
            return;
    }
}

// INFO function to spawn worker
function spawnWorker(workerInfo, onMessage, sendEvent, _l) {
    let workerBasePath = path.join(__dirname, "workers")
    let workerName = workerInfo["worker"]
    let workerPath = path.join(workerBasePath, workerName)
    let workerData = workerInfo["workerData"]
    console.log(workerData)
    _l("Worker Spawned: "+workerName+ " with data: "+workerData.toString()+ " and base info: "+_jstr(workerInfo), level="SPAWN")
    sendEvent({
        message: workerName+" spawned on token |" + workerData.toString(),
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
            message: workerInfo['worker']+' Failed on |'+workerData.toString(),
            category: 'FAIL=manager'
        })
    })
    worker.on('exit', (code) => {
        _l(workerName+": "+_jstr(workerInfo) +" exited with code: "+code, level="EXIT")
    })
}

let app = {
    spawnBuyPythonScript,
    spawnSellWorker,
    spawnTokenWatcher,
    spawnWorker,
    token_balances
}

module.exports = {app}