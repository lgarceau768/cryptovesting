from lib import binance_interactions

BI = binance_interactions.BinanceInteractor('main')
print(BI.getCoinInfo('0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe'))
BI.approve('basic_sell_abi', '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', '0x10ED43C718714eb63d5aA57B78B54704E256024E', 100)