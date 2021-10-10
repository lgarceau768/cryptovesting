const fs = require('fs');
const path = require('path')
const LogObject = require('./LoggingObject.js')

const allSettings = {
    us_sniper_address: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
    pancake_router_abi: JSON.parse(fs.readFileSync(path.join(__dirname, 'abi_json_files', 'pancakeswap_router_abi.json'), 'utf-8')),
    pancake_factory_abi: JSON.parse(fs.readFileSync(path.join(__dirname, 'abi_json_files', 'pancakeswap_factory_abi.json'), 'utf-8')),
    basic_sell_abi: JSON.parse(fs.readFileSync(path.join(__dirname, 'abi_json_files', 'sellabi.json'), 'utf-8')),
    pancake_sniper_abi: JSON.parse(fs.readFileSync(path.join(__dirname, 'abi_json_files', 'sniper_pancake_abi.json'), 'utf-8')),
    uniswap_sniper_abi: JSON.parse(fs.readFileSync(path.join(__dirname, 'abi_json_files', 'sniper_uniswap_abi.json'), 'utf-8')),
    balance_abi: JSON.parse(fs.readFileSync(path.join(__dirname, 'abi_json_files', 'balance_abi.json'), 'utf-8')),
    gas_price: '12',
    gas_amount: 1300000,
    wbnb_buy_amt: 0.01,
    slippage: 0.8,
    watcher_interval: 10 * 1000, // seconds to ms
    sell_target_percent: 2,
    moon_percent: 5,
    sell_amount: 0.75,
    keep_amount: 0.25,
    sniper_interval: 2 * 1000
 }

class Variables extends LogObject{
    constructor(net) {
        super('Variables')
        if(net === 'test') {
            this.settings = {
                bsc_url: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
                network_id: 97,
                chain_id: 97,
                account_address: '0xeB8ceace9be0e8E7fCF356a7dc523256d10dE8fC',
                account_pk: '6212aa6e4d2609a815d85f8afa7bc56264ffe337755ee2699caa2ebc2f6792d1',
                wbnb_address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
                ps_router_address: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
                ps_factory_address: '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3',
            }
        } else {
            this.settings = {
                bsc_url: 'https://bsc-dataseed.binance.org/',
                network_id: 56,
                chain_id: 56,
                account_address: '0x01420A7b545ac6c99F2b91e9f73464AA69C6E248',
                account_pk: 'd4f44d00b1995222dde4ce2d39ce177c78030628c0a9536e0f99c904ff74bebb',
                wbnb_address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
                ps_router_address: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
                ps_factory_address: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
            }
        }
        this.settings = {
            ...this.settings,
            ...allSettings
        }
        this.log('Loading of the ABIs is complete', "done");
        return this;
    }

    getSetting(setting) {
        if(this.settings !== undefined) {
            if(this.settings.hasOwnProperty(setting)) {
                return this.settings[setting];
            } else {
                throw new Error('Unknown Setting '+setting)
            }
        }
    }

    setSetting(setting, value) {
        this.settings[setting] = value;
    }
}

module.exports = Variables