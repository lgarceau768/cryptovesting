# Author Luke Garceau
# Date 5/24/21
import json
from pyFiles import scrape_poc
from pyFiles import selenium_scrape
from pyFiles import sql_connector
from pyFiles import logManager
from pyFiles import cglobals
import time, uuid, sys, traceback

# TODO
# incorporate system arguements into the script for easy sequence swapping
args = sys.argv

# sequence options
# default -s sfrs = -srcape-fomo-rug-sniffer
# -s sc = -sniff-coins
sequence = "sfrs" # default is scrape-fomo-rug-sniffer

if str(args).find('-h') != -1:
    # display help menu
    print('Arguements:\n\t-h: help\n\t-s: specify the sequence you\'d like to run (sfrs, sc)')
    sys.exit(0)
elif str(args).find('-s') != -1:
    # find the arg el that coins -s
    # set sequece
    for i in range(len(args)):
        if args[i] == '-s':
            try:
                sequence = args[i+1].replace("-", "")
            except:
                print('Please input the desired sequence (sfrs, sc)')
                sys.exit(0)


# init the logger and set logger
logger = logManager.LogManager()
scrape_poc.setLogManager(logger)
selenium_scrape.setLogger(logger)

# init the database
database = sql_connector.CryptoSQL(logger)
logger.log("Init Database", level="STARTUP")

# Main Program
if sequence == 'sfrs':

    # scrape with selenium for the full html
    selScraper = selenium_scrape.init()
    logger.log("Running Controlled Chome to get TokenFomo.io full list", level="STARTUP")

    # now expand list and get html
    selenium_scrape.expand_list(selScraper)
    fullSoup = selenium_scrape.get_html(selScraper) 

    if(fullSoup.find("Failed") == 0):
        logger.log("failed to get fomo data", level="SEVERE")
        sys.exit(0)
    
    logger.log("Selinum Scrape Done Closing", level="STARTUP")
    # now we can close the driver
    selenium_scrape.close_driver(selScraper)

    # now use bs4 to parse the fullSoup
    tokens = scrape_poc.parseFomo(fullSoup)
    #tokens = []
    
    logger.log("Parse the Fomo HTML", level="STARTUP")

    # test coin that gets added
    # tokens.append({
    #     "uuid": uuid.uuid4().hex, 
    #     "token_name": "TEST COIN",
    #     "bsc_link": "https://bscscan.com/token/0xd59d17585e3ccf14c65995c6ea1e791947e21183",
    #     "contract_hash": "0xd59d17585e3ccf14c65995c6ea1e791947e21183"
    # })

    # now loop through all the tokens and find ones that are good / bad    
    logger.log("Beginning Coin Loop", level="STARTUP")
    try:
        for i in range(len(tokens)):
            if i > 15:
                raise Exception("Debug only 15 coins")
            contract_check = scrape_poc.getSniffer(tokens[i], tokens[i]["contract_hash"])
            
            # check the result of the contract check
            try:
                result = database.addTokens([tokens[i]])
                if(contract_check['success']):
                    result = database.addTokensPostSniff([tokens[i]])
                    
                    # add similar tokens
                    resultSim = database.addSimilarTokens(contract_check['sim_tokens'])

                else:
                    # add result to simtokens
                    result = database.addTokensPreSniff([tokens[i]])
            except:
                pass
    except Exception:
        exc_type, exc_value, exc_traceback = sys.exc_info()
        logger.log("*** print_tb:", level="SEVERE")
        traceback.print_tb(exc_traceback, limit=1, file=open(logger.fileName, 'a'))
        logger.log("*** print_exception:", level="SEVERE")
        # exc_type below is ignored on 3.5 and later
        traceback.print_exception(exc_type, exc_value, exc_traceback,
                                limit=2, file=open(logger.fileName, 'a'))
    finally:
        logger.log(database.tokens_added_dict, level="COMPLETED")
elif sequence == 'sc':
    # pull down tokens from Database
    logger.log("Pulling down tokens from database", level="DATABASE")

    # get tokens to be sniffed
    tokens, count = database.getAllQuery("tokens_pre_sniff")

    # init result remove list
    tokenOperations = []

    logger.log("Checking existing "+str(count)+" tokens in the database")
    try:
        for token in tokens:
            sniffer_check = scrape_poc.getSniffer(token, token["contract_hash"])

            # check result
            op = "keep"
            if(sniffer_check['success']):
                op = "delete"

            tokenOperations.append({
                "token": token,
                "operation": op
            })
        
        logger.log("Removing Coins from the database now")
        result = database.deleteSimCoins(tokenOperations)
        logger.log("SQL Result: "+str(result), level="COMPLETE")
    except Exception:
        info = sys.exc_info()
        cglobals.getExeception(logger, info)
    finally:
        logger.log(database.tokens_added_dict, level="COMPLETE")
elif sequence == 'lp':
    logger.log("Checking liquidity pools of coins")

    # pull down the tokens
    tokens, count = database.getAllQuery("tokens")

    # init the selenium driver    
    selScraper = selenium_scrape.init()
    logger.log("Running Controlled Chome to run the LP checks", level="STARTUP")

    # adding the test token
    # tokens = []
    # tokens.append({
    #     "uuid": uuid.uuid4().hex, 
    #     "token_name": "TEST COIN",
    #     "bsc_link": "https://bscscan.com/token/0x4a824ee819955a7d769e03fe36f9e0c3bd3aa60b",
    #     "contract_hash": "0x4a824ee819955a7d769e03fe36f9e0c3bd3aa60b"
    # })

    try:
        tokensForDb = []
        for token in tokens:
            lp_check = selenium_scrape.lpCheck(selScraper, token)

            logger.log("Retrieved LPs from bscscan for: "+token['token_name'], level="LP")

            # based on top holder % and if contains contract send to respective database
            maxHolders = 5
            locked = False
            status = 'Stable'
            
            try:
                for i in range(1, maxHolders):
                    key = 'holder'+str(i)
                    holder = lp_check[key]
                    token[key] = json.dumps(holder)
                    
                    # check if token is burned
                    try:
                        burnVal = holder['burned']
                        if burnVal:
                            status = 'Burned'
                            logger.log("Token: "+token["token_name"]+"'s top address begins with 0x00... the lp is burned", level="LP")
                    except:
                        pass
                    # check if top owner is contract
                    if holder['con'] == "True" and i == 1:
                        conPC = float(holder['hPc'])
                        nextPC = float(lp_check['holder'+str(i+1)]['hPc'])
                        if abs(conPC - nextPC) > 10:
                            # top holder contract by too far and this coins lp is considered locked
                            locked = True
                            status = 'Locked'
                            logger.log("Token: "+token['token_name']+"'s top holder is: "+holder['hAdr']+" is a contract address w / a difference of "+str(conPC- nextPC), level="LP")
                
                token['status'] = status
                token['top_holder'] = json.dumps(lp_check['holder1'])
                tokensForDb.append(token)
            except:
                logger.log("Token "+token['token_name']+" not found on bscscan")
                token['status'] = 'Unchecked'
                tokensForDb.append(token)
        
        selenium_scrape.close_driver(selScraper)
        database.addTokensLPLocked(tokensForDb)
        database.addTokensLPStatus(tokensForDb)
        database.addTokensLpTopHolders(tokensForDb)
    except Exception:
        info = sys.exc_info()
        cglobals.getExeception(logger, info)
    finally:
        logger.log(database.tokens_added_dict, level="COMPLETE")