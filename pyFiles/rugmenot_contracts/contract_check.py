import json, sys, logManager
from datetime import datetime

# INFO constants
WOI_OBJ = json.load(open("pyFiles\\rugmenot_contracts\info\words_of_interest.json"))
SOLPATH = "pyFiles\\rugmenot_contracts\contracts\mag.sol"
WOI_KEYS = []


# INFO variables
path = SOLPATH.split("\\")
path = path[len(path) - 1].replace(".sol", "_")
_l = logManager.LogManager(path + "_contractCheck", dir="pyFiles\\rugmenot_contracts\logs")
for key in WOI_OBJ:
    WOI_KEYS.append(key)

# INFO function to read contract
def getContract(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.readlines()

# INFO function to get against keys
def checkForWord(line):
    global WOI_OBJ
    for key in WOI_KEYS:
        if key in line:
            return key
    return False

# INFO function to build search and get points
def scoreLine(line, word):
    wordInfo = WOI_OBJ[word]
    if wordInfo["exists"]:
        return wordInfo["score"]
    else:
        wordsToCheck = wordInfo["words"]
        score = 0.1
        for word in wordsToCheck:
            if word in line:
                if wordInfo[word]["score"] >= score:
                    score = wordInfo[word]["score"]
        return score

# INFO output file
def _o(poi, path): 
    name = path + "_contract_check_result.json"
    with open("pyFiles\\rugmenot_contracts\\contracts\\"+name, 'w') as f:
        json.dump(poi, f, indent=4)
        f.close()

# INFO main script
contract_txt = getContract(SOLPATH)
contract_score = 0.0
points_of_interest = { "poi": {}}
for line in contract_txt:
    baseLine = line.replace("\n", "").strip()
    checkLine = line.lower()
    check = checkForWord(checkLine)
    if(check != False):
        _l.log("Word found: "+check, level="POINT")
        score = scoreLine(checkLine, check)
        _l.log("Scored "+str(score), level="SCORE")
        points_of_interest["poi"][baseLine] = score        
totalScore = 0.0
for key in points_of_interest["poi"]:
    totalScore += points_of_interest["poi"][key]
points_of_interest["totalScore"] = float(str(totalScore)[:3])
_l.log("Total Score: "+str(totalScore)[:3], level="DONE")
_o(points_of_interest, path)

