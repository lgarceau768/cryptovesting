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
    ''')
    sys.exit(0)

# INFO unpack the arguments
net = sys.argv[sys.argv.index('-u')+1]
token = sys.argv[sys.argv.index('-t')+1]
amount = sys.argv[sys.argv.index('-a')+1]
slippage = float(sys.argv[sys.argv.index('-s')+1]) 
logger = Logger.LogManager("buyWorker_"+token, dirName="/home/fullsend/cryptovesting/app/worker_manager/workers/logs/")
logger.log("Arguments %s, %s, %s, %s" % (net, token, amount, str(slippage)), "STARTUP")

# INFO set variables based on net
provider_url = ""
wbnb_address = ""
pancakeswap_router_address = ""
my_wallet_adr = "0xeB8ceace9be0e8E7fCF356a7dc523256d10dE8fC"
my_pk = "6212aa6e4d2609a815d85f8afa7bc56264ffe337755ee2699caa2ebc2f6792d1"
if net.lower() == 'main':
    provider_url = "https://bsc-dataseed.binance.org/"
    wbnb_address = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
    pancakeswap_router_address = "0x10ED43C718714eb63d5aA57B78B54704E256024E"
    pancake_swap_factory_address = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73"
elif net.lower() == "test":
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
else:
    router_abi = json.load(open('/home/fullsend/cryptovesting/app/worker_manager/workers/contract_abis/pancakeswap_factory_abi.json', 'r'))
pancake_router_contract = w3.eth.contract(address=pancakeswap_router_address, abi=router_abi)
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

# INFO function to convert call getAmountsOut
# 179746734697020058
def _get_amounts_out(amt, token, contract):    
    amount_bnb, amount_tokens =  contract.functions.getAmountsOut(amt, [_a(wbnb_address), _a(token)]).call()
    return amount_bnb, int(amount_tokens * 0.8)

# INFO function to make the swap
def _swap_exact_tokens_for_tokens(amt_WBNB, amt_token, token, contract):
    gas_price = w3.toWei('10', 'gwei')
    swap_call = contract.functions.swapExactETHForTokens(
        amt_token,
        [ _a(wbnb_address), _a(token)],
        account,
        (int(time.time()) + 10000000)
    )
    gas = 1300000
    nonce = w3.eth.getTransactionCount(account)
    swap_tx = swap_call.buildTransaction({
        'from': account,
        'value': amt_WBNB,
        'gas': gas,
        'gasPrice': gas_price,
        'nonce': nonce
    })
    logger.log("Buying token: "+token, level="BUY")
    logger.log("Amount Swapped BNB: "+str(amt_WBNB)+" TokenAmount: "+str(amt_token), level="BUY")
    signed_tx = account_obj.sign_transaction(swap_tx)
    try:
        tx_token = w3.eth.sendRawTransaction(signed_tx.rawTransaction)
        return tx_token
    except Exception as e:
        logger.log("Exception at sendRawTransaction: "+str(e), level="BUY ISSUE")
        print("Fail=Buy Issue Send Raw Transaction|"+str(e))
        sys.exit(0)
        

# INFO main program
try:
    amount_bnb, amount_tokens = _get_amounts_out(_e(amount), token, pancake_factory_contract)
    # INFO SLIPPAGE HERE
    tx_token = _h(_swap_exact_tokens_for_tokens(_e(amount), amount_tokens, token, pancake_factory_contract))
    returnVal = {
        'txHash': tx_token,
        'initalAmount': amount_tokens
    }
    print("Success="+json.dumps(returnVal))
    logger.log("Success="+json.dumps(returnVal), level="SUCCESS")
except Exception as e:
    logger.log("Exception: "+str(e))
    print("Fail="+str(e))

