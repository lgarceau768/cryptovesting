// INFO Requires
var fs = require('fs')
var Tx = require('ethereumjs-tx').Transaction;
var Web3 = require('web3')
var Common = require('ethereumjs-common').default;
var bip39 = require("bip39");
var { hdkey } = require('ethereumjs-wallet');

// INFO Constants
const web3 = new Web3(new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545/'))
const BSC_FORK = Common.forCustomChain(
    'mainnet',
    {
        name: 'Binance Smart Chain Mainnet',
        networkId: 56,
        chainId: 56,
        url: 'https://bsc-dataseed.binance.org/'
    },
    'istanbul'
);
const BSC_TESTNET_FORK = Common.forCustomChain(
    'mainnet',
    {
        name: 'Binance Smart Chain Testnet',
        networkId: 97,
        chainId: 97,
        url: 'https://data-seed-prebsc-1-s1.binance.org:8545/'
    },
    'istanbul'
)
const WBNBAddress = '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd'; // WBNB token address
const pancakeSwapRouterAddress = '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3';
const routerAbi = JSON.parse(fs.readFileSync('sniper_bot/js/pancakeswap_router_abi.json', 'utf-8'));
const GAS_AMOUNT = 1500000

// INFO Variables
// INFO different accounts
const my_pk = "6212aa6e4d2609a815d85f8afa7bc56264ffe337755ee2699caa2ebc2f6792d1"
const mnemonic = "plunge shove witness distance twist illness above other use alter shield echo"
// const cryptovesting_account = generateAddressesFromSeed(mnemonic, 1)[0]
//var targetAccount = web3.eth.accounts.privateKeyToAccount(cryptovesting_account.privateKey)
var targetAccount = web3.eth.accounts.privateKeyToAccount(my_pk)

// INFO Functions
// get account balance
const _bal = async (account) => {
    let balance = await web3.eth.getBalance(account.address)
    console.log(`Current Account balance ${balance}`)
}

// get transaction hash
const _gethash = async (signed_tx) => {
    var hash = await web3.utils.sha3(signed_tx, { encoding: "hex"})
    console.log(`Transaction hash ${hash}`)
} 

// json shorthand pretty print
const _jstr = (json_dict) => JSON.stringify(json_dict, null, 2)

// get gas vars
async function _gas() {
    let gasVals = {
        "gasPrice": 0,
        "gas": 0,
    }
    gasVals["gasPrice"] = await web3.eth.getGasPrice() * 1.4
    return gasVals
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
    var token = process.argv[2].toString()
    var amountToBuyWithDecimal = 0.003 // need to multiply by 100000
    var originalAmountToBuyWith = (amountToBuyWithDecimal * 100000).toString() + Math.random().toString().slice(2,7);                  
    var bnbAmount = web3.utils.toWei(originalAmountToBuyWith, 'gwei');
    buyTokenWithBNB(targetAccount, bnbAmount, token)
}

run()
