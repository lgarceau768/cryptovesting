const web3 = require('web3')
var Tx = require('ethereumjs-tx')
const Variables = require('./Variables.js')
const LogObject = require('./LoggingObject.js')

class BinanceInteractor extends LogObject{
    constructor(net) {
        super('BinanceInteractor')
        this.Variables = new Variables(net);
        this.W3 = new web3(this.Variables.getSetting('bsc_url'))
        this.W3.eth.defaultAccount = this.W3.utils.toChecksumAddress(this.Variables.getSetting('account_address'))
        if(this.W3 === undefined) {
            throw new Error('Error initializing web3')
        }
        return this;
    }

    /** Conversion Methods */
    address(address) {
        return this.W3.utils.toChecksumAddress(address)
    }

    wei(amt) {
        return this.W3.utils.toWei(amt, 'wei')
    }

    gwei(amt) {
        return this.W3.utils.toWei(amt, 'gwei')
    }

    ether(amt) {
        return this.W3.utils.toWei(amt, 'ether')
    }

    hex(str) {
        return this.W3.utils.toHex(str)
    }

    accountObj() {
        if(this.accountObject === undefined) {
            this.accountObject = this.W3.eth.accounts.privateKeyToAccount(this.Variables.getSetting('account_pk'))
        }
        return this.accountObject
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }

    /**
     * Returns the nice value of the amount of tokens in ether
     * @param {amt} String Amount of Tokens in Ether 
     * @returns 
     */
    fromEthers(amt) {
        return this.W3.utils.fromWei(amt, 'ethers')
    }

    fromWei(amt) {
        return this.W3.utils.fromWei(amt)
    }

    signAndSendTx(txObj, cb) {
        const tx = new Tx(txObj)
        this.log(JSON.stringify(txObj, null, 2), 'tx')
        tx.sign(Buffer.from(this.Variables.getSetting('account_pk'), 'hex'))

        const txHash = tx.serialize()
        const hashString = '0x' + txHash.toString('hex')
        return this.W3.eth.sendSignedTransaction(hashString, (err, txHash) => {
           return cb(err, txHash)
        })
    }

    smartContractInterAct(contract_data, interactionCallBack) {
        let txObj = {
            gasPrice: this.hex(this.gwei(this.Variables.getSetting('gas_price'))),
            gas: this.hex(this.Variables.getSetting('gas_amount')),
            from: this.address(this.Variables.getSetting('account_address')),
            data: contract_data,
            nonce: this.hex((nonce + 1).toString()),
            to: contract_address
        }
        return this.signAndSendTx(txObj, interactionCallBack.bind(this))
    }

    /** Smart Contract Methods */
    /**
     * Amount will be in the decimals of the token
     */
    approve(contract_abi_id, contract_address, spender, amount) {        
        this.logArgs(contract_abi_id, contract_address, spender, amount)
        let tokenContract = this.createContract(contract_abi_id, contract_address)

        return this.W3.eth.getTransactionCount(this.address(this.Variables.getSetting('account_address')))
        .then((nonce) => {
            let approve_data = tokenContract.methods.approve(this.address(spender), amount).encodeABI()
            
            const approveCallBack = function (err, txHash) {
                if(err) {
                    this.log('error: '+err, 'error')
                    throw new Error('Error approving spender')
                } else {
                    return txHash
                }
            }
            return this.smartContractInterAct(approve_data, approveCallBack)
        })        
    }

    getAmountsOutPancakeRouterWBNB(amountIn, token) {
        return new Promise(() => this.getAmountsOutWBNB('pancake_router_abi', this.Variables.getSetting('ps_router_address'), amountIn, token))
    }

    getAmountsOutPancakeFactoryWBNB(amountIn, token) {
        return new Promise(() => this.getAmountsOutWBNB('pancake_factory_abi', this.Variables.getSetting('ps_factory_address'), amountIn, token))
    }

    getAmountsOutWBNB(contract_abi_id, contract_address, amountIn, token) {
        this.logArgs(contract_abi_id, contract_address, amountIn, token)
        let tokenContract = this.createContract(contract_abi_id, contract_address)
        let amountArray = tokenContract.methods.getAmountsOutWBNB(amountIn, [this.address(this.Variables.getSetting('wbnb_address')), this.address(token)]).call()
        let amounts = {
            'wbnb': amountArray[0],
            'token': amountArray[1]
        }
        this.log('Amounts out :'+JSON.stringify(amounts, null, 2))
        return amounts
    }

