# Author Luke Garceau
# Date 5/24/21
from bs4 import BeautifulSoup
import logManager
import json

# INFO variables
count = 0
addresses = [] # addresses
response = [] # raw json response
text_of_interest = {} # dictionairy with point values
# example
# "function_setTransactionlockTime": {
#   values: [],
#   average: 0.00,
#   address: "0x000000000000000000000000"
# }
lastCoinIndex = 0

# INFO setup logger
_l = logManager.LogManager("", dir="pyFiles\\rugmenot_contracts\\logs")

# INFO json pretty print function
def _jStr(jObj):
    print(json.dumps(jObj), indent=4)

# INFO output json to file
def _o():
    global text_of_interest, addresses, count
    print("Added "+str(count)+" points of interest")
    with open("pyFiles\\rugmenot_contracts\\output\\addresses_checked.json", "w") as f:
        json.dump(addresses, f, indent=4)
        f.close()
    with open("pyFiles\\rugmenot_contracts\\output\\texts_of_interest.json", "w") as f:
        json.dump(text_of_interest, f, indent=4)
        f.close()
    _l.log("Parsed "+str(count)+" points of interest", level="COMPLETE")
    print("Done")

# INFO add averages on
def _a():
    global text_of_interest
    for poi in text_of_interest:
        scores = text_of_interest[poi]["values"]
        total = 0.0
        for s in scores: total+= float(s)
        text_of_interest[poi] = {
            "values": scores,
            "address": text_of_interest[poi]["address"],
            "average": total / len(scores)
        }

# INFO method to parse raw innerHTML of chat message
def parseMessage(rawMessage):
    global addresses, lastCoinIndex, text_of_interest, count
    # chat message has ID = chatlog__message-group
    # find where timestamp ends 
    timeID = ["PM", "AM"]
    innerTextSplit = ""
    if(timeID[0] in rawMessage): innerTextSplit = rawMessage.split(timeID[0])
    elif(timeID[1] in rawMessage): innerTextSplit = rawMessage.split(timeID[1])
    else: 
        _l.log("Issue parsing html\n"+rawMessage, level="ISSUE")
        return
    
    innerText = innerTextSplit[1]
    if "!rmn" in innerText:
        # address
        coinContractAddress = innerText.split("!rmn")[1]
        coinContractAddress = coinContractAddress.replace("\n", "").replace(" ", "").replace("(edited)", "")
        if len(coinContractAddress) != len("0x3B8674F9CD879E0f557B3df9700D9B639a2eeA17"):
            if "https://" in coinContractAddress:
                coinContractAddress = coinContractAddress[len("https://bscscan.com/address/"):len("0x3B8674F9CD879E0f557B3df9700D9B639a2eeA17")]
            else:
                return
        lastCoinIndex = len(addresses) - 1
        addresses.append(coinContractAddress)
    elif "RugMeNot scan results for" in innerText:
        # coin response
        address = addresses[lastCoinIndex]
        rugMeNotResponse = innerText.split("RugMeNot scan results for")[1]
        rugMeNotResponse = rugMeNotResponse.replace("\n", "")
        if "Points of interest" not in rugMeNotResponse:
            return
        poiEndIndex = rugMeNotResponse.index("Points of interest") + 18
        pointsOfInterest = rugMeNotResponse[poiEndIndex:]
        pointsOfInterest = pointsOfInterest.split("points")

        for poi in pointsOfInterest:
            if "Points:" in poi:
                return
            count += 1
            poiTextSplit = poi.split(" - ")
            score = poiTextSplit[1].replace(" ", "")
            poi = poiTextSplit[0].replace(" ", "_")

            # insert into text of interest but check scores
            if poi in text_of_interest:
                text_of_interest[poi]["values"].append(score)
                _l.log("Added new value for "+poi+" with a point of "+address+" success", level="SUCCESS")
            else:
                text_of_interest[poi] = {
                    "values": [score],
                    "address": address,
                    "average": score
                }
                _l.log("Added a new response for "+address+" with a poi of "+poi, level="SUCCESS")


# INFO main program
with open("pyFiles\\rugmenot_contracts\\raw_html.html", 'r', encoding="utf-8") as file:
    webpage = file.read()
    file.close()

soup = BeautifulSoup(webpage)

for node in soup.find_all('div', attrs={'class': ['chatlog__message-group']}):
    rawInnerText = node.text
    parseMessage(rawInnerText)
_a()
_o()
