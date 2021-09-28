const Discord = require('discord.js')
const fetch = require('node-fetch')
const { init, _l } = require('../worker_manager/workers/scripts/logger')
const path = require('path')
const fs = require('fs')
const pastebin = require('pastebin-js')
const fse = require('fs-extra');
const { spawn } = require('child_process')
const web3 = require('web3')
const puppeteer = require('puppeteer')

const client = new Discord.Client()
let bot_updates_channel = undefined
let bot_listen_channel = undefined
const logPath = path.join(__dirname, 'logs', 'discordBot_'+ Date.now() + '.log')
const availableLogs = {
    'discordBot' : {
        'path': '/home/fullsend/cryptovesting/app/discord_bot/logs',
        'name': 'discordBot'
    },
    'manager' : {
        'path': '/home/fullsend/cryptovesting/app/worker_manager/logs',
        'name': 'workerManagerLog'
    },
    'sell' : {
        'path': '/home/fullsend/cryptovesting/app/worker_manager/workers/logs',
        'name': 'sellWorker'
    },
    'buy' : {
        'path': '/home/fullsend/cryptovesting/app/worker_manager/workers/logs',
        'name': 'buyWorker'
    },
    'contract' : {
        'path': '/home/fullsend/cryptovesting/app/worker_manager/workers/logs',
        'name': 'contractCheckWorker'
    },
    'sniper' : {
        'path': '/home/fullsend/cryptovesting/app/worker_manager/workers/logs',
        'name': 'sniperWorker'
    },
    'tokenWatcher': {
        'path': '/home/fullsend/cryptovesting/app/worker_manager/workers/logs',
        'name': 'tokenWatcher'
    }
}
init(logPath, 'Cryptovesting Discord Bot')

// setup web3 for getting token balances
const w3 = new web3(new web3.providers.HttpProvider('https://bsc-dataseed.binance.org/'))
const ourAddress = "0x01420A7b545ac6c99F2b91e9f73464AA69C6E248"
const balanceAbi = '[{"inputs":[{"internalType":"string","name":"_NAME","type":"string"},{"internalType":"string","name":"_SYMBOL","type":"string"},{"internalType":"uint256","name":"_DECIMALS","type":"uint256"},{"internalType":"uint256","name":"_supply","type":"uint256"},{"internalType":"uint256","name":"_txFee","type":"uint256"},{"internalType":"uint256","name":"_lpFee","type":"uint256"},{"internalType":"uint256","name":"_MAXAMOUNT","type":"uint256"},{"internalType":"uint256","name":"SELLMAXAMOUNT","type":"uint256"},{"internalType":"address","name":"routerAddress","type":"address"},{"internalType":"address","name":"tokenOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"minTokensBeforeSwap","type":"uint256"}],"name":"MinTokensBeforeSwapUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"tokensSwapped","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"ethReceived","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"tokensIntoLiqudity","type":"uint256"}],"name":"SwapAndLiquify","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bool","name":"enabled","type":"bool"}],"name":"SwapAndLiquifyEnabledUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[],"name":"_liquidityFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"_maxTxAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"_owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"_taxFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"claimTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"subtractedValue","type":"uint256"}],"name":"decreaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tAmount","type":"uint256"}],"name":"deliver","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"excludeFromFee","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"excludeFromReward","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"geUnlockTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"includeInFee","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"includeInReward","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"addedValue","type":"uint256"}],"name":"increaseAllowance","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"isExcludedFromFee","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"isExcludedFromReward","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"time","type":"uint256"}],"name":"lock","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"numTokensSellToAddToLiquidity","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tAmount","type":"uint256"},{"internalType":"bool","name":"deductTransferFee","type":"bool"}],"name":"reflectionFromToken","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"liquidityFee","type":"uint256"}],"name":"setLiquidityFeePercent","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"maxTxPercent","type":"uint256"}],"name":"setMaxTxPercent","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"swapNumber","type":"uint256"}],"name":"setNumTokensSellToAddToLiquidity","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"_enabled","type":"bool"}],"name":"setSwapAndLiquifyEnabled","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"taxFee","type":"uint256"}],"name":"setTaxFeePercent","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"swapAndLiquifyEnabled","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"rAmount","type":"uint256"}],"name":"tokenFromReflection","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalFees","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"uniswapV2Pair","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"uniswapV2Router","outputs":[{"internalType":"contract IUniswapV2Router02","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"unlock","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}]'

