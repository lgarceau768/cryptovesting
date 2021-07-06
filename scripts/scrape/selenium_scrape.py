from selenium import webdriver
import selenium
from selenium.webdriver.common.proxy import Proxy, ProxyType
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
from scrips.scrape import selenium_scrape
from scrips.scrape import cglobals
import sys
import requests



# urls for fomo and sniffer
fomoUrl = "https://tokenfomo.io/"
snifferUrl = "https://tokensniffer.com/"
path = '/home/fullsend/cryptovesting/scripts/scrape/chromedriver_ubuntu/chromedriver'

prox = Proxy()
prox.proxy_type = ProxyType.MANUAL
prox.http_proxy = "192.168.0.116:3128"
capabilities = webdriver.DesiredCapabilities.CHROME
prox.add_to_capabilities(capabilities)
logger = None

# init() function
# inits the driver and opens the fomo url
# parameters 
# - none
# return driver
def init():
    global path, capabilities
    
    options = Options()
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("start-maximized")
    options.add_argument("--no-sandbox")
    options.add_argument("--headless")
    options.add_argument("user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36")
   # options.binary_location = "/usr/bin/google-chrome-stable"
    # change the path to your driver here
    # init the headless browser (CHANGE PATH HERE)
    driver = webdriver.Chrome("/home/fullsend/cryptovesting/scripts/chromedriver_ubuntu/chromedriver",
        chrome_options=options,
        desired_capabilities=capabilities
    )
    
    return driver

def setLogger(log):
    global logger
    logger = log

# expand_list()
# function to expand the list of altcoins on tokenfomo 
def expand_list(driver):    
    # click the expand button
    driver.get(fomoUrl)
    driver.implicitly_wait(10)
    expand_button = driver.find_element_by_xpath("//*[contains(text(),'Show all')]")
    expand_button.click()

# now pull all the inner html into a soup
def get_html(driver):
    try:
        html = driver.execute_script("return document.getElementsByTagName('html')[0].innerHTML")
        return html
    except:
        return 'Failed to pull html'

def close_driver(driver):
    driver.close()

def lpCheck(driver, token):
    global logger
    url = "https://bscscan.com/token/%s#balances" % (token['contract_hash'])

    # get the url
    driver.get(url)
    driver.implicitly_wait(3)
    
    
    soup = BeautifulSoup(get_html(driver), 'html.parser')
    try:
        iframe = soup.find('iframe', attrs={"id": "tokeholdersiframe"})

        src = iframe.attrs["src"]
        tableUrl = "https://bscscan.com" + src
        # search for iframe

        driver.get(tableUrl)

        tablePageRequest = get_html(driver)
        soup = BeautifulSoup(tablePageRequest, "html.parser")
        
        # now get the table 4 table entries
        maxLen = 5
        table = soup.find('table')

        rowCount = (len(table.findAll('tr')))
        total = maxLen

        if total > rowCount: total = rowCount

        # need to make sure we dont hit more than 255 chars
        # loop through entries and add to list
        holders = {}
        rows = table.findAll('tr')
        for i in range(1, total):
            row = rows[i]
            col = row.findAll('td')

            # need to check if contract or not
            contract = False
            try:
                icon = col[1].findChildren('i', recursive=True)
                if len(icon) != 0:
                    contract = True
            except:
                contract = False

            holderAddress = col[1].getText()
            holderAmt = col[2].getText()
            holderPercent = col[3].getText()

            holders['holder'+str(i)] = {
                'con': str(contract).replace(" ", ""),
                'hAdr': str(holderAddress).replace(" ", ""),
                'hAmt': str(holderAmt).replace(",", "").replace(" ", ""),
                'hPc': str(holderPercent).replace('%', "").replace(" ", "")
            }
        try:
            if(str(holders['holder1']).count("0") > 10):
                holders['holder1']['burned'] = str(True)
        except:
            pass

        return holders


        # now grab the table with the holders info
    except:
        info = sys.exc_info()
        cglobals.getException(logger, info)

