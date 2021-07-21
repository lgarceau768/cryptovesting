const { shared } = require('./scripts/shared.js')
const { init, _l: _ll } = require('./scripts/logger')
const { Worker, workerData, parentPort, isMainThread } = require('worker_threads')
const { ethers } = require('ethers')
const { EVM } = require('evm') 
const fs = require('fs')

// INFO setup shared
const { sendMessage, getWorkerData, BSC_MAINNET_URL, _jstr, WBNBAddressMainNet, pancakeSwapFactoryAddressMainNet, my_pk, AMOUNT_TO_BUY } = shared()
const date = new Date()
// INFO pull token from workerData or args
const token = getWorkerData(workerData, process, isMainThread)
try {
    path = "/home/fullsend/app/worker_manager/logs/sniperWorker_" + token +"_ "+ date.getTime() + ".log"
    init(path, "newSniperWorker.js")
} catch {
    path = "Z:\\Repos\\cryptovesting\\app\\worker_manager\\workers\\logs\\sniperWorker_" + token + "_ "+ date.getTime() + ".log"
    init(path, "newSniperWorker.js")
}


// INFO setup logger
const _l = (data, level="DEBUG") => {
    _ll(data, level);
}

// INFO setup contract 
const provider = new ethers.providers.JsonRpcProvider(BSC_MAINNET_URL)
const wallet = new ethers.Wallet(my_pk)
const account = wallet.connect(provider)
const pairCreated = new ethers.Contract(
    pancakeSwapFactoryAddressMainNet,
    [
        'event PairCreated(address indexed token0, address indexed token1, address pair, uint);'
    ],
    account
)


const watchForMint = async (token, pair) => {
    const mint = new ethers.Contract(
        pair,
        [
            'event Mint(address indexed sender, uint amount0, uint amount1)'
        ],
        account
    )
    let initialLiquidity = false
    mint.on('Mint', async(sender, amount0, amount1) => {
        if(initialLiquidity) {
            return
        } else {
            initialLiquidity = true
            _l("Minted token: "+token+" info: "+_jstr({sender, amount0, amount1}), "MINT")
            // INFO now spawn a buyWorker
            sendMessage("Mint="+token, _ll, parentPort, isMainThread, level)
            process.exit(0)
        }
    })
}

// INFO main worker code
const run = async () => {
    _l("Starting with token: "+token, level="STARTUP")

    pairCreated.on('PairCreated', async(token0, token1, pair) => {
        if(token1 == WBNBAddressMainNet) {
            _l("Pair found need to wait for mint: "+_jstr({token0, token1, pair}, level="PAIRCREATED"))
            watchForMint(token0, pair)
        }
    })
}

const test = async () => {
    let buyPath = "/home/fullsend/cryptovesting/app/worker_manager/workers/buyWorker.js"
    try {
        if (!fs.existsSync(buyPath)){
            throw Exception("windows")
        } 
    } catch {
        buyPath = "Z:\\Repos\\cryptovesting\\app\\worker_manager\\workers\\buyWorker.js"
    }
    const workerInfo = {
        workerData: {   
            token: token,
            amountToBuy: AMOUNT_TO_BUY.toString()
    }
    }
    const worker = new Worker(buyPath, workerInfo)
    worker.once('message', async (strResponse) => {
        // INFO pull out tx hash
        let index = strResponse.indexOf("Error=")
        if(index == -1){
            let hash = strResponse.split("_")[1]
            let tx = await provider.getTransaction(hash)
            let code = tx["data"]
            const evm = new EVM(code)
            try {
                let decompiled = evm.decompile()
                console.log(decompiled)
            } catch (err) {
                _l("Could not decode amount balance: "+err, level="ERROR")
            }
        } else {
            _l(strResponse, level="ERROR")
        }
    })
    worker.on('error', (error) => _l("BuyWorkerError: "+_jstr(workerInfo) +" has error: " +error, level="ERROR"))
    worker.on('exit', (code) => _l("BuyWorkerExit: "+_jstr(workerInfo) +" exited with code: "+code, level="EXIT"))
}

run()
