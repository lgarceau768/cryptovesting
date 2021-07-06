const { EVM } = require('evm')
const fs = require('fs')
const { spawn } = require('child_process')
const mysql = require('mysql')
const path = require('path')
const Web3 = require('web3')
const mysqlEvents = require('@rodrigogs/mysql-events')
const web3 = new Web3(new Web3.providers.HttpProvider("https://bsc-dataseed.binance.org/"))
const SCORE_TO_PASS = 4

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

// INFO function to output the contract source to a file before calling the python script
function outputContractSource(tokenName, contractDict){
    let dir = path.join("scripts", "rugmenot_contracts", "contracts", "sol files")
    let filePath = path.join(dir, tokenName+".txt")
    let fileData = ""
    for(let i = 0; i < contractDict.events.length; i++){
        let event = contractDict.events[i]
        fileData += event + "\n"
    }   
    for(let i = 0; i < contractDict.functions.length; i++){
        let functionStr = contractDict.functions[i]
        fileData += functionStr + "\n"
    }
    fileData += contractDict.decompiled
    fs.writeFileSync(filePath, fileData)
    return tokenName+".txt"
}

// INFO function to add token to respective database
async function addToken(token, score, jsonPath) {
    let insertRow = {
        uuid: token["uuid"],
        jsonPath: jsonPath
    }
    // INFO default failed contract check
    let tableToPutIn = "tokens_failed_contract_check"
    if(score <= SCORE_TO_PASS) {
        // INFO passed contract check send to sniffer
        tableToPutIn = tableToPutIn.replace("failed", "passed")
    } 
    try {
        let query = await connection.query("insert into "+tableToPutIn+" set ?", insertRow)
        _l(query.sql, level="DEBUG")
    } catch (err) {
        _l('Error adding token: '+token, level="ERROR")
    }
}

// INFO function to get the contract source using web3
async function getContractSource(tokenAddress) {
    try {
        let code = await web3.eth.getCode(tokenAddress)
        const evm = new EVM(code)
        let functions = evm.getFunctions()
        let events = evm.getEvents()
        let decompiled = ""
        try {
            decompiled = evm.decompile()
        } catch (err) {
            _l("Could not get source code of "+ tokenAddress + "due to "+err, level="ERROR")
        }
        return {
            functions, events, decompiled
        }
    } catch (err) {
        _l("Error getting "+tokenAddress+" source code", level="ERROR")
    }
}

// INFO function to run the python contract check script
function runContractCheck(filePath, token){
    const contractCheckProcess = spawn('python', ["scripts\\rugmenot_contracts\\scripts\\contract_check.py", filePath])
    contractCheckProcess.stdout.on('data', (data) => {
        let stringVal = data.toString().trim()
        let index = stringVal.indexOf("Name=")
        if(index != -1){
            let resultPath = stringVal.split("Name=")[1]
            // TODO add function to add this coin to a new table which is the static coin check pass table
            let fileData = fs.readFileSync(path.join("scripts\\rugmenot_contracts\\contracts\\json", resultPath))
            let jsonData = JSON.parse(fileData)
            addToken(token, jsonData["totalScore"], resultPath)
        }
    })
}

// INFO init logger
filePath = path.join("scripts", "rugmenot_contracts", "logs")
fileName = path.join(filePath, "tokenListenerLog_" + new Date().toISOString() + ".txt")
console.log("[ START "+ new Date().toISOString() + " ] Starting app.js to listen to the sql and run contract checks")
_l = (data, level="LOG") => {
    let line = "[ " + level + " " + new Date().toISOString() + " ] " + data;
    console.log(line)
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
        expression: '*.tokens',
        statement: "INSERT",
        onEvent: (event) => {
            _l("Token Seen")
            let token = event["affectedRows"][0]["after"]
            getContractSource(token["contract_hash"]).then( (contractDict) => {
                let filePath = outputContractSource(token["token_name"], contractDict)
                runContractCheck(filePath, token)
            })
            
        }
    })
}

program()
