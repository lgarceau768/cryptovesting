from web3 import Web3
from scripts import logManager as Logger
import requests
import sys, json, time, platform

# INFO help function
if sys.argv[1].lower() not in ['-t', '-i', '-p', '-u', '-a'] or sys.argv[1].lower() == '-h':
    print('''Fail=
        Please enter the following information
        -u url (main / test)
        -t token address
        -i initialAmountBNB
        -a tokenAmount
        -p percent increase needed to sell
    ''')
    sys.exit(0)


# INFO unpack args
net = sys.argv[sys.argv.index('-u')+1]
token = sys.argv[sys.argv.index('-t')+1]
initialAmountBNB = int(float(sys.argv[sys.argv.index('-i')+1]))
initialAmountToken = int(float(sys.argv[sys.argv.index('-a')+1]))
percent = float(sys.argv[sys.argv.index('-p')+1])
logger = Logger.LogManager("tokenWatcher_"+token, dirName="/home/fullsend/cryptovesting/app/worker_manager/workers/logs/")
logger.log("Arguments %s, %s, %s, %s, %s" % (token, initialAmountBNB, percent, net, initialAmountToken), level="STARTUP")

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
else:
    router_abi = json.load(open('/home/fullsend/cryptovesting/app/worker_manager/workers/contract_abis/pancakeswap_factory_abi.json', 'r'))
pancake_router_contract = w3.eth.contract(address=pancakeswap_router_address, abi=router_abi)
pancake_factory_contract = w3.eth.contract(address=pancake_swap_factory_address, abi=router_abi)
MOON_PERCENT = 100
MOON_ALERT = 25

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
def _get_amounts_out(amt, token, contract):    
    amounts = contract.functions.getAmountsOut(amt, [_a(token), _a(wbnb_address)]).call()
    amount_bnb = amounts[1]
    amount_tokens = amounts[0]
    return {
        'bnb': amount_bnb,
        'tok': amount_tokens
    }

# INFO main function
currentBNB = initialAmountBNB
targetBNB = initialAmountBNB * percent
previousBNB = initialAmountBNB
logger.log("Initial BNB: %s | Target BNB: %s" % (str(currentBNB), str(targetBNB)), level="INFO")
while currentBNB <= targetBNB:
    try:
        ratioObj = _get_amounts_out(initialAmountToken, token, pancake_factory_contract)
        previousBNB = currentBNB
        currentBNB = ratioObj['bnb']
        logger.log("Current Ratio: %s pass?: %s" % (str(currentBNB), str(currentBNB >= targetBNB)), level="INFO")
        if currentBNB >= targetBNB:
            if((((currentBNB-previousBNB) / previousBNB) * 100) > MOON_ALERT){
                # send event
                r = requests.post('http://25.89.250.119:4041/upload_event', 
                data=json.dumps({'message': 'Token '+token+' to BNB increased by 25 current BNB '+currentBNB+' previous '+previousBNB,
                        'category': 'IMPT'
                }), headers={'Content-Type': 'application/json'});
            }
            if(targetBNB == (initialAmountBNB * MOON_PERCENT)):
                logger.log('Moon occured on token returning again', level="MOON")
                logger.log(str(currentBNB), level="MOON")   
                print('Success=sell_at_moon_'+token)
                sys.exit(0)
            else:
                logger.log("Target ratio: %s, hit with current ratio: %s" % (str(targetBNB), str(currentBNB)), level="SUCCESS")
                print("Success=sell_at_gain_"+token)
                # spawn the moon watch loop
                targetBNB = initialAmountBNB * MOON_PERCENT
        elif currentBNB <= (initialAmountBNB * 0.5):
            logger.log("Stop loss hit %s amount out: %s" % (str(targetBNB), str(currentBNB)), level="SUCCESS")
            print("Success=sell_at_loss_"+token)
            sys.exit(0)

    except Exception as e:
        logger.log("Exception in loop: "+str(e), level="CRITICAL")
    time.sleep(5)
    

