const Discord = require('discord.js')
const fetch = require('node-fetch')
const { init, _l } = require('../worker_manager/workers/scripts/logger')
const path = require('path')
const fs = require('fs')
const pastebin = require('pastebin-js')

const client = new Discord.Client()
let bot_updates_channel = undefined
const logPath = path.join(__dirname, 'logs', 'discordBot_'+ Date.now() + '.log')
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
        filename: path.join(basePath, filePath),
        title: filePath,
        format: null,
        privacy: 1,
        expiration: '10M'
    }).then(res => {
        message.channel.send('Uploaded paste to url: '+res)
    })
}

// INFO setup function to loop for printing events to the channel
setInterval(getEvents, 3000)

client.on('ready', async () => {
    _l("Bot logged in as user "+client.user.tag, level="LOGIN")    
    bot_updates_channel = await client.channels.fetch('867853712202792990')
})

client.on('message', msg => {
    if (msg.content.charAt(0) != IDENTIFIER) return
    else msg.content = msg.content.substr(1)
    if (msg.content === 'ping') {
        msg.reply('pong')
    } else if (msg.content.indexOf('log') == 0) {
        let content = msg.content.split(' ')
        try {
            let availableLogs = {
                'backHTML' : {
                    'path': 'app/back/logs',
                    'name': 'backendManualEntryServer'
                },
                'discordBot' : {
                    'path': 'app/discord_bot/logs',
                    'name': 'discordBot'
                },
                'manager' : {
                    'path': 'app/worker_manager/logs',
                    'name': 'workerManagerLog'
                },
                'sellWorker' : {
                    'path': 'app/worker_manager/workers/logs',
                    'name': 'sellWorker'
                },
                'buyWorker' : {
                    'path': 'app/worker_manager/workers/logs',
                    'name': 'buyWorker'
                },
                'contractWorker' : {
                    'path': 'app/worker_manager/workers/logs',
                    'name': 'contractCheckWorker'
                },
                'sniperWorker' : {
                    'path': 'app/worker_manager/workers/logs',
                    'name': 'sniperWorker'
                },
                'tokenWatcherWorker': {
                    'path': 'app/worker_manager/workers/logs',
                    'name': 'tokenWatcher'
                }
            }
            let justKeys = Object.keys(availableLogs)    
            if (content[1] == 'showAvailable') {
                msg.channel.send('Available logs to print')
                msg.channel.send(_jstr(justKeys))
            } else if (content[1] == 'help') {
                msg.channel.send('To use the log command use it like so')
                msg.channel.send('% log {availableKey} {token} // (without token will return most recent)')
            } else if (justKeys.indexOf(content[1])) {
                let {path, name} = availableLogs[content[1]]
                let files = fs.readdir(path, (err, files) => {
                    if(err) {
                        _l("Error reading dir "+path+" "+err, level="ERROR")
                    } else {
                        // now find the oldest file
                        if (content.length == 3) {
                            files.forEach(file => {
                                let split = file.split('_')
                                if(split[1].replace('.log', '') == content[2]){
                                    uploadFileToPasteBin(path, file, msg)
                                    return
                                }
                            })
                            msg.channel.send('Log file not found for '+content[1]+' and token '+content[2])
                        } else {
                            let oldestTime = parseInt(files[0].split('_')[1].replace('.log', ''))
                            let oldestFile = files[0]
                            files.forEach(file => {
                                let split = file.split('_')
                                if (parseInt(split[1].replace('.log', '')) >= oldestTime) {
                                    oldestFile = file
                                    oldestTime = parseInt(split[1].replace('.log', ''))
                                }
                            })
                            // now read file
                            uploadFileToPasteBin(path, oldestFile, msg)
                            return
                        }
                    }
                })
            } else {
                msg.channel.send('Subcommand '+content[1]+' not found')
                msg.channel.send('To use the log command use it like so')
                msg.channel.send('% log {availableKey} {token} // (without token will return most recent)')
            }
        } catch (err) {
            msg.channel.send('Error using log '+err)
            msg.channel.send('To use the log command use it like so')
            msg.channel.send('% log {availableKey} {token} // (without token will return most recent)')
        }
    }
})

client.login(env.BOT_TOKEN)