    approvePancakeRouterWBNB(amount) {
        return new Promise(() => this.approve('basic_sell_abi', this.Variables.getSetting('wbnb_address'), this.Variables.getSetting('ps_router_address'), amount));
    }

    approvePancakeFactoryWBNB(amount) {
        return new Promise(() => this.approve('basic_sell_abi', this.Variables.getSetting('wbnb_address'), this.Variables.getSetting('pancakeswap_factory_abi'), amount));
    }

    createContract(abiID, address) {
        this.logArgs(abiID, address)
        let jsonABI = this.Variables.getSetting(abiID)
        if(jsonABI === undefined) {
            throw new Error('Contract not found in settings')
            return
        }
        let contract = new this.W3.eth.Contract(jsonABI, this.address(address))
        if(contract === undefined) {
            throw new Error('Error initalizing contract')
            return
        }
        return contract
    }

    swapExactTokenForWBNB(amountWBNB, amountToken) {
        return
        let gasPrice = this.gwei(this.this.Variables.getSetting('gas_price'));
        let routerContract = this.createContract('pancake_router_abi', this.Variables.getSetting('ps_router_address'))
        let swapCall = routerContract.methods.swapExactETHForTokens(
            amountToken,
            [ this.address(this.Variables.getSetting('wbnb_address')), this.address(token)],
            this.address(this.Variables.getSetting('account_address')), 
            (int(time.time()) + 10000000)
        )
        let gasAmount = this.Variables.getSetting('gas_amount')
        let nonce = this.W3.getTransactionCount(this.Variables.getSetting('account_address'))
        let swapTx = swapCall.buildTransaction({
            'from': this.Variables.getSetting('account_address'),
            'value': amountWBNB,
            'gas': gasAmount,
            'gasPrice': gasPrice,
            'nonce': nonce
        })
        this.log('Swapping wbnb for '+token)
        let signedTx = this.accountObj().sign_transaction(swapTx)
        try {
            let transactionSwap = this.W3.eth.sendRawTransaction(signedTx.rawTransaction)
            let transactionSwapHash = this.hex(transactionSwap)
            this.log('Swap Transaction Hash '+transactionSwapHash, 'hash')
            return transactionSwapHash
        } catch (e) {
            this.log(e.toString(), 'swap fail')
            return -1
        }
    }

    swapExactWBNBForToken(amountToken) {
        let gasPrice = this.gwei(this.this.Variables.getSetting('gas_price'));
        let routerContract = this.createContract('pancake_router_abi', this.Variables.getSetting('ps_router_address'))
        let swapCall = routerContract.methods.swapExactTokensForETH(
            amountToken, 0
            [ this.address(token), this.address(this.Variables.getSetting('wbnb_address'))],
            this.address(this.Variables.getSetting('account_address')), 
            (int(time.time()) + 10000000)
        )
        let nonce = this.W3.getTransactionCount(this.Variables.getSetting('account_address'))
        let swapTx = swapCall.buildTransaction({
            'from': this.Variables.getSetting('account_address'),
            'gasPrice': gasPrice,
            'nonce': nonce
        })
        this.log('Swapping wbnb for '+token)
        let signedTx = this.accountObj().sign_transaction(swapTx)
        try {
            let transactionSwap = this.W3.eth.sendRawTransaction(signedTx.rawTransaction)
            let transactionSwapHash = this.hex(transactionSwap)
            this.log('Swap Transaction Hash '+transactionSwapHash, 'hash')
            return transactionSwapHash
        } catch (e) {
            this.log(e.toString(), 'swap fail')
            return -1
        }
    }

    buyWithSlippage(token) {        
        this.logArgs(token)
        let bnbAmt = this.Variables.getSetting('wbnb_buy_amt').toString()
        this.log('Attempting to buy '+bnbAmt+ ' of token '+token, 'buy')
        this.log('Going to approve router first')
        return this.approvePancakeRouterWBNB(this.ether(bnbAmt)).then((hash) => {
            this.log('approve hash '+hash, 'hash')
            let amounts = this.getAmountsOutPancakeRouterWBNB(this.ether(bnbAmt), token)
            let swapHash = this.swapExactTokenForWBNB(amounts['wbnb'], amounts['token'] * this.Variables.getSetting('slippage'))
            return { approvalHash: hash, swapHash, ...amounts};
        })
    }

