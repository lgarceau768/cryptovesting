from lib import binance_interactions

BI = binance_interactions.BinanceInteractor('test')
BI.start_buy('0x1420a48727ea14ae8c5780d8fc2702a2ac53f4d1')

reply = BI.sellToken('0x2e121ed64eeeb58788ddb204627ccb7c7c59884c', 4200)
print(reply) 

# approve    303498472235619
# swap 0.01: 10000000000000000
