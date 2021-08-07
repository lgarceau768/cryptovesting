const Web3 = require('web3')
const Common = require('ethereumjs-common').default;
var bip39 = require("bip39");
const fs = require('fs')
var { hdkey } = require('ethereumjs-wallet');

// INFO Constants
shared = () => {
    this.BSC_MAINNET_URL = 'https://bsc-dataseed.binance.org/'; //ankr or quiknode
    this.BSC_TESTNET_URL = "https://data-seed-prebsc-1-s1.binance.org:8545/"
    this.web3 = new Web3(new Web3.providers.HttpProvider(this.BSC_MAINNET_URL))
    this.BSC_FORK = Common.forCustomChain(
        'mainnet',
        {
            name: 'Binance Smart Chain Mainnet',
            networkId: 56,
            chainId: 56,
            url: 'https://bsc-dataseed.binance.org/'
        }
    );
    this.BSC_TESTNET_FORK = Common.forCustomChain(
        'mainnet',
        {
            name: 'Binance Smart Chain Testnet',
            networkId: 97,
            chainId: 97,
            url: 'https://data-seed-prebsc-1-s1.binance.org:8545/'
        }
    )
    try {
        this.routerAbi = JSON.parse(fs.readFileSync('/home/fullsend/cryptovesting/app/worker_manager/workers/contract_abis/pancakeswap_router_abi.json', 'utf-8'));
        this.factoryAbi = JSON.parse(fs.readFileSync("/home/fullsend/cryptovesting/app/worker_manager/workers/contract_abis/ps_factory.json", "utf-8"))
    } catch {
        this.routerAbi = JSON.parse(fs.readFileSync('Z:\\Repos\\cryptovesting\\sniper_bot\\js\\pancakeswap_router_abi.json', 'utf-8'));
        this.factoryAbi = JSON.parse(fs.readFileSync("Z:\\Repos\\cryptovesting\\app\\worker_manager\\workers\\contract_abis\\ps_factory.json", "utf-8"))
    }

    // set amount to buy with
    this.AMOUNT_TO_BUY = 3
    this.GAS_LIMIT = 60000000
    this.GAS_AMOUNT = 15000000

    // INFO Variables
    // INFO different accounts    
    this.my_acc_testnet = "0x01420A7b545ac6c99F2b91e9f73464AA69C6E248"//"0xeB8ceace9be0e8E7fCF356a7dc523256d10dE8fC"
    this.my_pk = "d4f44d00b1995222dde4ce2d39ce177c78030628c0a9536e0f99c904ff74bebb"//"6212aa6e4d2609a815d85f8afa7bc56264ffe337755ee2699caa2ebc2f6792d1"
    this.mnemonic = "plunge shove witness distance twist illness above other use alter shield echo"    
    this.WBNBAddressMainNet = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'; // WBNB token address
    this.WBNBAddressTestNet = '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd'; // WBNB token address
    this.pancakeSwapRouterAddressMainNet = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
    this.pancakeSwapRouterAddressTestNet = '0xD99D1c33F9fC3444f8101754aBC46c52416550D1';
    this.pancakeSwapFactoryAddressTestNet = "0xB7926C0430Afb07AA7DEfDE6DA862aE0Bde767bc"
    this.pancakeSwapFactoryAddressMainNet = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73"
    this.targetAccount = this.web3.eth.accounts.privateKeyToAccount(this.my_pk)
    this.web3.defaultAccount = this.targetAccount

    // INFO Functions
    // get account balance
    this._bal = async (account) => {
        let balance = await this.web3.eth.getBalance(account.address)
        console.log(`Current Account balance ${balance}`)
    }

    // get transaction hash
    this._gethash = async (signed_tx) => {
        var hash = await this.web3.utils.sha3(signed_tx, { encoding: "hex"})
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
        gasVals["gasPrice"] = await this.web3.eth.getGasPrice() * 2
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

    this.sendMessage = (data, _l, parentPort, isMainThread, level="DEBUG") => {
        if(isMainThread){
            _l(data, level=level)
        } else {
            parentPort.postMessage(data)
        }
    }

    this.getWorkerData = (workerData, process, isMainThread) => {
        if(isMainThread){
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

    return this
}

module.exports = {
    shared
}