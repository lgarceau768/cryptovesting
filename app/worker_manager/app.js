// INFO worker manager app.js
// Author Luke Garceau
const mysql = require('mysql')
const { spawn } = require('child_process')
const {
    _l, init
} = require('./workers/scripts/logger')
const mysqlEvents = require('@rodrigogs/mysql-events')
const {
    sqlData,
    _jstr,
    setLog
} = require('./workers/scripts/shared')

// INFO setup mysql
const connection = mysql.createConnection(sqlData)
connection.connect()

// INFO setup log
let isoString = new Date()
let logFilePath = "/home/fullsend/cryptovesting/app/worker_manager/logs/workerManagerLog_" + isoString.toISOString() + ".log"
init(logFilePath)

// INFO function to spawn worker
function spawnWorker(workerInfo, onMessage) {
    let workerBasePath = "/home/fullsend/cryptovesting/app/worker_manager/workers/"
    let workerName = workerInfo["worker"]
    let workerPath = workerBasePath+workerName
    let workerData = workerInfo["workerData"]
    switch (workerName) {
        case 'contractCheckWorker.js':
            workerData = workerData["affectedRows"][0]["after"]["contract_hash"]
            break;

        default:
            break;
    }
    _l("Worker Spawned: "+workerName+ " with data: "+_jstr(workerData)+ " and base info: "+_jstr(workerInfo), level="SPAWN")
    console.log(workerPath)
    const worker = new Worker(workerPath, {
        workerData: workerData
    })
    worker.once('message', (strResponse) => {
        onMessage(strResponse)
    })
    worker.on('error', (error) => _l("ContractWorker: "+_jstr(workerInfo) +" has error: " +error, level="ERROR"))
    worker.on('exit', (code) => _l("ContractWorker: "+_jstr(workerInfo) +" exited with code: "+code, level="EXIT"))
}

// INFO base log complete callback
function logCompleteCallback(strMessage) {
    _l(strMessage, level="WORKER_COMPLETE")
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

}

program()