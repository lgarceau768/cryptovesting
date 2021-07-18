// INFO Requires
const { workerData, parentPort, isMainThread } = require('worker_threads')
const { shared } = require('./scripts/shared')
const { ethers } = require('ethers') 
const {
    sendMessage,
    getWorkerData,
    BSC_MAINNET_URL,
    web3,
    BSC_TESTNET_URL,
    my_pk,
    _jstr,
    pancakeSwapRouterAddressMainNet,
    pancakeSwapRouterAddressTestNet,
    routerAbi,
    WBNBAddressTestNet,
    my_acc_testnet,
    targetAccount
} = shared()
const { _l: _ll, init } = require('./scripts/logger.js')

// INFO constants
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
    return _hex(gasPrice)._hex
}

// INFO function to calc the correct coin out
const getAmountOut = async (tokensAmt, token) => {
    const routerContract = new ethers.Contract(pancakeSwapRouterAddressTestNet, [
        'function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut)'
    ] , account)
    const price = await routerContract.getAmountOut(_hex(tokensAmt), WBNBAddressTestNet, token)
    return price._hex
}

// INFO function to convert to wei
const _wei = (amt) => {
    return web3.utils.toWei(amt, 'wei')
}

// INFO function to convert to ether
const _ether = (amt) => {
    return ethers.utils.parseEther(amt)
}

// INFO function to convert to hex
const _hex = (amt) => {
    return ethers.utils.hexlify(amt)
}

// INFO main run script
const run = async () => {
    try {
        _l("Starting buy with token: "+token+" amount of bnb: "+amountToBuy, level="STARTUP")
        const routerContract = new ethers.Contract(pancakeSwapRouterAddressTestNet, routerAbi, account)
        let bnbAmount = _hex(_ether(amountToBuy))
        let amountTokens = await getAmountOut(bnbAmount, token)
        const tokenPath = [
            WBNBAddressTestNet,
            token
        ]
        const deadline = _hex(Math.round(Date.now()/1000)+60*20)

        const gasLimit = await provider.getBlock('latest')
        routerContract.swapTokensForExactTokens(
            bnbAmount,
            amountTokens,
            tokenPath,
            my_acc_testnet,
            deadline,{
                gasLimit: gasLimit.gasLimit._hex,
            }
        )
        .then((res) => {
            _l("Buy Result: "+_jstr(res), level="RESULT")
        })
        .catch((err) => {
            _l("Buy Error: "+_jstr(err), level="ERROR")
        })
    } catch (err) {
        _l("JS Error: "+_jstr(err)+"\n"+err.toString(), level="CRITICAL")
    }
    
}

run()