// INFO need to transfer env.json manually
const IP = '25.89.250.119' //'192.168.1.224'
let env = JSON.parse(fs.readFileSync(path.join(__dirname, 'env.json')))
const IDENTIFIER = "%"
const listeningLogFiles = [];

const _jstr = (json_dict) => JSON.stringify(json_dict, null, 2)

async function uploadFileToPasteBin(basePath, filePath) {
    try {
        let realPath = path.join(basePath, filePath)
        bot_updates_channel.send("Log File for "+filePath, { files: [realPath]})        
    } catch (err) {
        _l('Upload log error: '+err, level="ERROR")
        try {
            bot_updates_channel.send('Upload error '+err)
        } catch (err) {
            _l("Error sending discord message", level="CRITICAL")
        }
    }
    
}

function findNewestLog(files, delimiter) {
    let oldestTime = parseInt(files[0].split('_')[1].replace('.log', ''))
    let oldestFile = files[0]
    files.forEach(file => {
        if(file.indexOf(delimiter) != -1){
            let split = file.split('_')
            if (parseInt(split[1].replace('.log', '')) >= oldestTime) {
                oldestFile = file
                oldestTime = parseInt(split[1].replace('.log', ''))
            }
        }
    })
    return oldestFile
}
// INFO functions to create pretty messages
function createFailMessage(event) {
    let timestamp = event.timestamp
    let failee = event.category.split('=')[1]
    _l('Fail message stuff: '+ failee)
    let message = event.message
    let failureInfo = message.split('|')[1]
    _l('Fail message stuff: '+ failureInfo)
    let messageRet = new Discord.MessageEmbed()
        .setColor('#ff0026')
        .setTitle(failee+' failed')
        .setDescription(message)
        .addField('Timestamp', timestamp)
        .addField('Info', failureInfo)
        .setTimestamp(); 
    bot_updates_channel.send(messageRet)
    // now to upload the log file
    fse.readdir(availableLogs[failee]['path'])
    .then((files) => {
        let file = findNewestLog(files, availableLogs[failee]['path'])
        uploadFileToPasteBin(availableLogs[failee]['path'], file)
    })    
}

function createImptMessage(event) {
    let timestamp = event.timestamp
    let message = event.message.split('|')[0]
    let data = event.message.split('|')[1]
    let DataType = "Reply"
    // handle tx / contract replies nicely
    if(data.indexOf('{') != -1) {
        // interpret as json
        try {
            data = JSON.parse(data)
            if(data.hasOwnProperty('token') && data.hasOwnProperty('amt')) {
                DataType = "Info"
                data = "Selling " + data['amt'] + "\nhttps://bscscan.com/address/" + data['token']
            }
        } catch (err) {
            DataType = "Reply"
            data = event.message.split('|')[1]
        }
    } else {
        data = data.replace('"', '')
        if(data.indexOf('0x') != -1){
            data = data.split('0x')[1]
            data = "0x" + data
            switch (data.length) {
                case 66:
                    // transaction address
                    DataType = "Bincance Transaction"
                    data = "https://bscscan.com/tx/" + data
                    break;
                
                case 42:
                    // token adddress
                    DataType = "Binance Contract / Token"
                    data = "https://bscscan.com/address/" + data
                    break
                default:
                    break;
            }
        }
    }

    let color = '#4DFF4D'
    if(message.indexOf('sniper') != -1) {
        color = '#ECBEB4'    
    } else if(message.indexOf('buy') != -1) {
        color = '#9DF7E5'
    } else if(message.indexOf('sell') != -1) {
        color = '#FA7921'
    } else if(message.indexOf('watching') != -1) {
        color = '#FF8360'
    }

    let messageRet = new Discord.MessageEmbed()
        .setColor(color)
        .setTitle('Important')
        .setDescription(message)
        .addField('Timestamp', timestamp)
        .addField(DataType, data)
        .setTimestamp();
    return messageRet
}

function createBalanceMessage(event) {
    let timestamp = event.timestamp
    let message = event.message.split('|')[0]
    let data = event.message.split('|')[1]
    let messageRet = new Discord.MessageEmbed()
        .setColor('# ')
        .setTitle('Balance Update')
        .setDescription(message)
        .addField('Timestamp', timestamp)
        .addField('Data', data)
        .setTimestamp();
    return messageRet
}

