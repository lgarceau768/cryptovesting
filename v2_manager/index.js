// load deps
const fs = require('fs')
const path = require('path')
const web3 = require('web3')


// load our files
const BinanceInteractor = require('./lib/BinanceInteractions')

run()

async function run () {
    // need to test most of the functionality

    const bsc = new BinanceInteractor('main')
    let buyVal = await bsc.buyWithSlippage('0x2170ed0880ac9a755fd29b2688956bd959f933f8')
    console.log(buyVal)

    let sellVal = await bsc.sellToken('0x2170ed0880ac9a755fd29b2688956bd959f933f8', 0.1)
    console.log(sellVal)

    let snipeVal = await bsc.snipe('0x2170ed0880ac9a755fd29b2688956bd959f933f8')
    console.log(snipeVal)
}