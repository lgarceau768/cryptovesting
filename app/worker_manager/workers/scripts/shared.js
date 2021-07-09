const Web3 = require('web3')
const Common = require('ethereumjs-common').default;
var bip39 = require("bip39");
const fs = require('fs')
var { hdkey } = require('ethereumjs-wallet');

// INFO Constants
this.web3 = new Web3(new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545/'))
this.BSC_FORK = Common.forCustomChain(
    'mainnet',
    {
        name: 'Binance Smart Chain Mainnet',
        networkId: 56,
        chainId: 56,
        url: 'https://bsc-dataseed.binance.org/'
    },
    'istanbul'
);
this.BSC_TESTNET_FORK = Common.forCustomChain(
    'mainnet',
    {
        name: 'Binance Smart Chain Testnet',
        networkId: 97,
        chainId: 97,
        url: 'https://data-seed-prebsc-1-s1.binance.org:8545/'
    },
    'istanbul'
)
this.WBNBAddress = '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd'; // WBNB token address
this.pancakeSwapRouterAddress = '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3';
this.routerAbi = JSON.parse(fs.readFileSync('/home/fullsend/cryptovesting/sniper_bot/js/pancakeswap_router_abi.json', 'utf-8'));
this.GAS_AMOUNT = 1500000

// INFO Variables
// INFO different accounts
this.my_pk = "6212aa6e4d2609a815d85f8afa7bc56264ffe337755ee2699caa2ebc2f6792d1"
this.mnemonic = "plunge shove witness distance twist illness above other use alter shield echo"
// const cryptovesting_account = generateAddressesFromSeed(mnemonic, 1)[0]
//var targetAccount = web3.eth.accounts.privateKeyToAccount(cryptovesting_account.privateKey)
this.targetAccount = web3.eth.accounts.privateKeyToAccount(my_pk)

// INFO Functions
// get account balance
this._bal = async (account) => {
    let balance = await web3.eth.getBalance(account.address)
    console.log(`Current Account balance ${balance}`)
}

// get transaction hash
this._gethash = async (signed_tx) => {
    var hash = await web3.utils.sha3(signed_tx, { encoding: "hex"})
    console.log(`Transaction hash ${hash}`)
} 

// json shorthand pretty print
this._jstr = (json_dict) => JSON.stringify(json_dict, null, 2)

// get gas vars
this._gas = async () => {
    let gasVals = {
        "gasPrice": 0,
        "gas": 0,
    }
    gasVals["gasPrice"] = await web3.eth.getGasPrice() * 2
    return gasVals
}


// function to create address from mnemonic
this.generateAddressesFromSeed = (mnemonic, count) => {  
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

this.sendMessage = (data, _l, parentPort=null) => {
    if(parentPort == null){
        _l(data)
    } else {
        parentPort.sendMessage(data)
    }
}

this.getWorkerData = (workerData, process) => {
    if(workerData == null){
        return process.argv[2]
    } else {
        return workerData
    }
}

this.sqlData = {
    host: "localhost",
    user: "root",
    password: "Spook524*",
    database: "cryptovesting",
    insecureAuth: true
}

module.exports = {
    ...this
}