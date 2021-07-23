const Discord = require('discord.js')
const http = require('http')
const fetch = require('node-fetch')
const { shared } = require('../worker_manager/workers/scripts/shared')
const { init, _l } = require('../worker_manager/workers/scripts/logger')
const path = require('path')
const fs = require('fs')

const client = new Discord.Client()
const date = new Date()
const logPath = path.join(__dirname, 'logs', 'discordBot_'+ date.getTime() + '.log')
init(logPath, 'Cryptovesting Discord Bot')

// INFO need to transfer env.json manually
const IP = '192.168.1.224'//'25.89.250.119'
const env = JSON.parse(fs.readFileSync(path.join(__dirname, 'env.json')))
const IDENTIFIER = "%"

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
    worker
    balance
    fail={failee} (error with worker_threads calling it)
    exit={exitee} (js error)
    impt
    */
}   

// INFO setup function to loop for printing events to the channel
setInterval(getEvents, 3000)

client.on('ready', () => {
    _l("Bot logged in as user "+client.user.tag, level="LOGIN")    
})

client.on('message', msg => {
    if (msg.content.charAt(0) != IDENTIFIER) return
    else msg.content = msg.content.substr(1)
    if (msg.content === 'ping') {
        msg.reply('pong')
    }
})

client.login(env.BOT_TOKEN)

