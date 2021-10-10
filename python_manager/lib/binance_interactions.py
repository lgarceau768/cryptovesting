from eth_utils import address
import web3, time, json
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
    
    def sleep(self, ms):
        time.sleep(ms)

    def fromEthers(self, amt):
        return self.w3.fromWei(amt, 'ether')

    def fromWei(self, amt):
        return self.w3.fromWei(amt, 'wei')

    def createContract(self, abiID, address):
        self.logArgs(abiID, address)
        contractAbi = self.variables.getSetting(abiID)
        contract = self.w3.eth.contract(address=self.address(address), abi=contractAbi)
        return contract
    
    def createTransaction(self, smartContractFunc, txParams=None):
        gasPrice = self.variables.getSetting('gas_price')
        gasPrice = self.gwei(gasPrice)
        gasAmount = self.variables.getSetting('gas_amount')
        nonce = self.w3.eth.getTransactionCount(self.address(self.walletAdr)) + 1
        params = {
            'nonce': nonce,
            'gasPrice': gasPrice,
            'gas': gasAmount,
            'from': self.walletAdr
        }
        if txParams is not None:
            params.update(txParams)
        tx = smartContractFunc.buildTransaction(params)
        signedTx = self.wallet.sign_transaction(tx)
        try:
            txHash = self.hex(self.w3.eth.sendRawTransaction(signedTx.rawTransaction))
            self.log(txHash, 'txHash')
            return txHash
        except Exception as e:
            self.log('exception creating tx '+str(e), 'error')

    def getCoinInfo(self, token):
        tokenContract = self.createContract('erc20_abi', token)
        name = tokenContract.functions.name().call()
        symbol = tokenContract.functions.symbol().call()
        balance = str(self.fromEthers(tokenContract.functions.balanceOf(self.walletAdr).call()))
        balance = balance[:balance.index('.') + 3]
        ret = {'name': name, 'symbol': symbol, 'balance': balance}
        self.log(json.dumps(ret), 'coin info')
        return ret

    
    def approve(self, abiId, contractAddress, spender, amount):
        self.logArgs(abiId, contractAddress, spender, amount)
        approvalContract = self.createContract(abiId, contractAddress)
        approveCall = approvalContract.functions.approve(self.address(spender), amount)
        self.createTransaction(approveCall)