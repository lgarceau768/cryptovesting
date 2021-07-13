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
    GAS_AMOUNT,
    GAS_LIMIT
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
    return web3.utils.toHex(gasPrice)
}

// INFO function to calc the correct coin out
const getAmountOut = async (tokensAmt, token) => {
    const routerContract = new ethers.Contract(pancakeSwapRouterAddressTestNet, [
        'function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) external pure returns (uint amountOut)'
    ] , account)
    const price = await routerContract.getAmountOut(tokensAmt._hex, WBNBAddressTestNet, token)
    return price._hex
}

// INFO main run script
const run = async () => {
    try {
        _l("Starting buy with token: "+token+" amount of bnb: "+amountToBuy, level="STARTUP")
        const routerContract = new web3.eth.Contract(routerAbi, pancakeSwapRouterAddressTestNet)
        let bnbAmount = ethers.utils.parseEther(amountToBuy)
        let amountTokens = await getAmountOut(bnbAmount, token)
        const tokenPath = [
            WBNBAddressTestNet,
            token
        ]
        const gasLimit = await web3.eth.getBlock('latest')
        const deadline = web3.utils.toHex(Math.round(Date.now()/1000)+60*20)
        const contractCall = routerContract.methods.swapExactETHForTokens(
            amountTokens,
            tokenPath,
            my_acc_testnet,
            deadline
        )       
        
        const transaction = {
            "from": my_acc_testnet,
            "gasPrice": await _gas(),
            "gas": web3.utils.toHex(await web3.eth.estimateGas({
                from: my_acc_testnet,
                to: my_acc_testnet,
                amount: bnbAmount._hex        
            }) * 1.5),
            "gasLimit": web3.utils.toHex(gasLimit.gasLimit),
            "value": bnbAmount._hex,
            "data": contractCall.encodeABI(),
        }
        _l("Transaction: "+_jstr(transaction), level="TX")
        const signed = await web3.eth.accounts.signTransaction(transaction, my_pk)
        web3.eth.sendSignedTransaction(signed.rawTransaction)
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