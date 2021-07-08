const { EVM, events } = require('evm')
const { parentPort, workerData } = require('worker_threads') 
const fs = require('fs')
const { spawn } = require('child_process')
const mysql = require('mysql')
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider("https://bsc-dataseed.binance.org/"))
const SCORE_TO_PASS = 4.0


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

// INFO function to output the contract source to a file before calling the python script
function outputContractSource(tokenName, contractDict){
    try {
        let dir = "/home/fullsend/cryptovesting/scripts/rugmenot_contracts/contracts/sol\ files/"
        let filePath = dir + tokenName + ".txt"
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
        _l("outputContractSource "+ filePath, level="DEBUG")
        return filePath
    } catch (err) {
        _l(err, level="ERROR")
    }    
}

// INFO function to add token to respective database
function addToken(token, score, jsonPath) {
    let insertRow = {
        uuid: token["uuid"],
        json_path: jsonPath
    }
    // INFO default failed contract check
    let tableToPutIn = "tokens_failed_contract_check"
    if(parseFloat(score) <= SCORE_TO_PASS) {
        // INFO passed contract check send to sniffer
        tableToPutIn = tableToPutIn.replace("failed", "passed")
    } 
    connection.query("insert into "+tableToPutIn+" set ?", insertRow, function (err, result) {
        if(err){
            _l(err, level="ERROR")
        } else {
            _l(token["token_name"]+ " added", level="SUCCESS")
        }
    });
     
    
}

// INFO function to get the contract source using web3
async function getContractSource(tokenAddress) {
    try {
        let code = await web3.eth.getCode(tokenAddress)
        const evm = new EVM(code)
        let functions = evm.getFunctions()
        let events = evm.getEvents()
        let decompiled = ""
        _l("getContractSource "+tokenAddress, level="DEBUG")
        try {
            decompiled = evm.decompile()
        } catch (err) {
            _l("Could not get source code of "+ tokenAddress + "due to "+err, level="ERROR")
        }
        return {
            functions, events, decompiled
        }
        _l("getContractSource "+tokenAddress, level="DEBUG")
    } catch (err) {
        _l("Error getting "+tokenAddress+" source code", level="ERROR")
    }
}

// INFO function to run the python contract check script
function runContractCheck(filePath, token){    
    try {
        _l("runContractCheck "+filePath, level="DEBUG")
        const contractCheckProcess = spawn('python3', ["/home/fullsend/cryptovesting/scripts/rugmenot_contracts/scripts/contract_check.py", filePath])
        contractCheckProcess.stdout.on('data', (data) => {
            let stringVal = data.toString().trim()
            let index = stringVal.indexOf("Name=")
            if(index != -1){
                let resultPath = stringVal.split("Name=")[1]
                // TODO add function to add this coin to a new table which is the static coin check pass table
                let fileData = fs.readFileSync("/home/fullsend/cryptovesting/scripts/rugmenot_contracts/contracts/json/" + resultPath)
                let jsonData = JSON.parse(fileData)
                addToken(token, jsonData["totalScore"], resultPath)
            }
        })
        contractCheckProcess.on('error', () => console.log('failed to start'))
    } catch (err) {
        _l(err, level="ERROR")
    }    
}

const event = workerData
let token = event["affectedRows"][0]["after"]
try {
    getContractSource(token["contract_hash"]).then( (contractDict) => {
        let filePath = outputContractSource(token["token_name"], contractDict)
        runContractCheck(filePath, token)
    })
    parentPort.postMessage("Contract Check Successful on "+token["token_name"])
} catch (err) {
    parentPort.postMessage("Script error on "+token["token_name"])
}     
process.exit()