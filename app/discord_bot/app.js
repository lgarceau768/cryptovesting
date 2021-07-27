const Discord = require('discord.js')
const fetch = require('node-fetch')
const { init, _l } = require('../worker_manager/workers/scripts/logger')
const path = require('path')
const fs = require('fs')
const pastebin = require('pastebin-js')
const fse = require('fs-extra');

const client = new Discord.Client()
let bot_updates_channel = undefined
const logPath = path.join(__dirname, 'logs', 'discordBot_'+ Date.now() + '.log')
const availableLogs = {
    'backHTML' : {
        'path': '/home/fullsend/cryptovesting/app/back/logs',
        'name': 'backendManualEntryServer'
    },
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

// INFO need to transfer env.json manually
const IP = '25.89.250.119' //'192.168.1.224'
const env = JSON.parse(fs.readFileSync(path.join(__dirname, 'env.json')))
const ps = new pastebin(env['PASTEBINKEY'])
const IDENTIFIER = "%"

const _jstr = (json_dict) => JSON.stringify(json_dict, null, 2)

// INFO functions to create pretty messages
function createFailMessage(event) {
    let timestamp = evenet.timestamp
    let failee = event.category.split('=')[1].toLowerCase()
    let message = event.message
    let failureInfo = message.split('|')[1]
    let messageRet = new Discord.MessageEmbed()
        .setColor('#ff0026')
        .setTitle(failee+' failed')
        .setDescription(message)
        .addField('Timestamp', timestamp)
        .addField('Info', failureInfo)
        .setTimestamp()
    
    return messageRet
}

function createImptMessage(event) {
    let timestamp = event.timestamp
    let message = event.message.split('|')[0]
    let data = event.message.split('|')[1]
    let messageRet = new Discord.MessageEmbed()
        .setColor('#4DFF4D')
        .setTitle('Important')
        .setDescription(message)
        .addField('Timestamp', timestamp)
        .addField('Data', data)
        .setTimestamp()
    return messageRet
}

function createBalanceMessage(event) {
    let timestamp = event.timestamp
    let message = event.message.split('|')[0]
    let data = event.message.split('|')[1]
    let messageRet = new Discord.MessageEmbed()
        .setColor('#FFFF19')
        .setTitle('Balance Update')
        .setDescription(message)
        .addField('Timestamp', timestamp)
        .addField('Data', data)
        .setTimestamp()
    return messageRet
}

// INFO function to request events from backend
const getEvents = async () => {
    let data = {
        host: 'http://'+IP+':4041',
        path: '/pull_events',
        method: 'GET'
    }
    const response = await fetch(data.host+data.path)
    const json = await response.json()
    const events = json['events']
    // INFO event categories
    /*
    balance
    fail={failee} (error with worker_threads calling it)
    impt
    */
    for (const event of events) {
        let message = undefined
        switch (event.category.toLowerCase()) {
            case 'impt': 
                message = createImptMessage(event)
                break
            case 'fail':
                message = createFailMessage(event)
                break
            case 'balance':
                message = createBalanceMessage(event)
                break
        }
        if (message != undefined) {
            bot_updates_channel.send("@everyone")
            bot_updates_channel.send(message)
        }
    }
}   

function uploadFileToPasteBin(basePath, filePath, message) {
    ps.createPasteFromFile({
        filename: basePath + path.sep + filePath,
        title: filePath,
        format: null,
        privacy: 1,
        expiration: '10M'
    }).then(res => {
        message.channel.send('Uploaded paste to url: '+res)
    })
}

function findNewestLog(files) {
    let oldestTime = parseInt(files[0].split('_')[1].replace('.log', ''))
    let oldestFile = files[0]
    files.forEach(file => {
        let split = file.split('_')
        if (parseInt(split[1].replace('.log', '')) >= oldestTime) {
            oldestFile = file
            oldestTime = parseInt(split[1].replace('.log', ''))
        }
    })
    return oldestFile
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

async function getAllLogs() {
    let logs = {}
    const updateLogs = (key, files) => logs[key] = {files} 
    let promises = []
    for (const key in availableLogs) {
        if (Object.hasOwnProperty.call(availableLogs, key)) {
            const el = availableLogs[key];
            const files = await fse.readdir(el['path'])
            logs[key] = {files}
        }
    }
    return logs
}

// INFO setup function to loop for printing events to the channel
setInterval(getEvents, 3000)

client.on('ready', async () => {
    _l("Bot logged in as user "+client.user.tag, level="LOGIN")    
    bot_updates_channel = await client.channels.fetch('867853712202792990')
})

client.on('message', async (msg) => {
    if (msg.content.charAt(0) != IDENTIFIER) return
    else msg.content = msg.content.substr(1)
    if (msg.content === 'ping') {
        msg.reply('pong')
    } else if (msg.content.indexOf('log') == 0) {
        let content = msg.content.split(' ')
        try {           
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
                            }
                        }
                    }
                    msg.channel.send(_jstr(commands))                    
                    break;
                case 'showAvailable':
                    msg.channel.send('Available logs ids to use')
                    msg.channel.send(_jstr(justKeys))
                    break;
                case 'getLogs':
                    getAllLogs()
                    .then((logs) => {
                        console.log(logs)
                        let logsString = _jstr(logs)
                        msg.channel.send('Available logs to view')
                        if(logsString.length > 4000) {
                            let amount = Math.ceil(logsString.length / 4000)
                            let messageStr = logsString.substr(0, 4000)
                            for(let i = 0; i < amount; i++) {
                                msg.channel.send(messageStr)
                                messageStr = logsString.substr((i + 1) * 4000, (i + 2) * 4000)                             
                            }
                        } else {
                            msg.channel.send(logsString)
                        }
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
                                if (content.length == 3) {
                                    let fileMatch = findLogAgainstToken(files, content[2])
                                    if (fileMatch != undefined) {
                                        uploadFileToPasteBin(pathFile, file, msg)
                                    } else {
                                        msg.channel.send('No matching log file not found for '+content[2]+' and str '+content[3])
                                    }
                                } else {
                                    let newestLog = findNewestLog(files)
                                    // now read file
                                    uploadFileToPasteBin(pathFile, newestLog, msg)
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
    }
})

client.login(env.BOT_TOKEN)

