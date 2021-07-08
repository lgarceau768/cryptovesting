// INFO Requires
var fs = require('fs')
var Tx = require('ethereumjs-tx').Transaction;
var bip39 = require("bip39");
var { hdkey } = require('ethereumjs-wallet');
var { workerData, parentPort } = require('worker_threads')

let token = workerData
if(workerData == null){
    token = process.argv[2].toString()
}

var {
    _gas,
    _jstr,
    _bal,
    targetAccount,
    my_pk,
    GAS_AMOUNT,
    routerAbi,
    pancakeSwapRouterAddress,
    WBNBAddress,
    BSC_TESTNET_FORK,
    BSC_FORK,
    web3
}

// buy function with given account and tokenAddress
const buyTokenWithBNB = async (targetAccount, amount, tokenAddress) => {
    // convert amount to buy with
    var amountToBuyWith = web3.utils.toHex(amount);
    var amountOutMin = '1' + Math.random().toString().slice(2,6) + "e3";

    // parse the contract of pancakeSwapRouter
    var contract = new web3.eth.Contract(routerAbi, pancakeSwapRouterAddress, {from: targetAccount.address});

    // execute the contract function swapExactETHForTokens
    console.log(`Contract Params ${_jstr({
        buy: amountToBuyWith,
        amount: web3.utils.toHex(amountOutMin),
        pair: [WBNBAddress,
         tokenAddress],
        to: targetAccount.address,
        timeout: web3.utils.toHex(Math.round(Date.now()/1000)+60*20)})}`)
    var data = contract.methods.swapExactETHForTokens(
        web3.utils.toHex(amountOutMin),
        [WBNBAddress,
         tokenAddress],
        targetAccount.address,
        web3.utils.toHex(Math.round(Date.now()/1000)+60*20),
    );

    // pull down the info for the transaction
    let gas = await _gas()
    var rawTransaction = {
        "from":targetAccount.address,
        "gasPrice": gas["gasPrice"],
        "to":pancakeSwapRouterAddress,
        "value":web3.utils.toHex(amountToBuyWith),
        "gas": GAS_AMOUNT,
        "data": data.encodeABI(),
    };

    // sign the transaction and send it to the chain
    console.log(`Raw transaction ${_jstr(rawTransaction)}`)
    var transaction = new Tx(rawTransaction, { 'common': BSC_TESTNET_FORK });
    transaction = await web3.eth.accounts.signTransaction(rawTransaction, my_pk)
    console.log(`Transaction After Singing  ${_jstr(transaction)}`)
    web3.eth.sendSignedTransaction(transaction["rawTransaction"])
        .on('trasnactionHash', (hash) => {
            console.log("Hash: "+str(hash))
        })
        .on('receipt', console.log);
}

// watch liquduity funciton
const watchLiquidity = (token, amountToBuyWithDecimal) => {
    var contract = new web3.eth.Contract(routerAbi, pancakeSwapRouterAddress, {from: targetAccount.address});
    contract.events.PairCreated({
        filter: {
            token0: WBNBAddress,
            token1: token
        }
    }).on('data', async function (event){
        console.log("Event: "+event)
    })

    return
    // old
    let pairFilter = contract.events.PairCreated.createFilter(fromBlock="latest");
    try {
        pairFilter.getNewEntries.forEach(PairCreated => {
            let jsonEventValue = JSON.parse(web3.utils.toJSON(PairCreated))
            console.log(_jstr(jsonEventValue))
            if(jsonEventValue["args"]["token0"] == WBNBAddress &&
                jsonEventValue["args"]["token1"] == token) {
                    // INFO set buy variables here                              
                    var originalAmountToBuyWith = (amountToBuyWithDecimal * 100000).toString() + Math.random().toString().slice(2,7);                  
                    var bnbAmount = web3.utils.toWei(originalAmountToBuyWith, 'gwei');
                    buyTokenWithBNB(targetAccount, bnbAmount, token)
                }
        });
    } catch (err) {
        console.log("HandleEvent Exception: "+err)
    }
}

// function to create address from mnemonic
const generateAddressesFromSeed = (mnemonic, count) => {  
    let seed = bip39.mnemonicToSeedSync(mnemonic);
    let hdwallet = hdkey.fromMasterSeed(seed);
    let wallet_hdpath = "m/44'/60'/0'/0/";
    
    let accounts = [];
    for (let i = 0; i < count; i++) {
      let wallet = hdwallet.derivePath(wallet_hdpath + i).getWallet();
      let address = "0x" + wallet.getAddress().toString("hex");
      let privateKey = wallet.getPrivateKey().toString("hex");
      accounts.push({ address: address, privateKey: privateKey });
    }
    return accounts;
  }


// INFO Porgram Start
async function run() {
    await _bal(targetAccount)    
    var amountToBuyWithDecimal = 0.003 // need to multiply by 100000
    var originalAmountToBuyWith = (amountToBuyWithDecimal * 100000).toString() + Math.random().toString().slice(2,7);                  
    var bnbAmount = web3.utils.toWei(originalAmountToBuyWith, 'gwei');
    buyTokenWithBNB(targetAccount, bnbAmount, token)
}

run()