const postToken = async (contractHash) => {
    let data = {
        host: 'http://'+IP+':4041',
        path: '/upload_token',
        method: 'POST'
    }
    let response = await fetch(data.host+data.path, {
        method: data.method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({contract_hash: contractHash})
    })
    let reply = await response.json()
    return reply;
} 

const postTokenByPass = async (contractHash) => {
    let data = {
        host: 'http://'+IP+':4041',
        path: '/upload_token_bypass',
        method: 'POST'
    }
    let response = await fetch(data.host+data.path, {
        method: data.method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({contract_hash: contractHash})
    })
    return await response.json()
} 

const getTokenBalance = async (contractHash) => {
    // TODO implement token balance retrieval with a table of 
    // ethers, usd, amount token
    try {
        let tokenContract = new w3.eth.Contract(JSON.parse(balanceAbi), contractHash)
        let balance = await tokenContract.methods.balanceOf(ourAddress).call()
        let vals = {
            'ethers': balance.toString(),
            'token': w3.utils.fromWei(balance.toString()).toString()
        }
        return {
            'success': true,
            'result': vals
        }
    }  catch (err) {
        return {
            'success': false,
            'err': err.toString()
        }
    }
}

const postTokenSell = async (contractHash, amount) => {
    let data = {
        host: 'http://'+IP+':4041',
        path: '/upload_sell_token',
        method: 'POST'
    }
    let response = await fetch(data.host+data.path, {
        method: data.method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            token: contractHash,
            amt: amount
        })
    })
    return await response.json()
} 

const postLiveToken = async (contractHash) => {
    let data = {
        host: 'http://'+IP+':4041',
        path: '/upload_buy_token',
        method: 'POST'
    }
    let response = await fetch(data.host+data.path, {
        method: data.method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({token: contractHash})
    })
    return await response.json()
} 

const getActiveWorkers = async() => {
    let data = {
        host: 'http://'+IP+':4041',
        path: '/active_workers',
        method: 'GET'
    }
    let response = await fetch(data.host+data.path, {
        method: data.method,
        headers: {
            'Content-Type': 'application/json'
        }
    })
    return await response.json()
}

const getInvestedTokens = async () => {
    let data = {
        host: 'http://'+IP+':4041',
        path: '/invested_coins',
        method: 'GET'
    }
    let response = await fetch(data.host+data.path, {
        method: data.method,
        headers: {
            'Content-Type': 'application/json'
        }
    })
    return await response.json()
}

const killWorker = async (id) => {
    let data = {
        host: 'http://'+IP+':4041',
        path: '/kill_worker',
        method: 'POST'
    }
    let response = await fetch(data.host+data.path, {
        method: data.method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({id})
    })
    return await response.json()
}

// INFO function to request events from backend
const getEvents = async () => {
    let data = {
        host: 'http://'+IP+':4041',
        path: '/pull_events',
        method: 'GET'
    }
    let response = await fetch(data.host+data.path)
    let json = await response.json()
    let events = json['events']
    if(events.length > 0) _l('Events: '+_jstr(events), level="EVENTS")
    // INFO event categories
    /*
    balance
    fail={failee} (error with worker_threads calling it)
    impt
    */
    for (let event of events) {
        let message = undefined        
        switch (event.category.toLowerCase().split('=')[0]) {
            case 'impt': 
                _l("Sending message impt"+_jstr(event), level="SEND")
                message = createImptMessage(event)
                break
            case 'fail':   
                _l("Sending message fail", level="SEND")
                message = createFailMessage(event)
                break
            case 'balance':
                _l("Sending message balance"+_jstr(event), level="SEND")
                message = createBalanceMessage(event)
                break
        }
        if (message != undefined) {
            try {
                await bot_updates_channel.send(message)
            } catch (err) {
                _l("send embed issue: "+_jstr(err), level="senderr")
            }
        } else {
            _l(event.category.toLowerCase().split('=')[0]+' did not return valid message'+ _jstr(event), level="FAILSEND")
        }
    }
}   

function findLogAgainstStr(files, str) {
    let retFile = undefined;
    files.forEach(file => {
        let split = file.split('_')
        if(split[1].replace('.log', '') == str){
            retFile = file            
        }
    })
    return retFile
}

