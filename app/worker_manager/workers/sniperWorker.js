const { shared } = require('./scripts/shared.js')
const { init, _l: _ll } = require('./scripts/logger')
const { workerData, parentPort, isMainThread } = require('worker_threads')
const { ethers } = require('ethers')

// INFO setup shared
const { sendMessage, getWorkerData, BSC_MAINNET_URL, _jstr, WBNBAddressMainNet, pancakeSwapFactoryAddressMainNet, my_pk } = shared()
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
    console.log(data)
    sendMessage(data, _ll, parentPort, isMainThread, level)
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

run()
