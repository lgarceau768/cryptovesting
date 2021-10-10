from eth_utils import address
import web3, time, json, math
from lib import logger, variables

class BinanceInteractor(logger.LogObject):
    def __init__(self, net):
        super().__init__('BinanceInteractor')
        self.variables = variables.Variables(net)
        self.w3 = web3.Web3(web3.HTTPProvider(self.variables.getSetting('bsc_url')))
        self.walletAdr = self.variables.getSetting('account_address')
        self.walletPk = self.variables.getSetting('account_pk')
        self.wallet = self.w3.eth.account.privateKeyToAccount(self.walletPk)
        
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
        time.sleep(15)

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
        gasPrice = self.variables.getSetting('gas_price')
        gasPrice = self.gwei(gasPrice)
        gasAmount = self.variables.getSetting('gas_amount')
        nonce = self.w3.eth.getTransactionCount(self.address(self.walletAdr))
        params = {
            'nonce': nonce,
            'gasPrice': gasPrice,
            'from': self.address(self.walletAdr)
        }
        if txParams is not None:
            params.update(txParams)
        tx = smartContractFunc.buildTransaction(params)
        signedTx = self.w3.eth.account.signTransaction(tx, self.walletPk)
        try:
            txHash = self.w3.eth.sendRawTransaction(signedTx.rawTransaction)
            txHash = self.w3.toHex(txHash)
            self.log(txHash, 'txHash')
            return txHash
        except Exception as e:
            self.log('exception creating tx '+str(e), 'error')
            return None

    def getCoinInfo(self, token):
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
        return self.createTransaction(swapCall, extraParams, True)
    
    def swapExactTokensForETH(self, amount1, token1, token2):
        self.logArgs(amount1, token1, token2)
        pancakeRouterContract = self.createContract('pancake_router_abi', self.variables.getSetting('ps_router_address'))
        swapCall = pancakeRouterContract.functions.swapExactTokensForETH(
            amount1,
            0,
            [self.address(token1), self.address(token2)],
            self.address(self.walletAdr),
            (int(time.time()) + 10000000) 
        )
        return self.createTransaction(swapCall, None, True)

    def buyToken(self, token):
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
                return {
                    'swapHash': swapHash,
                    'approveHash': approveHash,
                    'amounts': amountsOut
                }
            else:
                self.log('Swap hash fail', 'fail')
                return None
        else:
            self.log('Approval hash fail', 'fail')
            return None