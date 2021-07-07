const { Worker, isMainThread } = require("worker_threads")
const mysql = require('mysql')
const path = require('path')
const mysqlEvents = require('@rodrigogs/mysql-events')

// INFO setup mysql
const sqlData = {
    host: "localhost",
    user: "root",
    password: "Spook524*",
    database: "cryptovesting",
    insecureAuth: true
}
const connection = mysql.createConnection(sqlData)
connection.connect()

// INFO init
console.log("[ START "+ new Date().toISOString() + " ] Starting app.js to listen to the sql and run contract checks")
_l = (data, level="LOG") => {
    let line = "[ " + level + " " + new Date().toISOString() + " ] " + data;
    console.log(line)
}

// INFO function to create the worker for doing the coin contract check work
function spawnWorker(event) {
    const worker = new Worker("/home/fullsend/cryptovesting/scripts/rugmenot_contracts/scripts/worker.js", {
        workerData: event
    });
    worker.once('message', (strResponse) => {
        let level = strResponse.indexOf("error") != -1 ? "SUCCESS": "ERROR";
        _l(strResponse, level)
    })
}

// INFO main program
const program = async () => {
    const instance = new mysqlEvents(connection, {
        startAtEnd: true,
        excludeSchemas: {
            mysql: true,
        }
    })

    await instance.start() 

    instance.addTrigger({
        name: "Token Added",
        expression: 'cryptovesting.tokens',
        statement: "INSERT",
        onEvent: (event) => {
            spawnWorker(event)
        }
    })

    instance.on(mysqlEvents.EVENTS.CONNECTION_ERROR, console.error);
}

program()

