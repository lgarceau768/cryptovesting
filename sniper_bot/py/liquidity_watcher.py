import json, asyncio, sys, time
from web3 import Web3
from datetime import datetime

# Constants and Objects
BSCSCAN_SEED_LINK = 'https://bsc-dataseed.binance.org/'
BSCSCAN_TESTNET_LINK = 'https://data-seed-prebsc-1-s1.binance.org:8545'
web3 = Web3(Web3.HTTPProvider(BSCSCAN_TESTNET_LINK))
WBNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
BNB_ADDRESS = "0x0000000000000000000000000000000000000000"
PANCAKE_ROUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E'
PANCAKE_FACTORY = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73'
abiFile = open("sniper_bot\py\pancakeswap_router_abi.json")
PANCAKE_FACTORY_ABI = json.load(abiFile)["abi"]
abiFile.close()
contract = web3.eth.contract(address=PANCAKE_FACTORY, abi=PANCAKE_FACTORY_ABI)
PRIVATE_KEY = "6212aa6e4d2609a815d85f8afa7bc56264ffe337755ee2699caa2ebc2f6792d1"
my_account = web3.eth.account.privateKeyToAccount('0x' + PRIVATE_KEY)

# Buy constants
MIN_AMOUNT_RATIO = 0.25
PERSONAL_WALLET = "0xeB8ceace9be0e8E7fCF356a7dc523256d10dE8fC"

def handle_event(event):
    jsonEvent = json.loads(Web3.toJSON(event))
    if jsonEvent['args']['token1'] == WBNB_ADDRESS and jsonEvent['args']['token0'] in snipingTokens:
        writePair(jsonEvent)
        print("Wrote Event!")

async def log_loop(event_filter, poll_interval):
    while True:
        try:
            for PairCreated in event_filter.get_new_entries():
                handle_event(PairCreated)
        except Exception as e:
            print(str(e));
        await asyncio.sleep(poll_interval)

def writePair(event):
    event["timeComputerSaw"] = datetime.now().strftime("%c")
    outFile = open("sniper_bot\py\pairs.json", "a")
    json.dump(event, outFile, indent=6)
    outFile.close()

def sendBNB(buyToken, amount):
    # build the transaction
    token_path = [WBNB_ADDRESS, buyToken]
    min_amount = 0x0005;

    txn = contract.functions.swapExactTokensForTokens(
        amount, min_amount, token_path, PERSONAL_WALLET, (int(time.time()) + 1000) ) 
    txn.buildTransaction({
        'chainId': 56, 
        'gas': 100000,
        'gasPrice': web3.toWei('10', 'gwei'),
        'nonce': web3.eth.getTransactionCount(my_account._address)
    })
    print(txn)


def watchLiquidity():
    event_filter = contract.events.PairCreated.createFilter(fromBlock='latest')
    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(
            asyncio.gather(
                log_loop(event_filter, 1)))
    finally:
        loop.close()

# read the tokens for sniping
snipingTokens = [];
if(sys.argv[1] == "-t"):
    snipingTokens = sys.argv
    snipingTokens.remove(sys.argv[0])
    snipingTokens.remove(sys.argv[0])
    watchLiquidity();
elif sys.argv[1] == "-b":
    buyTokenAddress = sys.argv[2]
    sendBNB(buyTokenAddress, 0x002)
else:
    print("Please use the -t tag to specify a list of tokens for sniping OR")
    print("Please use the -b 'tokenBuyAddress' to run a buy order on a token from bnb")