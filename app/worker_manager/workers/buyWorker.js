// INFO Requires
const Tx = require('ethereumjs-tx').Transaction;
const { workerData, parentPort, isMainThread } = require('worker_threads')
const { shared } = require('./scripts/shared')
const { ethers } = require('ethers') 
const {
    sendMessage,
    getWorkerData,
    BSC_MAINNET_URL,
    BSC_TESTNET_URL,
    my_pk,
    _jstr,
    pancakeSwapRouterAddressMainNet,
    pancakeSwapRouterAddressTestNet,
    routerAbi,
    WBNBAddressTestNet,
    my_acc_testnet,
    GAS_AMOUNT,
    GAS_LIMIT
} = shared()
const info = getWorkerData(workerData, process, isMainThread)
let token, amountToBuy;
try {
    token = info["token"]
    amountToBuy = info["amountToBuy"]
    if (token == undefined || amountToBuy == undefined) {
        throw Exception("json parse")
    }
} catch {
    jsonVal = JSON.parse(info)
    token = jsonVal["token"]
    amountToBuy = jsonVal["amountToBuy"].toString()
}
 
const { _l: _ll, init } = require('./scripts/logger.js')
let date = new Date()
let path = ""
try {
    path = "/home/fullsend/app/worker_manager/logs/buyWorker_" + token +"_ "+ date.getTime() + ".log"
    init(path, "buyWorker.js")
} catch {
    path = "Z:\\Repos\\cryptovesting\\app\\worker_manager\\workers\\logs\\buyWorker_" + token + "_ "+ date.getTime() + ".log"
    init(path, "buyWorker.js")
}
const _l = (data, level="DEBUG") => {
    _ll(data, level)
}

// INFO setup contract
const provider = new ethers.providers.JsonRpcProvider(BSC_TESTNET_URL)
const wallet = new ethers.Wallet(my_pk)
const account = wallet.connect(provider)

// INFO get gas
const _gas = async () => {
    let gasPrice = await provider.getGasPrice() * 1.4
    return gasPrice
}

// INFO main run script
const run = async () => {
    _l("Starting buy with token: "+token+" amount of bnb: "+amountToBuy, level="STARTUP")
    let gasPrice = await _gas()
    let contract = new ethers.Contract(pancakeSwapRouterAddressTestNet, routerAbi, account)
    let numberOfTokens = ethers.utils.parseUnits(amountToBuy, 18)
    let amountMin = ethers.utils.parseUnits(amountToBuy, 18) 
    let balance = await provider.getBalance(my_acc_testnet)
    _l("Balance: "+balance, level="BALANCE")
    _l("Number of tokens: "+numberOfTokens, level="INFO")
    let deadline = ethers.utils.hexlify(Math.round(Date.now()/1000)+60*2)
    let params = {
        bnbAmount: numberOfTokens,
        amountMin,
        path: [
            WBNBAddressTestNet,
            token
        ],
        to: my_acc_testnet,
        deadline,
    }
    _l("Buy Params: "+_jstr(params), level="PARAMS")
    contract.swapExactETHForTokens(numberOfTokens, [WBNBAddressTestNet, token], my_acc_testnet, deadline, {
        gasPrice,
        gasLimit: GAS_LIMIT,
    }).then((result) => {
        _l("Buy Result: "+_jstr(result), level="RESULT")
        parentPort.postMessage("Result=success_"+result["hash"])
    }).catch((err) => {
        _l("Buy Error: "+_jstr(err), level="ERROR")
        parentPort.postMessage("Error="+_jstr(err))
    })
}

run()