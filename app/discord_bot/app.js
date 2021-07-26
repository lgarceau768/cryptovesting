const Discord = require('discord.js')
const fetch = require('node-fetch')
const { init, _l } = require('../worker_manager/workers/scripts/logger')
const path = require('path')
const fs = require('fs')

const client = new Discord.Client()
let bot_updates_channel = undefined
const logPath = path.join(__dirname, 'logs', 'discordBot_'+ Date.now() + '.log')
init(logPath, 'Cryptovesting Discord Bot')

// INFO need to transfer env.json manually
const IP = '25.89.250.119' //'192.168.1.224'
const env = JSON.parse(fs.readFileSync(path.join(__dirname, 'env.json')))
const IDENTIFIER = "%"

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
    console.log(events)
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
            message.channel.send('Available logs to print')
            message.channel.send(_jstr(justKeys))
        } else if (content[1] == 'help') {
            message.channel.send('To use the log command use it like so')
            message.channel.send('% log {availableKey} {token} // (without token will return most recent)')
        } else if (content[1] in justKeys) {
            let {path, name} = availableLogs[content[1]]
            let files = fs.readdir(path, (err, files) => {
                if(err) {
                    _l("Error reading dir "+path+" "+err, level="ERROR")
                } else {
                    console.log(files)
                }
            })
        }
    }
})

client.login(env.BOT_TOKEN)

