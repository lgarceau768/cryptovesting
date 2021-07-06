import json, asyncio, sys, time
from web3 import Web3
from datetime import datetime
from Naked.toolshed.shell import execute_js, muterun_js

# Market Links
BSCSCAN_SEED_LINK = 'https://bsc-dataseed.binance.org/'
BSCSCAN_TESTNET_LINK = 'https://data-seed-prebsc-1-s1.binance.org:8545/'
INFURA_TESTNET = "https://mainnet.infura.io/v3/9386f65aacd343d5bb29b35188dff702"

# Constants and Objects
web3 = Web3(Web3.HTTPProvider(BSCSCAN_TESTNET_LINK))
WBNB_ADDRESS = web3.toChecksumAddress("0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd")
BNB_ADDRESS = web3.toChecksumAddress("0x0000000000000000000000000000000000000000")
# PANCAKE_ROUTER = '0x10ED43C718714eb63d5aA57B78B54704E256024E'
PANCAKE_ROUTER = web3.toChecksumAddress('0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3')
abiFile = open("sniper_bot\py\pancakeswap_router_abi.json")
PANCAKE_FACTORY_ABI = json.load(abiFile)["abi"]
abiFile.close()
contract = web3.eth.contract(address=PANCAKE_ROUTER, abi=PANCAKE_FACTORY_ABI)
PRIVATE_KEY = "6212aa6e4d2609a815d85f8afa7bc56264ffe337755ee2699caa2ebc2f6792d1"
PRIVATE_KEY_CRYPTO = "6bc903e72066ad849c06c4e28e34294934f216d71eb3c93b9135290c0c02a62d"
my_account = web3.eth.account.privateKeyToAccount('0x' + PRIVATE_KEY)
web3.eth.defaultAccount = my_account

# Buy constants
MIN_AMOUNT_RATIO = 0.25
PERSONAL_WALLET = "0xeB8ceace9be0e8E7fCF356a7dc523256d10dE8fC"

def handle_event(event):
    jsonEvent = json.loads(Web3.toJSON(event))
    if jsonEvent['args']['token0'] == WBNB_ADDRESS and jsonEvent['args']['token1'] in snipingTokens:
        writePair(jsonEvent)
        result = launchBuyBot(jsonEvent['args']['token1'])
        print("Buy Result: "+result)
        print("Wrote Event!")

async def log_loop(event_filter, poll_interval):
    while True:
        try:
            entries = event_filter.get_new_entries()
            if entries == []: print("None")
            else: print("Pair")
            for PairCreated in entries:
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
    address = web3.toChecksumAddress(my_account._address)
    balance = web3.eth.getBalance(address)
    count = web3.eth.getTransactionCount(address);

    print("Balance: " + str(balance))
    
    txn = contract.functions.swapExactTokensForTokens(
        amount, 
        min_amount, 
        token_path, 
        address, 
        (int(time.time()) + 1000)).buildTransaction({
            "from": address,
            "gasPrice":web3.toWei('1', 'gwei'),
            "gas": 70000,
            "nonce": web3.toHex(count)
    })
    signed_tx = web3.eth.account.signTransaction(txn, private_key=PRIVATE_KEY_CRYPTO)
    web3.eth.sendRawTransaction(signed_tx.rawTransaction)


def watchLiquidity():
    event_filter = contract.events.PairCreated.createFilter(fromBlock='latest')
    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(
            asyncio.gather(
                log_loop(event_filter, 1)))
    finally:
        loop.close()

def launchBuyBot(token):
    result = execute_js("sniper_bot\js/bot.js", arguments=token)
    return result

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