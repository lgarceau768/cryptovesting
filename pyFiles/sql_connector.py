import mysql.connector
import traceback, sys, base64, uuid
from pyFiles import cglobals

class CryptoSQL:

    def __init__(self, logger):
        self.db = mysql.connector.connect(
            host="localhost", 
            user="root",
            password="Spook524*",
            database="cryptovesting",
            auth_plugin='mysql_native_password'
        )
        self.logger = logger
        self.tokens_added_dict = {}

    def updateList(self, function, count):
        try:
            self.tokens_added_dict[function]+= count
        except:
            self.tokens_added_dict[function] = count

    def getQuery(self, query):
        try:
            cursor = self.db.cursor()
            cursor.execute(query)
            records = cursor.fetchall()
            cursor.close()
            return records
        except: 
            info = sys.exc_info()
            cglobals.getException(self.logger, info)

    def getAllQuery(self, table):
        try:
            cursor = self.db.cursor()
            cursor.execute("select * from "+table)
            records = cursor.fetchall()
            cursor.close()
            tokens = []
            count = 0
            if table == 'tokens':
                for row in records:
                    count += 1
                    tokens.append({
                        "uuid": row[0],
                        "token_name": row[1],
                        "contract_hash": row[3],
                        "bscscan_link": row[2]
                    })
            elif table == 'tokens_pre_sniff' or table == 'tokens_post_sniff':
                for row in records:
                    count += 1
                    tokens.append({
                        "uuid": row[0]
                    })
                return self.pullTokensWithIds(tokens)
            return (tokens, count)
        except: 
            info = sys.exc_info()
            cglobals.getException(self.logger, info)

    def pullTokensWithIds(self, ids):
        try:
            cursor = self.db.cursor()
            command = "select * from tokens where uuid in ("
            for idVal in ids:
                command += '"'+idVal['uuid']+'",'
            command += ")"
            command = command[0:len(command)-2] + ")"
            cursor.execute(command)
            records = cursor.fetchall()
            cursor.close()
            tokens = []
            count = 0
            for row in records:
                count += 1
                tokens.append({
                    "uuid": row[0],
                    "token_name": row[1],
                    "contract_hash": row[3],
                    "bscscan_link": row[2]
                })
            return (tokens, count)
        except:
            info = sys.exc_info()
            cglobals.getException(self.logger, info)

    def addTokens(self, tokens):
        count = 0  
        for token in tokens:
            count += 1      
            try:
                cursor = self.db.cursor()

                insQuery = ("insert into tokens (uuid, token_name, bscscan_link, contract_hash) values (%s, %s, %s, %s)")
                insObject = (token['uuid'], token['token_name'], token['bsc_link'], token['contract_hash'])
                
                cursor.execute(insQuery, insObject)
                self.db.commit()
                cursor.close()
            except: 
                info = sys.exc_info()
                cglobals.getException(self.logger, info)
        self.updateList("addTokens", count)
        return True, count, "addTokens"

    def addTokensPreSniff(self, tokens): 
        count = 0 
        for token in tokens: 
            count += 1     
            try:
                cursor = self.db.cursor()

                insQuery = "insert into tokens_pre_sniff (token_uuid) values (\""+token["uuid"]+"\")"              
                cursor.execute(insQuery)
                self.db.commit()
                cursor.close()
            except: 
                info = sys.exc_info()
                cglobals.getException(self.logger, info)
        self.updateList("addTokensPreSniff", count)
        return True, count, "addTokensPreSniff"

    def addTokensPostSniff(self, tokens): 
        count = 0 
        for token in tokens:
            count += 1      
            try:
                cursor = self.db.cursor()

                insQuery = "insert into tokens_post_sniff (token_uuid) values (\""+token["uuid"]+"\")" 
                cursor.execute(insQuery)
                self.db.commit()
                cursor.close()
            except: 
                info = sys.exc_info()
                cglobals.getException(self.logger, info)
        self.updateList("addTokensPostSniff", count)
        return True, count, "addTokensPostSniff"


    def addTokensFailSniff(self, tokens):  
        count = 0
        for token in tokens:
            count += 1      
            try:
                cursor = self.db.cursor()

                insQuery = "insert into tokens_pre_sniff (token_uuid) values (\""+token["uuid"]+"\")"                
                cursor.execute(insQuery)
                self.db.commit()
                cursor.close()
            except Exception as ex: 
                info = sys.exc_info()
        self.updateList("addTokensFailSniff", count)
        return True, count, "addTokensFailSniff"

    def addTokensLPStatus(self, tokens):  
        count = 0
        for token in tokens:
            count += 1      
            try:
                cursor = self.db.cursor()

                insQuery = "insert into tokens_lp_status (token_uuid, lp_status) values (%s, %s)"                
                cursor.execute(insQuery, (token['uuid'], token['status']))
                self.db.commit()
                cursor.close()
            except Exception as ex: 
                info = sys.exc_info()
                cglobals.getException(self.logger, info)
        self.updateList("addTokensFailSniff", count)
        return True, count, "addTokensLPStatus"

    def addTokensLPLocked(self, tokens):  
        count = 0
        for token in tokens:
            count += 1      
            try:
                cursor = self.db.cursor()

                insQuery = "insert into tokens_lp_locked (token_uuid, top_holder) values (%s, %s)"                
                cursor.execute(insQuery, (token['uuid'], token['top_holder']))
                self.db.commit()
                cursor.close()
            except Exception as ex: 
                info = sys.exc_info()
                cglobals.getException(self.logger, info)
        self.updateList("addTokensLPLocked", count)
        return True, count, "addTokensLPLocked"

    def addTokensLpTopHolders(self, tokens): 
        # holders will be json formatted blobs
        count = 0 
        for token in tokens:
            count += 1      
            try:
                cursor = self.db.cursor()

                insQuery = "insert into token_top_lp_holders (token_uuid, holder1, holder2, holder3, holder4) values (%s, %s, %s, %s, %s)"                
                cursor.execute(insQuery, (token['uuid'], token['holder1'], token['holder2'], token['holder3'], token['holder4']))
                self.db.commit()
                cursor.close()
            except Exception as ex: 
                info = sys.exc_info()
                cglobals.getException(self.logger, info)
        self.updateList("addTokensLpTopHolders", count)
        return True, count, "addTokensLpTopHolders"

    def addSimilarTokens(self, tokens):
        count = 0
        for token in tokens:
            count += 1      
            try:
                cursor = self.db.cursor()
                tokUuid = uuid.uuid4().hex
                hashVal = str(base64.b64encode(('%s=%s' % (token["token_hash"], token["contract_hash"])).encode()), "utf-8")
                insQuery = "insert into similar_tokens (uuid, sim_contract, token_contract, hash) values (%s)"               
                cursor.execute(insQuery, (tokUuid, token['contract_hash'], token['token_hash'], hashVal) )
                self.db.commit()
                cursor.close()
            except Exception as ex: 
                info = sys.exc_info()
                cglobals.getException(self.logger, info)
        self.updateList("addSimilarToken", count)
        return True, count, "addSimilarToken"

    def deleteSimCoins(self, tokens):
        # loop through the list
        longStatement = ""
        sqlCommand = 'delete from similiar_tokens where uuid="%s";'

        for token in tokens:
            if(token["operation"] == "delete"):
                longStatement += sqlCommand % (token["token"]["uuid"])
                self.logger.log("Sniff found on token:  "+token["token"]["contract_hash"], level="DATABASE")
            elif(token["operation"] == "keep"):
                self.logger.log("No sniff found on token: "+token["token"]["contract_hash"], level="DATABASE")
        try:
            cursor = self.db.cursor()
            cursor.execute(longStatement)
            self.db.commit()
            cursor.close()
            return True
        except Exception as ex: 
            info = sys.exc_info()
            cglobals.getException(self.logger, info)
        return False