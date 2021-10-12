import os, json
from lib import logger

abiPath = os.path.join(os.getcwd(), 'data', 'abi_json_files')

def readJson(abiName):
    global abiPath
    abiDataPath = os.path.join(abiPath, abiName+'.json')
    abiFile = open(abiDataPath, 'r')
    abiData = json.load(abiFile)
    return abiData

allSettings = {
    'us_sniper_address': '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
    'pancake_router_abi': readJson('pancakeswap_router_abi'),
    'pancake_factory_abi': readJson('pancakeswap_factory_abi'),
    'basic_sell_abi': readJson('sellabi'),
    'pancake_sniper_abi': readJson('sniper_pancake_abi'),
    'uniswap_sniper_abi': readJson('sniper_uniswap_abi'),
    'balance_abi': readJson('balance_abi'),
    'erc20_abi': readJson('erc20'),
    'gas_price': '11',
    'gas_amount': 130000,
    'wbnb_buy_amount': 0.01,
    'slippage': 0.8,
    'watcher_interval': 10 * 1000, # seconds to ms
    'sell_target_percent': 2,
    'moon_percent': 5,
    'sell_amount': 0.75,
    'keep_amount': 0.25,
    'sniper_interval': 2 * 1000,
    'tx_delay': 10
}

class Variables(logger.LogObject):
    def __init__(self, net):
        global allSettings
        super().__init__('Variables')
        if net == 'test':
            self.settings = {
                'bsc_url': 'https://data-seed-prebsc-1-s1.binance.org:8545/',
                'network_id': 97,
                'chain_id': 97,
                'account_address': '0x2bA2FeF1502D30a6532A6B2D99A3725544C855BF',
                'account_pk': '6f78884592d6b5ce54be1b74d5fb0f5915ec0ae4bea91bb282c54928bc02d041',
                'wbnb_address': '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
                'ps_router_address': '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
                'ps_factory_address': '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3',
            }
        else:
            self.settings = {
                'bsc_url': 'https://bsc-dataseed.binance.org/',
                'network_id': 56,
                'chain_id': 56,
                'account_address': '0x01420A7b545ac6c99F2b91e9f73464AA69C6E248',
                'account_pk': 'd4f44d00b1995222dde4ce2d39ce177c78030628c0a9536e0f99c904ff74bebb',
                'wbnb_address': '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
                'ps_router_address': '0x10ED43C718714eb63d5aA57B78B54704E256024E',
                'ps_factory_address': '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
            }
        self.settings.update(allSettings)
        self.log('Load of settings done', 'done')

    def getSetting(self, setting):
        if self.settings.get(setting) is None:
            raise NameError('Setting not found')
        else:
            return self.settings.get(setting)
        
    def setSetting(self, setting, value):
        self.settings.update({setting: value})