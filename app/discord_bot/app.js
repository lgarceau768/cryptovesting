const Discord = require('discord.js')
const http = require('http')
const fetch = require('node-fetch')
const { shared } = require('../worker_manager/workers/scripts/shared')
const { init, _l } = require('../worker_manager/workers/scripts/logger')
const path = require('path')
const fs = require('fs')

const client = new Discord.Client()
let bot_updates_channel = undefined
const logPath = path.join(__dirname, 'logs', 'discordBot_'+ Date.now() + '.log')
init(logPath, 'Cryptovesting Discord Bot')

// INFO need to transfer env.json manually
const IP = '192.168.1.224'//'25.89.250.119'
const env = JSON.parse(fs.readFileSync(path.join(__dirname, 'env.json')))
const IDENTIFIER = "%"

// INFO functions to create pretty messages
function createFailMessage(event) {
    let timestamp = evenet.timestamp
    let failee = event.category.split('=')[1].toLowerCase()
    let message = event.message
    let failureInfo = message.split('|')[1]
    let message = new Discord.MessageEmbed()
        .setColor('#ff0026')
        .setTitle(failee+' failed')
        .setDescription(message)
        .addField('Timestamp', timestamp)
        .addField('Info', failureInfo)
        .setImage('https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.onlygfx.com%2Fwp-content%2Fuploads%2F2020%2F05%2Ffail-stamp-6.png&f=1&nofb=1')
        .setTimestamp()
    return message
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
        switch (event.category.toLowerCase()) {
            case 'impt': 
                break
            case 'fail':
                break
            case 'balance':
                break
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
    }
})

client.login(env.BOT_TOKEN)

