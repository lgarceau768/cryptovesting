const { EVM } = require('evm')
const fs = require('fs')
const { spawn } = require('child_process')
const mysql = require('mysql')
const path = require('path')
const Web3 = require('web3')
const mysqlEvents = require('@rodrigogs/mysql-events')
const web3 = new Web3(new Web3.providers.HttpProvider("https://bsc-dataseed.binance.org/"))

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
    let dir = "scripts\\rugmenot_contracts\\contracts\\sol files"
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
            console.log("Could not get source code of "+ tokenAddress + "due to "+err)
        }
        return {
            functions, events, decompiled
        }
    } catch (err) {
        console.log("Error getting "+tokenAddress+" source code")
    }
}

// INFO function to run the python contract check script
function runContractCheck(filePath){
    const contractCheckProcess = spawn('python', ["scripts\\rugmenot_contracts\\scripts\\contract_check.py", filePath])
    contractCheckProcess.stdout.on('data', (data) => {
        let stringVal = data.toString().trim()
        let index = stringVal.indexOf("Name=")
        if(index != -1){
            let resultPath = stringVal.split("Name=")[1]
            // TODO add function to add this coin to a new table which is the static coin check pass table
            let fileData = fs.readFileSync(path.join("scripts\\rugmenot_contracts\\contracts\\json", resultPath))
            console.log("Result data: "+JSON.stringify(fileData.toString().trim(), null, 4))
        }
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
        expression: '*.tokens',
        statement: "INSERT",
        onEvent: async (event) => {
            let token = event["affectedRows"][0]["after"]
            let contractDict = await getContractSource(token["contract_hash"])
            let filePath = outputContractSource(token["token_name"], contractDict)
            runContractCheck(filePath)
        }
    })
}

program()
