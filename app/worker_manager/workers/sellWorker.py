from web3 import Web3
from scripts import logManager as Logger
import sys, json, platform, time

# INFO help function
if sys.argv[1].lower() not in ['-u', '-t', '-a'] or sys.argv[1].lower() == '-h':
    print('''Fail=
        Please enter the following information
        -u url (main / test)
        -t token address
        -a amount
        -s slippage
    ''')
    sys.exit(0)

# INFO unpack the arguments
net = sys.argv[sys.argv.index('-u')+1]
token = sys.argv[sys.argv.index('-t')+1]
amount = sys.argv[sys.argv.index('-a')+1]
slippage = float(sys.argv[sys.argv.index('-s')+1]) 
logger = Logger.LogManager("sellWorker_"+token, dirName="/home/fullsend/cryptovesting/app/worker_manager/workers/logs/")
logger.log("Arguments %s, %s, %s, %s" % (net, token, amount, str(slippage)), "STARTUP")

# INFO set variables based on net
provider_url = ""
wbnb_address = ""
pancakeswap_router_address = ""
pancake_swap_factory_address = ""
my_wallet_adr = ""
my_pk = ""
if net.lower() == 'main':   
    my_wallet_adr = "0x01420A7b545ac6c99F2b91e9f73464AA69C6E248"
    my_pk = "d4f44d00b1995222dde4ce2d39ce177c78030628c0a9536e0f99c904ff74bebb"
    provider_url = "https://bsc-dataseed.binance.org/"
    wbnb_address = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
    pancakeswap_router_address = "0x10ED43C718714eb63d5aA57B78B54704E256024E"
    pancake_swap_factory_address = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73"
elif net.lower() == "test":
    my_wallet_adr = "0xeB8ceace9be0e8E7fCF356a7dc523256d10dE8fC"
    my_pk = '6212aa6e4d2609a815d85f8afa7bc56264ffe337755ee2699caa2ebc2f6792d1'
    provider_url = "https://data-seed-prebsc-1-s1.binance.org:8545/"
    wbnb_address = "0xae13d989dac2f0debff460ac112a837c89baa7cd"
    pancakeswap_router_address = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"
    pancake_swap_factory_address = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3"
else:
    print("Fail=Correct net not specified (needs to be main or test)")
    sys.exit(0)

# INFO load web3
w3 = Web3(Web3.HTTPProvider(provider_url))
account = w3.toChecksumAddress(my_wallet_adr)
account_obj = w3.eth.account.privateKeyToAccount(my_pk)
if platform.system() != "Linux":
    router_abi = json.load(open('/home/fullsend/cryptovesting/app/worker_manager/workers/contract_abis/pancakeswap_factory_abi.json', 'r'))
    factoryAbi = json.load(open('/home/fullsend/cryptovesting/app/worker_manager/workers/contract_abis/pancakeswap_router_abi.json', 'r'))
else:
    router_abi = json.load(open('/home/fullsend/cryptovesting/app/worker_manager/workers/contract_abis/pancakeswap_factory_abi.json', 'r'))
    factoryAbi = json.load(open('/home/fullsend/cryptovesting/app/worker_manager/workers/contract_abis/pancakeswap_router_abi.json', 'r'))
pancake_router_contract = w3.eth.contract(address=pancakeswap_router_address, abi=factoryAbi)
pancake_factory_contract = w3.eth.contract(address=pancake_swap_factory_address, abi=router_abi)

# INFO function to convert address
def _a(adr):
    return w3.toChecksumAddress(adr)

# INFO function to convert things to hex
def _h(amt):
    return w3.toHex(amt)

# INFO function to convert to ether
def _e(amt):
    return w3.toWei(amt, 'ether')

# INFO function to convert to wei
def _w(amt):
    return w3.toWei(amt, 'wei')

# INFO function to approve
def _approve(amount, address, approveAdr):
    tokenContract = w3.eth.contract(Address=address, abi=json.load(open('/home/fullsend/cryptovesting/app/worker_manager/workers/contract_abis/sellabi.json', 'r')))
    approveRawTX = tokenContract.functions.approve(_a(approveAdr), amount).buildTransaction({
        'from': account,
        'gasPrice': w3.toWei('5', 'gwei'),
        'nonce': w3.eth.get_transaction_count(account)
    });
    try :
        signedTx = w3.eth.account.sign_transaction(approveRawTX.rawTransaction, private_key=my_pk);
        txHash = w3.eth.send_raw_transaction(signedTx.rawTransaction);
        logger.log("Sell hash "+txHash)
        return txHash;
    except Exception as E:
        logger.log("Fail=Sell failed because|"+str(E));
        print("Fail=Sell failed because|"+str(E), level="FAIL");
    


# INFO function to make the swap
def _swap_exact_tokens_for_eth(amt_WBNB, amt_token, token, contract):
    swapTransaction = contract.functions.swapExactTokensForETH(
        amt_token, amt_WBNB,
        [token, wbnb_address],
        account, 
        (int(time.time()) + 10000000)
    ).buildTransaction({
        'from': account,
        'gasPrice': w3.toWei('5', 'gwei'),
        'nonve': w3.eth.get_transaction_count(account)
    })
    try :
        swapSigned = w3.eth.account.sign_transaction(swapTransaction, private_key=my_pk)
        txHash = w3.eth.send_raw_transaction(swapSigned.rawTransaction)
        return txHash
    except Exception as e:
        logger.log("Fail=Sell swap failed |"+str(e), level="FAIL")
        print("Fail=Sell swap failed |"+str(e))

# INFO main program
try:
    logger.log("Approving pancake router")
    approveTx = _approve(_e(amount), token, pancakeswap_router_address);
    logger.log("Approval tx: "+approveTx);
    logger.log("Selling the token now");
    tx_token = _swap_exact_tokens_for_eth(0, _e(amount), token, pancake_router_contract);
    returnVal = {
        'txHash': tx_token,
        'soldAmount': _e(amount),
    }
    print("Success="+json.dumps(returnVal))
    logger.log("Success="+json.dumps(returnVal), level="SUCCESS")
except Exception as e:
    logger.log("Exception: "+str(e))
    print("Fail="+str(e))

