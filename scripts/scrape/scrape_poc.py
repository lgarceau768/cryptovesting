# Author Luke Garceau
# Date 5/24/21
from bs4 import BeautifulSoup
from scrips.scrape import cglobals
from datetime import datetime
import requests, uuid, traceback, sys

# urls for fomo and sniffer
fomoUrl = "https://tokenfomo.io/"
snifferUrl = "https://tokensniffer.com/"
checkedCoins = 0
logger = None


# setup the logger
def setLogManager(log): 
    global logger
    logger = log

# getFomo()
#  - no parameters 
#  - will pull down the raw html of tokenfomo.io
#  - will return our custom bs4Rep object (object with the request and the soup)
def getFomo():
    # going to run into an issue here with amount of requests
    global fomoUrl, proxies
    #page = requests.get(fomoUrl, headers=cglobals.headers, verify=False, proxies=cglobals.proxies)
    page = requests.get(fomoUrl, headers=cglobals.headers, verify=False, proxies=cglobals.proxies)
    try: 
        soup = BeautifulSoup(page.text, 'html.parser')
        # bs4Rep OBJ / will probably not use the request, mainly just the soup
        return {
            'success': True,
            'page': page,
            'soup': soup,
        }
    except:
        logger.log('Failed to get the token info / token is not on')
        return {
            'success': False,
        }

# getSniffer()
#  - pass in the token contract hash  
#  - will pull down the raw html of tokensniffer.io
#  - will return our custom bs4Rep object (object with the request and the soup)
def getSniffer(token, token_contract_hash):   
    global snifferUrl, checkedCoins, proxies, logger
    snifferUrl = snifferUrl + "token/" + token_contract_hash
    ## need to fix the sniffer url and append the contractHash
    try:
        page = requests.get(snifferUrl, headers=cglobals.headers, verify=False, proxies=cglobals.proxies)
        soup = BeautifulSoup(page.text, 'html.parser')
        # bs4Rep OBJ / will probably not use the request, mainly just the soup
    except:        
        return 
    # return val
    returnVal = {
        'success': False,
        'desc': '404 exception triggered no info',
        'token': token
    }

    try:
        # look for the 404 h1
        fail404 = soup.find('h1')
        returnVal['token']['description'] = "None"
        if(fail404 != None):            
            logger.log('token: '+token["token_name"]+ " not found on sniffer", level="SCRAPE")
            raise Exception
        else:
            checkedCoins += 1
            # now check to see if has scam alert
            scamAlertBox = soup.find('div', attrs={'class': ['Home_alert__1Lebs']})
            
            if(scamAlertBox != None):
                returnVal['token']['description'] = "Detected as Scam"
                logger.log('token: '+token["token_name"]+ " marked as scam", level="SCRAPE")
                raise Exception

            # check for similar contracts that are scams if does not have alert box
            # look for highlighted rows
            highlightRows = soup.find('tr', attrs={"class":["Home_highlight__3RpFa"]})
            simTokens = []

            if(highlightRows != None):
                # check to see the coin scores
                table = soup.findAll('table')[2]
                
                # row rowCount
                rowCount = (len(table.findAll('tr')) - 1)

                # row of sim tokens and look for high percentage ? 
                for row in table.findAll('tr')[1:rowCount]:
                    col = row.findAll('td')
                    # row 0
                    score = int(float(col[0].getText()) * 100)
                    if (score >= 98):
                        returnVal['token']['description'] = "Similar coin detected as Scam"
                        logger.log('similar token to: '+token["token_name"]+ " marked as scam", level="SCRAPE")
                        raise Exception
            else: 
                # now grab the contract hash of top 3 similar tokens
                otherRows = soup.find_all('td', attrs={"class":["Home_hideOnMedium__1mR3M"]})

                # check to see if any rows
                if(len(otherRows) == 0):
                    # no rows found
                    logger.log('No Sim tokens for token: '+token["token_name"], level="SCRAPE") 
                    returnVal = {
                        'success': True,
                        'token': token,
                        'sim_tokens': simTokens
                    }

                rows = 3 > len(otherRows)
                if rows == False: rows = 3 
                else: rows = len(otherRows) - 1

                for i in range(rows):
                    row = otherRows[i]
                    simTokens.append({
                        "token_hash": token["contract_hash"],
                        "contract_hash": row.getText()
                    })

            # now if passed here pull the info down            
            returnVal = {
                'success': True,
                'token': token,
                'sim_tokens': simTokens
            }
    except Exception: 
        pass
    finally:
        return returnVal


# parseFomo()
#  - 1 parameter = soup of getFomo()
#  - will parse the content of getFomo 
#  - return an array containing each coin row
def parseFomo(rawHtml):
    # pull the 1st and only table 
    soup = BeautifulSoup(rawHtml, "html.parser")
    table = soup.find('table')
    
    # need to parse the table
    rowCount = (len(table.findAll('tr')) - 1)

    # loop through the Table
    tokens = []
    for row in table.findAll('tr')[1:rowCount]:
        # need to check if it is on ethIcon or not        
        try:
            bscIcon = row.find('img', attrs={"src": ["bsc-logo.png"]})

            if bscIcon == None:
                raise Exception 

            col = row.findAll('td')
            # table rows setup up with this format
            # row 0 = Token Name
            # row 1 = Token Symbol
            # row 3 = Token contract link INSIDE THE A VAR
            # row 4 = Exchange (only use pancake)
            # row 5 = Age
            token_uuid = uuid.uuid4().hex
            token_name = col[0].getText()
            token_bsc_link = str(col[3].find('a')).split('"')[1]
            token_contract_hash = token_bsc_link.replace("https://bscscan.com/token/", "")
            tokens.append({
                "uuid": token_uuid,
                "token_name": token_name,
                "bsc_link": token_bsc_link,
                "contract_hash": token_contract_hash
            })
            #logger.log('%s %s %s %s' % (token_name, token_bsc_link, token_contract_hash, token_uuid))
        except Exception:
            logger.log('coin: '+str(row.findAll('td')[0].getText())+ ' failed eth check')

    return tokens


        

