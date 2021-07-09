import json, sys, logManager, cglobals, os
from datetime import datetime

# INFO constants
WOI_OBJ = json.load(open("/home/fullsend/cryptovesting/scripts/rugmenot_contracts/info/words_of_interest.json"))
SOLPATH = "/home/fullsend/cryptovesting/scripts/rugmenot_contracts/contracts/sol\ files/"
SOLPATH = SOLPATH + sys.argv[1]
WOI_KEYS = []
comment = False
words = {}


# INFO variables
path = SOLPATH.split("/")
path = path[len(path) - 1].replace(".sol", "_")
_l = logManager.LogManager(path + "_contractCheck")
for key in WOI_OBJ:
    WOI_KEYS.append(key)
    words[key] = 0

# INFO function to read contract
def getContract(path):
    with open(path, 'r') as f:
        return f.readlines()

# INFO function to get against keys
def checkForWord(line):
    global WOI_OBJ    

    # INFO variables
    if line.startswith("bytes32"): return False
    if line.startswith("uint"): return False
    if line.startswith("uint256"): return False

    # INFO extra
    if "IUniswapV2Router02" in line: return False    
    if "//" in line:
        line = line.split("//")[0]

    # INFO WOI
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
        if word == "lock" and "block" in line: return 0.0
        score = 0.0
        for word_additional in wordsToCheck:
            if word_additional in line:
                if wordsToCheck[word_additional] >= score:
                    score = wordsToCheck[word_additional]
        return score

# INFO output file
def _o(poi, path): 
    global words
    basePath = "/home/fullsend/cryptovesting/scripts/rugmenot_contracts/contracts/json"
    name = path + "_contract_check_result.json"
    name2 = path + "_contract_check_words.json"
    path1 = basePath + name
    path2 = basePath + name2
    with open(path1, 'w') as f:
        json.dump(poi, f, indent=4)
        f.close()
    with open(path2, 'w') as f:
        json.dump(words, f, indent=4)
        f.close()
    return name

# INFO main script
contract_txt = getContract(SOLPATH)
contract_score = 0.0
points_of_interest = { "poi": {}}
for line in contract_txt:  
    baseLine = line.replace("\n", "").strip()
    if baseLine.startswith("//"): continue
    if baseLine.startswith("*/"): 
        comment = False
        continue    
    if baseLine.startswith("*"): continue
    if baseLine.startswith("/**"): 
        comment = True
        continue
    if comment: continue
    checkLine = line
    check = checkForWord(checkLine)
    if(check != False):
        _l.log("Word found: "+check, level="POINT")
        score = scoreLine(checkLine, check)
        if score != 0.0:            
            words[check] += 1 
            _l.log("Scored "+str(score), level="SCORE")
            points_of_interest["poi"][baseLine] = score        
totalScore = 0.0000
for key in points_of_interest["poi"]:
    totalScore += points_of_interest["poi"][key]
points_of_interest["totalScore"] = float(str(totalScore)[:3])
_l.log("Total Score: "+str(totalScore)[:3], level="DONE")
name = _o(points_of_interest, path)
print("Name="+name)



