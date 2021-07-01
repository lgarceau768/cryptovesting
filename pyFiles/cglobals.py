import sys, traceback


# headers for spoofing fomo 
headers = {
    'Host': 'tokenfomo.io',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'https://duckduckgo.com/',
    'Upgrade-Insecure-Requests': '1',
    'Sec-GPC': '1',
    'Cache-Control': 'max-age=0',
}

proxies = {
     'http': "http://192.168.0.116:3128",
     'https': "https://192.168.0.116:3128",
}

def getException(logger, info):    
    exc_type, exc_value, exc_traceback = info
    logger.log("*** print_tb:", level="SEVERE")
    traceback.print_tb(exc_traceback, limit=1, file=open(logger.fileName, 'a'))
    logger.log("*** print_exception:", level="SEVERE")
    # exc_type below is ignored on 3.5 and later
    traceback.print_exception(exc_type, exc_value, exc_traceback,
                            limit=2, file=open(logger.fileName, 'a'))