    getTokenBalance(token) {
        let tokenContract = this.createContract('balance_abi', token)
        let balanceCall = tokenContract.methods.balanceOf(this.address(this.Variables.getSetting('account_address'))).call()
        let balanceValues = {
            'ethers': balanceCall.toString(),
            'token': this.fromWei(balanceCall.toString()).toString()
        }
        return balanceValues
    }

    async sellToken(token, amountToSell) {
        this.logArgs(token, amountToSell)
        // check token balance
        let balance = this.getTokenBalance(token)
        if(amountToSell > balance['token']) {
            throw new Error('Amount to sell exceeds token balance')
        }
        this.log('Selling '+amountToSell+' of '+token)
        this.log('Approving the balance')
        let approvalHash = this.approvePancakeRouterWBNB(balance)
        await this.sleep(5)
        let swapHash = this.swapExactWBNBForToken(amountToSell.toString())
        return { approvalHash, swapHash, amountToSell }
    }

    watchToken(token, initalAmountToken, initialAmountBnb, moon='false') {
        this.logArgs(token, initalAmountToken, initialAmountBnb, moon)
        // will spawn an interval to get the balance
        if(this.watchers === undefined) {
            this.watchers = [];
        }
        let startingBNB = initialAmountBnb
        let targetBNB = startingBNB * this.Variables.getSetting('sell_target_percent')
        if(moon) {
            targetBNB = startingBNB / this.Variables.getSetting('sell_target_percent') * this.Variables.getSetting('moon_percent')
        }
        global['watch'+token] = initalAmountToken
        let watchInterval = setInterval( function(token, initalAmountToken, targetBNB, moon) {
            let amountsOut = this.getAmountsOutPancakeFactoryWBNB(initalAmountToken, token)
            let currentBNB = amountsOut['wbnb']
            if(global['watch'+token] > targetBNB) { 
                // we have surpassed the amount to sell
                if(moon) {
                    // handles the sell all for moon
                    sellToken(token, currentBNB)
                    global['watch'+token] = undefined
                } else {
                    sellToken(token, currentBNB * this.Variables.getSetting('sell_amount'))
                    // will need to handle moon watching as well
                    watchToken(token, initalAmountToken * this.Variables.getSetting('keep_amount'), currentBNB * this.Variables.getSetting('keep_amount'), moon=true)
                }
                clearInterval(this)
            } else {                
                global['watch'+token] = currentBNB;
            }
        }.bind(this), this.Variables.getSetting('watcher_interval'))
    }

    handlePairEvent(event) {
        let pairEvent = this.W3.utils.toJSON(event)
        console.log(pairEvent)
        let { token0, token1 } = pairEvent['args']
    }

    snipe(token) {
        this.logArgs(token)
        let uniswapContract = this.createContract('uniswap_sniper_abi', this.Variables.getSetting('us_sniper_address'))
        let tokenAddress = this.address(token)
        global['snipe'+token+'_event_filter'] = uniswapContract.events.PairCreated.createFilter(fromBlock='lastest')
        global['snipe'+token+'_event_filter_call'] = function () {
            let uniswapContract = this.createContract('uniswap_sniper_abi', this.Variables.getSetting('us_sniper_address'))
            global['snipe'+token+'_event_filter'] = uniswapContract.events.PairCreated.createFilter(fromBlock='lastest')
        }.bind(this)
        setInterval( () => {
            try {
                let filter = global['snipe'+token+'_event_filter']
                let newEntries = filter.get_new_entries()
                newEntries.forEach(event => {
                    this.handlePairEvent(event)
                }); 
            } catch (e) {   
                let exceptionMessage = e.toString()
                if(exceptionMessage.indexOf('filter not found') != -1) {
                    global['snipe'+token+'_event_filter_call']();
                } else {
                    this.log('Sniper exception '+e, 'exception')
                }
            }           
        }, this.Variables.getSetting('sniper_interval'));
        return true
    }
}

module.exports = BinanceInteractor;