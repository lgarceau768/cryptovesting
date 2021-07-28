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
const IDENTIFIER = "%"

const _jstr = (json_dict) => JSON.stringify(json_dict, null, 2)

async function uploadFileToPasteBin(basePath, filePath) {
    let text = await fs.readFileSync(path.join(basePath, filePath), 'utf8')
    console.log(text)
    let data = {
        'api_dev_key': 'j1LhJqqjhwBSN2bVto0Ucb4el96v84Lv',
        'api_paste_code': text,
        'api_paste_name': filePath,
        'api_option': 'paste',
        'api_paste_private': '1'
    }
    var formBody = [];
    for (var property in data) {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(data[property]);
        formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");

    fetch('https://pastebin.com/api/api_post.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body: formBody
        }
    ).then(async (res) => {
        _l('Uploaded '+filePath+ ' to '+res)
        let txt = await res.text()
        bot_updates_channel.send('Uploaded '+filePath+' to url: '+txt)
    }).catch((err) => {
        _l('Error uploading '+filePath+' err '+err)
        bot_updates_channel.send('Upload error')
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
// INFO functions to create pretty messages
function createFailMessage(event) {
    let timestamp = event.timestamp
    let failee = event.category.split('=')[1]
    _l('Fail message stuff: '+ failee)
    let message = event.message
    let failureInfo = message.split('|')[1]
    _l('Fail message stuff: '+ failureInfo)
    
    // now to upload the log file
    fse.readdir(availableLogs[failee]['path'])
    .then((files) => {
        let file = findNewestLog(files)
        console.log(file)
        uploadFileToPasteBin(availableLogs[failee]['path'], file)
    })    
    let messageRet = new Discord.MessageEmbed()
    .setColor('#ff0026')
    .setTitle(failee+' failed')
    .setDescription(message)
    .addField('Timestamp', timestamp)
    .addField('Info', failureInfo)
    .setTimestamp(); 
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
        .setTimestamp();
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
        .setTimestamp();
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
    if(events.length > 0) _l('Events: '+_jstr(events), level="EVENTS")
    // INFO event categories
    /*
    balance
    fail={failee} (error with worker_threads calling it)
    impt
    */
    for (const event of events) {
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

async function getAllLogs() {
    let logs = {}
    const updateLogs = (key, files) => logs[key] = {files} 
    let promises = []
    for (const key in availableLogs) {
        if (Object.hasOwnProperty.call(availableLogs, key)) {
            const el = availableLogs[key];
            const files = await fse.readdir(el['path'])
            if(files.length > 0) {
                logs[key] = {files}
            }
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
    _l('Message: '+msg.content, level="MESSAGE")
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
                                if (content.length == 4) {
                                    let fileMatch = findLogAgainstStr(files, content[2])
                                    if (fileMatch != undefined) {
                                        uploadFileToPasteBin(pathFile, file, msg)
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
    }
})

client.login(env.BOT_TOKEN)

