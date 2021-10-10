from lib import binance_interactions

BI = binance_interactions.BinanceInteractor('main')

reply = BI.buyToken('0x2e121ed64eeeb58788ddb204627ccb7c7c59884c')
print(reply) 
# approve    303498472235619
# swap 0.01: 10000000000000000