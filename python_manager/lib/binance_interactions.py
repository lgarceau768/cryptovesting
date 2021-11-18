from eth_utils import address
import web3, time, json, math, threading
from lib import logger, variables

class BinanceInteractor(logger.LogObject):
    def __init__(self, net):
        super().__init__('BinanceInteractor')
        self.variables = variables.Variables(net)
        self.w3 = web3.Web3(web3.HTTPProvider(self.variables.getSetting('bsc_url')))
        self.walletAdr = self.variables.getSetting('account_address')
        self.walletPk = self.variables.getSetting('account_pk')
        self.wallet = self.w3.eth.account.privateKeyToAccount(self.walletPk)
        self.runningOperations = [] # container of threads
        
    def address(self, address):
        return self.w3.toChecksumAddress(address)
    
    def wei(self, amt):
        return self.w3.toWei(amt, 'wei')

    def gwei(self, amt):
        return self.w3.toWei(amt, 'gwei')
    
    def ether(self, amt):
        return self.w3.toWei(amt, 'ether')
    
    def hex(self, str):
        return self.w3.toHex(str)
    
    def sleep(self):
        time.sleep(self.variables.getSetting('tx_delay'))

    def fromEthers(self, amt):
        return self.w3.fromWei(amt, 'ether')

    def fromWei(self, amt):
        return self.w3.fromWei(amt, 'wei')

    def createContract(self, abiID, address):
        self.logArgs(abiID, address)
        contractAbi = self.variables.getSetting(abiID)
        contract = self.w3.eth.contract(address=self.address(address), abi=contractAbi)
        return contract
    
    def createTransaction(self, smartContractFunc, txParams=None, increaseNonce=False):
        self.logArgs(smartContractFunc, txParams, increaseNonce)
        gasPrice = self.variables.getSetting('gas_price')
        gasPrice = self.gwei(gasPrice)
        gasAmount = self.variables.getSetting('gas_amount')
        nonce = self.w3.eth.getTransactionCount(self.address(self.walletAdr))
        params = {
            'nonce': nonce,
            'gasPrice': gasPrice,
            'from': self.address(self.walletAdr)
        }
        if addGas:
            params.update({'gas': gasAmount})
        if txParams is not None:
            params.update(txParams)
        self.log('Building TX', 'tx')
        tx = smartContractFunc.buildTransaction(params)
        self.log('Signing TX', 'tx')
        signedTx = self.w3.eth.account.sign_transaction(tx, self.walletPk)
        try:
            self.log('Sending TX', 'tx')
            txHash = self.w3.eth.send_raw_transaction(signedTx.rawTransaction)
            txHash = self.w3.toHex(txHash)
            self.log(txHash, 'txHash')
            return txHash
        except Exception as e:
            self.log('exception creating tx '+str(e), 'error')
            return None

    def getCoinInfo(self, token):
        self.logArgs(token)
        tokenContract = self.createContract('erc20_abi', token)
        name = tokenContract.functions.name().call()
        symbol = tokenContract.functions.symbol().call()
        balance = tokenContract.functions.balanceOf(self.walletAdr).call()
        rawBalance = balance
        balance = str(self.fromEthers(balance))
        balance = balance[:balance.index('.') + 3]
        ret = {'name': name, 'symbol': symbol, 'balance': balance, 'rawBalance': rawBalance}
        self.log(json.dumps(ret), 'coin info')
        return ret
    
    def approve(self, abiId, contractAddress, spender, amount):
        self.logArgs(abiId, contractAddress, spender, amount)
        approvalContract = self.createContract(abiId, contractAddress)
        approveCall = approvalContract.functions.approve(self.address(spender), amount)
        return self.createTransaction(approveCall)

    def getAmountsOut(self, amount, token1, token2):
        self.logArgs(amount, token1, token2)
        pancakeRouterContract = self.createContract('pancake_router_abi', self.variables.getSetting('ps_router_address'))
        getAmountsCall = pancakeRouterContract.functions.getAmountsOut(amount, [self.address(token1), self.address(token2)]).call()
        return getAmountsCall
    
    def swapExactETHForTokens(self, amount1, amount2, token1, token2):
        self.logArgs(amount1, token1, amount2, token2)
        pancakeRouterContract = self.createContract('pancake_router_abi', self.variables.getSetting('ps_router_address'))
        swapCall = pancakeRouterContract.functions.swapExactETHForTokens(
            amount2,
            [self.address(token1), self.address(token2)],
            self.address(self.walletAdr),
            (int(time.time()) + 10000000) 
        )
        extraParams = {
            'value': amount1
        }
        return self.createTransaction(swapCall, extraParams, False)
    
    def swapExactTokensForETH(self, amount1, token1, token2, amount2=0):
        self.logArgs(amount1, token1, token2)
        pancakeRouterContract = self.createContract('pancake_router_abi', self.variables.getSetting('ps_router_address'))
        swapCall = pancakeRouterContract.functions.swapExactTokensForETH(
            amount1,
            amount2,
            [self.address(token1), self.address(token2)],
            self.address(self.walletAdr),
            (int(time.time()) + 10000000) 
        )
        return self.createTransaction(swapCall, None, True)

    def sellToken(self, token, sellAmount):
        self.logArgs(token, sellAmount)
        self.log('Selling token '+token, 'sell')
        tokenToSellInfo = self.getCoinInfo(token)
        sellInEthers = self.ether(str(sellAmount))
        wbnbAdr = self.variables.getSetting('wbnb_address')
        if tokenToSellInfo['rawBalance'] < sellInEthers:
            self.log('Insufficent Balance on '+token, 'user-fail')
            return None
        else:
            approveHash = self.approve('basic_sell_abi', token, self.variables.getSetting('ps_router_address'), tokenToSellInfo['rawBalance'])
            if approveHash is not None:
                self.sleep()
                self.log('Approval hash '+approveHash, 'approved')
                swapHash = self.swapExactTokensForETH(sellInEthers, token, wbnbAdr)
                if swapHash is not None:
                    self.log('Swap hash '+swapHash, 'swapped')
                    return {
                        'swapHash': swapHash,
                        'approvalHash': approveHash,
                        'sellAmount': sellInEthers
                    }
                else:
                    self.log('Swap hash fail', 'fail')
                    return None
            else:
                self.log('Approval hash fail', 'fail')
                return None

    def buyToken(self, token):
        self.logArgs(token)
        self.log('Buying token '+token, 'buy')
        bnbBalance = self.w3.eth.getBalance(self.walletAdr)
        bnbAmount = self.ether(str(self.variables.getSetting('wbnb_buy_amount')))
        wbnbAdr = self.variables.getSetting('wbnb_address')
        approveHash = self.approve('basic_sell_abi', wbnbAdr, self.variables.getSetting('ps_router_address'), bnbBalance)
        if approveHash is not None:
            self.sleep()
            self.log('Approval hash '+approveHash, 'approved')
            amountsOut = self.getAmountsOut(bnbAmount, wbnbAdr, token)
            swapHash = self.swapExactETHForTokens(bnbAmount, math.floor(amountsOut[1] * 0.75), wbnbAdr, token)
            if swapHash is not None:
                self.log('Swap hash '+swapHash, 'swapped')
                self.kill_dead_operations()
                return {
                    'swapHash': swapHash,
                    'approveHash': approveHash,
                    'amounts': amountsOut
                }
            else:
                self.log('Swap hash fail', 'fail')
                self.kill_dead_operations()
                return None
        else:
            self.log('Approval hash fail', 'fail')
            self.kill_dead_operations()
            return None

    def sellToken(self, token, sellAmount):
        self.log('Selling token '+token, 'sell')
        tokenInfo = self.getCoinInfo(token)
        sellEthers = self.ether(sellAmount)
        tokenBalance = tokenInfo['rawBalance']
        approveHash = self.approve('basic_sell_abi', token, self.variables.getSetting('ps_router_address'), tokenBalance)
        if approveHash is not None:
            self.sleep()
            self.log('Approval hash '+approveHash, 'approved')
            swapHash = self.swapExactTokensForETH(sellEthers, token, self.variables.getSetting('wbnb_address'))
            if swapHash is not None:
                self.log('Swap hash '+swapHash, 'swapped')
                self.kill_dead_operations()
                return {
                    'swapHash': swapHash,
                    'approveHash': approveHash,
                    'amounts': [sellEthers]
                }
            else:
                self.log('Swap hash fail', 'fail')
                self.kill_dead_operations()
                return None
        else:
            self.log('Approval hash fail', 'fail')
            self.kill_dead_operations()
            return None
            
    def kill_dead_operations(self):
        removeIds = []
        for operation in self.runningOperations:
            thread = operation['operation']
            if not thread.is_alive():
                removeIds.append(operation['id'])

        for opId in removeIds:
            foundIndex = -1
            for i in range(0, len(self.runningOperations)):
                if self.runningOperations[i]['id'] == opId:
                    foundIndex = i
            if foundIndex != -1:
                self.runningOperations.pop(foundIndex)


    def start_buy(self, token):
        buyThread = threading.Thread(target=self.buyToken, args=(token,))
        self.runningOperations.append({
            'id': len(self.runningOperations),
            'operation': buyThread
        })
        buyThread.start()

    def start_sell(self, token, sellAmount):
        sellThread = threading.Thread(target=self.sellToken, args=(token,sellAmount,))
        self.runningOperations.append({
            'id': len(self.runningOperations),
            'operation': sellThread
        })
        sellThread.start()
