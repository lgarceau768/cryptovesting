const { shared } = require('./scripts/shared.js')
const { init, _l: _ll } = require('./scripts/logger')
const { Worker, workerData, parentPort, isMainThread } = require('worker_threads')
const { ethers } = require('ethers')
const { EVM } = require('evm') 
const fs = require('fs')
const path = require('path')

// INFO setup shared
const { 
    sendMessage, 
    getWorkerData, 
    BSC_MAINNET_URL, 
    BSC_TESTNET_URL,
    _jstr, 
    WBNBAddressMainNet, 
    WBNBAddressTestNet, 
    pancakeSwapFactoryAddressMainNet, 
    my_pk, 
    pancakeSwapFactoryAddressTestNet,
    factoryABI
} = shared()
const date = new Date()
// INFO pull token from workerData or args
const token = getWorkerData(workerData, process, isMainThread)
let pathLog = ""
pathLog = path.join(__dirname,'logs', "sniperWorker_" + token + "_"+ Date.now() + ".log")
init(pathLog, "newSniperWorker.js")


// INFO setup logger
const _l = (data, level="DEBUG") => {
    _ll(data, level)
}

// INFO setup contract 
const provider = new ethers.providers.JsonRpcProvider(BSC_TESTNET_URL)
const wallet = new ethers.Wallet(my_pk)
const account = wallet.connect(provider)
const pairCreated = new ethers.Contract(
    pancakeSwapFactoryAddressTestNet,
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
    try {
        pairCreated.on('PairCreated', async(token0, token1, pair) => {
            // FIXME may need to look at potentially checking for the token back to bnb pair as well
            if(token1.toLowerCase() == token.toLowerCase() && token0.toLowerCase() == WBNBAddressTestNet.toLowerCase()) {
                _l("Liquidity added for token token: "+token+" info: "+_jstr({token0, token1, pair}), "MINT")
                // INFO now spawn a buyWorker
                sendMessage("Mint="+token, _ll, parentPort, isMainThread)
            }
        })
    } catch (e) {
        _l("Failed on "+_jstr(e), level="CRITICAL")
        sendMessage("Fail="+e, _ll, parentPort, isMainThread)
    }
    
}

run()
