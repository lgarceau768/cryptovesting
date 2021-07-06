import requests, sys, json
token = sys.argv[1]
# INFO constants
API_KEY = "375R5H9IX25IFJKI26JXMSP9RH6V1CTKDN"
URL = "https://api.bscscan.com/api?module=contract&action=getsourcecode&address=%s&apikey=%s"

# INFO main script
response = requests.get(URL % (token, API_KEY))
responseJson = json.loads(response.text)

# INFO if pulled the contract
if responseJson["message"] == "OK":
    solCode = responseJson["result"][0]["SourceCode"]
    with open("scripts\\rugmenot_contracts\\contracts\\sol files\\"+token+".sol", "w") as f:
        f.write(solCode)
        f.close()
else:
    print(responseJson)
