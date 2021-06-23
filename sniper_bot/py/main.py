import json
from web3 import Web3
import asyncio
from datetime import datetime

bscscan = 'https://bsc-dataseed.binance.org/'
web3 = Web3(Web3.HTTPProvider(bscscan))

wbnbAddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
pancake_router = '0x10ED43C718714eb63d5aA57B78B54704E256024E'
pancake_factory = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73'
abiFile = open("sniper_bot\py\pancakeswap_router_abi.json")
pancake_factory_abi = json.load(abiFile)["abi"]
abiFile.close()

contract = web3.eth.contract(address='0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73', abi=pancake_factory_abi)

def handle_event(event):
    jsonEvent = json.loads(Web3.toJSON(event))
    if jsonEvent['args']['token0'] == wbnbAddress or jsonEvent['args']['token1'] == wbnbAddress:
        writePair(jsonEvent)

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

def main():
    event_filter = contract.events.PairCreated.createFilter(fromBlock='latest')
    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(
            asyncio.gather(
                log_loop(event_filter, 1)))
    finally:
        loop.close()

if __name__ == "__main__":
    main()