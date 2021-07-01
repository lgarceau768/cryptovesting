// INFO Requires
var fs = require('fs')
var Tx = require('ethereumjs-tx').Transaction;
var Web3 = require('web3')
var Common = require('ethereumjs-common').default;
var bip39 = require("bip39");
var { hdkey } = require('ethereumjs-wallet');

// INFO Variables
var web3 = new Web3(new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545/'))
var BSC_FORK = Common.forCustomChain(
    'mainnet',
    {
        name: 'Binance Smart Chain Mainnet',
        networkId: 56,
        chainId: 56,
        url: 'https://bsc-dataseed.binance.org/'
    },
    'istanbul'
);
var BSC_TESTNET_FORK = Common.forCustomChain(
    'mainnet',
    {
        name: 'Binance Smart Chain Testnet',
        networkId: 97,
        chainId: 97,
        url: 'https://data-seed-prebsc-1-s1.binance.org:8545/'
    },
    'istanbul'
)
var originalAmountToBuyWith = '0.02' + Math.random().toString().slice(2,7);
var bnbAmount = web3.utils.toWei(originalAmountToBuyWith, 'gwei');
console.log(bnbAmount)
// INFO Functions
// get account balance
const _bal = async () => {
    let balance = await web3.eth.getBalance(cryptovesting_account.address)
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
    gasVals["gasPrice"] = await web3.eth.getGasPrice() * 2
    //gasVals["gasPrice"] = web3.utils.toHex(10e9)
    let block = await web3.eth.getBlock("latest")
    gasVals["gasLimit"] = block.gasLimit
    return gasVals
}

// buy function with given account
const buyOnlyone = async (targetAccount, amount) => {

    var amountToBuyWith = web3.utils.toHex(amount);
    var privateKey = Buffer.from(targetAccount.privateKey.slice(2), 'hex')  ;
   // var abiArray = JSON.parse(JSON.parse(fs.readFileSync('onlyone-abi.json','utf-8')));
    var tokenAddress = '0x924f5d80b38af3cb88897c5210a58c307cc7376b'; // ONLYONE contract address
    var WBNBAddress = '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd'; // WBNB token address

    // var onlyOneWbnbCakePairAddress = '0xd22fa770dad9520924217b51bf7433c4a26067c2';
    // var pairAbi = JSON.parse(fs.readFileSync('cake-pair-onlyone-bnb-abi.json', 'utf-8'));
    // var pairContract = new web3.eth.Contract(pairAbi, onlyOneWbnbCakePairAddress/*, {from: targetAccount.address}*/);
    var amountOutMin = '1' + Math.random().toString().slice(2,6) + "e3";
    //var pancakeSwapRouterAddress = '0x10ed43c718714eb63d5aa57b78b54704e256024e';
    var pancakeSwapRouterAddress = '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3';

    var routerAbi = JSON.parse(fs.readFileSync('pancakeswap_router_abi.json', 'utf-8'))["abi"];
    var contract = new web3.eth.Contract(routerAbi, pancakeSwapRouterAddress, {from: targetAccount.address});
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
    let gas = await _gas()
    var count = await web3.eth.getTransactionCount(targetAccount.address);
    //console.log(`Total cost: ${gas["gasPrice"] * amtGas + amountToBuyWith}`)
    var rawTransaction = {
        "from":targetAccount.address,
        "gasPrice": gas["gasPrice"],
        "gasLimit":web3.utils.toHex(gas["gasLimit"]),
        "to":pancakeSwapRouterAddress,
        "value":web3.utils.toHex(amountToBuyWith),
        //"value":web3.utils.toWei('1', 'wei'),
        //"gas": amtGas,
        "data":data.encodeABI(),
        "nonce":web3.utils.toHex(count)
    };
    console.log(`Raw transaction ${_jstr(rawTransaction)}`)
    var transaction = new Tx(rawTransaction, { 'common': BSC_TESTNET_FORK });
    transaction = await web3.eth.accounts.signTransaction(rawTransaction, my_pk)
    console.log(`Transaction After Singing  ${_jstr(transaction)}`)
    var result = web3.eth.sendSignedTransaction(transaction["rawTransaction"])
        .on('trasnactionHash', (hash) => {
            console.log("Hash: "+str(hash))
        })
        .on('receipt', console.log);
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

// INFO different accounts
const my_pk = "6212aa6e4d2609a815d85f8afa7bc56264ffe337755ee2699caa2ebc2f6792d1"
const mnemonic = "plunge shove witness distance twist illness above other use alter shield echo"
const cryptovesting_account = generateAddressesFromSeed(mnemonic, 1)[0]
//var targetAccount = web3.eth.accounts.privateKeyToAccount(cryptovesting_account.privateKey)
var targetAccount = web3.eth.accounts.privateKeyToAccount(my_pk)

// INFO Porgram Start
async function run() {
    await _bal()
    console.log(`Buying ONLYONE for ${originalAmountToBuyWith} BNB from pancakeswap for address ${targetAccount.address}`);
    buyOnlyone(targetAccount, bnbAmount)
}

run()