async function sendTokenBalanceReport(data, token) {
    let tokenAmount = data['token']
    let etherAmount = data['ethers']
    let tokenAddress = token
    let messageRet = new Discord.MessageEmbed()
        .setColor('#FFFF19')
        .setTitle('Balance Update')
        .setDescription('Current Balance for token: '+tokenAddress)
        .addField('Timestamp', new Date().toISOString())
        .addField('Token Amount', tokenAmount)
        .addField('Ethers Amount', etherAmount)
        .setTimestamp();
    bot_updates_channel.send(messageRet)    
}

async function requestThenSuccess(promiseFunction, functionality) {
    let startTime = Date.now()
    let returnVal = await promiseFunction();
    let endTime = Date.now()
    _l('Request returnVal: '+_jstr(returnVal), level="INFO")
    _l('Request finished: '+returnVal['success']+ ' functionality: '+functionality)
    if(returnVal['success']) {
        let messageRet = new Discord.MessageEmbed()
        .setColor('#05668D')
        .setTitle('API Call Success')
        .setDescription(functionality)
        .addField('Duration', (endTime-startTime).toString()+" seconds")
        .setTimestamp();
        if(returnVal.hasOwnProperty('workers')){
            let workers = returnVal['workers']
            messageRet.addField('Total Workers', workers.length)
            workers.forEach(worker => {
                let name = worker['name'].charAt(0).toUpperCase() + worker['name'].slice(1)
                
                messageRet.addField(name, _jstr(worker['data']) + '\nTimestamp: '+worker['timestamp'] + '\nWorker ID: ' + worker['id'])
            })
        } else if(returnVal.hasOwnProperty('coins')){
            let coins = returnVal['coins']
            coins.forEach(coin => {
                messageRet.addField('Token '+coin.hash, coin.balance)
            })
        }
        bot_updates_channel.send(messageRet)
    } else {        
        let messageRet = new Discord.MessageEmbed()
        .setColor('#FF3A20')
        .setTitle('API Call Fail')
        .setDescription(functionality)
        .addField('Duration', (endTime-startTime).toString()+" seconds")
        .addField('Error', returnVal['error'])
        .setTimestamp();
        bot_updates_channel.send(messageRet)
    }
}

function spawnLogListener (logFile, logType) {
    if(logType === 'discordBot') {
        bot_listen_channel.send('Cannot listen to the discord bots log through the bot')
        return
    }
    try {
        _l('spawnLogListener('+logFile+','+logType+')', level="CALL")
        if(availableLogs.hasOwnProperty(logType)) {
            let logPath = path.join(availableLogs[logType]['path'], logFile)
            if(fs.existsSync(logPath)){
                let id = listeningLogFiles.length
                let currentData = fs.readFileSync(logPath, 'utf-8').split('\n')
                listeningLogFiles.push({ 
                    id,
                    currentData,
                    path: logPath
                })
                let listener = fs.watchFile(logPath, { persistent: false, interval: 1000}, (curr, prev) => {    
                    let newData = fs.readFileSync(logPath, 'utf-8').split('\n')
                    if(listeningLogFiles[id]['currentData'].length !== newData.length) {
                        let difference = newData.length - listeningLogFiles[id]['currentData'].length
                        for(let i = newData.length; i >= (newData.length - difference); i--) {
                            bot_listen_channel.send(newData[i].toString())
                        }
                        listeningLogFiles[id]['currentData'] = newData
                    }
                })
                listeningLogFiles[id]['listener'] = listener
                bot_listen_channel.send('Starting listening to'+logFile+' with id of: '+id)
            } else {
                bot_listen_channel.send('Unknown logFile '+logFile)
            }
        } else {
            bot_listen_channel.send("Unknown logType "+logType)
        }
    } catch (err) {
        _l('Error spawning logListener '+err, level="ERROR")
        bot_listen_channel.send('Error spawning logListener '+err)
    }
}

function stopLogListening (listenerID) {
    try {
        _l('stopLogListening('+listenerID+')', level="CALL")
        if(listenerID < (listeningLogFiles.length - 1)) {
            listeningLogFiles[listenerID]['worker'].close()
            listeningLogFiles = listeningLogFiles.splice(listenerID, 1)
            bot_listen_channel.send('Stopping listening to listener id: '+listenerID)
        } else {
            _l('Invalid listener id: '+listenerID, level="INPUTERROR")
            bot_listen_channel.send('Invalid listener id: '+listenerID)
        }
    } catch (err) {
        _l('Error stoppping logListener '+err, level="ERROR")
        bot_listen_channel.send('Error stoppping logListener '+err)
    }
}

// INFO setup function to loop for printing events to the channel
setInterval(getEvents, 3000)

client.on('ready', async () => {
    _l("Bot logged in as user "+client.user.tag, level="LOGIN")    
    bot_updates_channel = await client.channels.fetch('867853712202792990')
    bot_listen_channel = await client.channels.fetch('892483824515153981')
})

client.on('message', async (msg) => {
    if(msg.author.bot) {
        return
    }
    if (msg.content.charAt(0) != IDENTIFIER) {
        return
    } else {
        msg.content = msg.content.substr(1)
    }
    _l('Message: '+msg.content, level="MESSAGE")
    switch (msg.content.split(' ')[0]) {
        case 'delete':
            let ammountToDelete = msg.content.split(' ')[1]
            msg.channel.bulkDelete(ammountToDelete)
            msg.channel.send('Deleted: '+ammountToDelete+" messages");
            break;
        case 'help':
            msg.channel.send('Available topLevel commands are log, api, delete, help \nlog corresponds to commands that have to do with the log files of the system\napi corresponds to the commands that directly interact with the cryptovesting api\nUse %[topLevelCommand] help to see more info\n delete {number} deletes a number of previous messages')
            break;
        case 'log':
            try {        
                let content = msg.content.split(' ')   
                let justKeys = Object.keys(availableLogs)  
                let subCommand = content[1]            
                switch (subCommand) {
                    case 'help': 
                        msg.channel.send('To use the log command use it like so')
                        let commands = {
                            'commands': {
                                'help': {
                                    'description': 'Show the help menu',
                                    'example': '%log help'
                                },
                                'showAvailable': {
                                    'description': 'Show the available log ids call to upload a single log to pastebin',
                                    'example': '%log showAvailable'
                                },
                                'getLogs': {
                                    'description': 'Get all the available logs of the ids in the system, will return a large list to use in the single upload',
                                    'example': '%log getLogs'
                                },
                                'upload': {
                                    'description': 'Will upload a log based on the id it is passed and will optionally check the name of the file against the uploaded string',
                                    'examples' : [
                                        {
                                            'command': '%log upload manager',
                                            'description': 'Will upload the most recent manager log file' 
                                        },
                                        {
                                            'command': '%log upload sniper 2021-07-10T02:29:25.282Z',
                                            'description': 'Will upload the log file containing the given string'
                                        },
                                        {
                                            'command': '%log upload buy 0x000000000000000000000',
                                            'description': 'Will upload the log file containing the given token address aka string'
                                        }
                                    ]
                                },
                                'listen': {
                                    'description': 'Will listen to a given log file and report the changes',
                                    'example': '%log listen manager {latest manager logFileName}'
                                },
                                'stopListening' : {
                                    'description': 'Will stop listing to a given logListenerID',
                                    'example': '%log stopListening {logListenerID}'
                                }
                            }
                        }
                        msg.channel.send(_jstr(commands))                    
                        break;
                    case 'listen':
                        spawnLogListener(content[2], content[3])
                        break;
                    case 'stopListening': 
                        stopLogListening(content[2])
                        break;
                    case 'showAvailable':
                        msg.channel.send('Available logs ids to use')
                        msg.channel.send(_jstr(justKeys))
                        break;
                    case 'getLogs':
                        const listLogs = spawn('sh' ,["/home/fullsend/cryptovesting/scripts/system_control/list_logs.sh"])
                        listLogs.stdout.on('data', function (data) {
                            msg.channel.send(data.toString().replace(/.log/g, ''))
                            clearTimeout(noTimeout)
                        })
                        const noTimeout = setTimeout(() => {
                            msg.channel.send('No Logs Found')
                        }, 500)
                        listLogs.stderr.on('data', function (data) {
                            clearTimeout(noTimeout)
                            msg.channel.send('Error getting logs')
                            _l("Error getting logs: "+_jstr(data), level="ERROR")
                        })
                        break;
                    case 'upload':
                        if (justKeys.indexOf(content[2]) != -1) {
                            let pathFile = availableLogs[content[2]]['path']
                            let files = fs.readdir(pathFile, (err, files) => {
                                if(err) {
                                    _l("Error reading dir "+pathFile+" "+err, level="ERROR")
                                } else {
                                    // now find the oldest file
                                    if (content.length == 4) {
                                        let fileMatch = findLogAgainstStr(files, content[3])
                                        if (fileMatch != undefined) {
                                            uploadFileToPasteBin(pathFile, fileMatch)
                                        } else {
                                            msg.channel.send('No matching log file not found for '+content[2]+' and str '+content[3])
                                        }
                                    } else {
                                        let newestLog = findNewestLog(files)
                                        // now read file
                                        if (newestLog != undefined) {
                                            uploadFileToPasteBin(pathFile, newestLog, msg)
                                        } else {
                                            msg.channel.send('No matching log file not found for '+content[2]+' and str '+content[3])
                                        }
                                        return
                                    }
                                }
                            })
                        } else {
                            msg.channel.send('ID '+content[2]+' not found in showAvailable')
                        }
                        break;
                    default:
                        msg.channel.send('Subcommand '+content[1]+' not found')
                        msg.channel.send('To use the log command use it like so')
                        msg.channel.send('% log {availableKey} {token} // (without token will return most recent)')
                        break;
                }
            } catch (err) {
                msg.channel.send('Error using log '+err)
                msg.channel.send('To use the log command use it like so')
                msg.channel.send('% log {availableKey} {token} // (without token will return most recent)')
            }
            break;
    
        case 'api':
            let restOfCommands = msg.content.split(' ')
            let subcommand = restOfCommands[1];
            switch (subcommand) {
                case 'balance':
                    let tokenToCheck = restOfCommands[2]
                    let result = await getTokenBalance(tokenToCheck)
                    if(result['success']){
                        sendTokenBalanceReport(result['result'], tokenToCheck)
                    } else {
                        msg.channel.send('Failed to get the balance because\n'+result['err'])
                    }
                    break;
                case 'help':
                    let commands = {
                        INFO: 'This shows example messages to call the commands do not use the {}',
                        balance: '%api balance {token address}\nReturns the current balance we have of the token ',
                        contract_check_insert: '%api contract_check_insert {token address}\nInserts a token into the contract check service',
                        bypass_insert: '%api (insert / bypass_insert) {token address}\nInserts a token into the cryptovesting sniping service',
                        insert: '%api (insert / bypass_insert) {token address}\nInserts a token into the cryptovesting sniping service',
                        sell: '%api sell {token} {amount (IN THE TOKEN DECIMALS}\nSells a give amount of the specified token (NOT IN ETHERS IN TOKEN)',
                        buy: '%api buy {token}\nBuys the given token',
                        get_active_workers: '%api get_active_workers\nReturns a detailed list of the active workers in the cryptovesting service',
                        invested_coins: '%api invested_coins\nReturns a list of the currently invested coins',
                        kill_worker: '%api kill_worker {worker id}\nKills a specified worker',
                        help: '%api help\nDisplays this menu',
                    }
                    msg.channel.send(_jstr(commands))
                    break;
                case 'kill_worker':
                    msg.channel.send('Making API request to kill worker '+restOfCommands[2])
                    requestThenSuccess(() => killWorker(restOfCommands[2]), 'Kill Worker')
                    break;
                case 'insert':
                case 'bypass_insert':
                    msg.channel.send("Making API request to bypass insert with token "+restOfCommands[2])
                    requestThenSuccess(() => postTokenByPass(restOfCommands[2]), 'Bypass Insert')
                    break;
                case 'contract_check_insert':
                    msg.channel.send("Making API request to contract check with token "+restOfCommands[2])
                    requestThenSuccess(() => postToken(restOfCommands[2]), 'Contract Insert')
                    break;
                case 'sell':
                    msg.channel.send("Making API request to sell with token "+restOfCommands[2]+' and selling '+restOfCommands[3])
                    requestThenSuccess(() => postTokenSell(restOfCommands[2], restOfCommands[3]), 'Sell')
                    break;
                case 'buy':
                    msg.channel.send("Making API request to buy with token "+restOfCommands[2])
                    requestThenSuccess(() => postLiveToken(restOfCommands[2]), 'Buy')
                    break;
                case 'get_active_workers':
                    msg.channel.send("Making API request to get active workers")
                    requestThenSuccess(() => getActiveWorkers(), 'Get Active Workers')
                    break;
                case 'invested_coins':
                    msg.channel.send("Making API request to get invested coins")
                    requestThenSuccess(() => getInvestedTokens(), 'Get Invested Coins')
                    break;
                default:
                    msg.channel.send("Unknown API command please use %help to see the commands")
                    break;
            }
            break;
        default:
            msg.channel.send("Unknown command please use %help to see the commands")
            break;
    }


})

client.login(env.BOT_TOKEN)

