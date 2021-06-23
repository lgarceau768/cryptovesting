# CryptoVesting Info  
# PreReqs  
## Programs
- python3.9.4
- pip
- bs4
- requests
- selenium
- Charles Proxy Server  
- Chrome Selenium Driver

## Charles  
The proxy server is used to reroute our http requests through our machine and mask them to bypass  scraping policies etc.  
__Large Blocker__ charles, which we could use for the production level proxy is a paid for program, would not recommend using  
in the future, going to explore some linux options as well  

## MySql Server  
- [One Line Import](/sql/singleFileImport.sql)
- [Folder Export](/sql/folderDump/)
  
  
# Folders  
- [pyFiles](/pyFiles)   
Contains all the python files used in the project  
- [sql](/sql)  
Contains the sql files used in the database (stored procedures, db export folder, db export single file)  
- [textFileOuts](/textFileOuts)  
Folder contianing exports of the raw html of the specific html elements we are pulling data from (for ease of development)  
- [demoVideos](/demoVideos)  
Contains demo videos when a milestone is reached  


# Noticed Blockers  
- going to need to use a headless browser for scraping from tokenfomo  
due to the fact that there (protection) from scraping is not populating 
the entire html table with all the coins from the past 24 hours until  
the user clicks 
- with a headless browser and driver (Chromium with Python Selenium)  
we are able to programmitically click the button and then retrieve  
the information  

# Info  
This is how the process essentially works.  
1. A controller chrome instance is opened (must change path in [selenium_scrape](/pyFiles/selenium_scrape.py))   
2. It clicks the expand button to view the entire list of altcoins in the past 24 hours  
3. Then it executes a javascript function to return the innerHTML of the webpage  
4. Puts the raw html into a beautifulSoup object    
5. Then parses the table and loops through the information and logs it to the console   
5a. Only adds coins that are on BscScan
6. Runs the coin through tokensniffer like this `https://tokensniffer.com/token/{contract_hash}`  
7. Checks to see if there is data on it  
8. Checks to see if it is flagged as a scam  
9. Checks to see if coins similar to it are scams (going to run once without this to see as well)  
10. If they pass each check then they are added to the corresponding table in the database  

# Todo  
fix the database insert double check  
refactor the scraping too loop through proxies  

# Proxy Setup: Ubuntu 20.06  
- Running a virtual machine on VM Workstation 16 with Ubuntu 20.06  
- using squid to setup multiple proxies with a secure login
- pwd: YjVhZmRhMWMwYWU5YTY4YzZkNzRhMDEz  
- [proxy setup](https://elixirnode.com/help/how-to-set-up-multiple-proxy-servers-on-ubuntu-20-04-vps/)]  
- working proxy on port 3128 / 8080 ip 192.168.1.140 (local)  

# TODO
- need to rotate ip to get past the bscscan request limit  
- fix coins being added to the token_fail_sniff table with description of why  
- bscheck.eu uses an api for checking contract, should be pretty simple to mimic  
`curl "http://www.bscheck.eu/check_contract.php?contract=0xb2031a6aec88ef79d75456c2aea57c3d3462e493&sel=1&m=a86fcd071ba395e822c12c3dd2278274a48abf8f6947bd324f204c7fe9f3f4fc_23468" ^
  -H "Connection: keep-alive" ^
  -H "Accept: */*" ^
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36" ^
  -H "X-Requested-With: XMLHttpRequest" ^
  -H "Referer: http://www.bscheck.eu/0xb2031a6aec88ef79d75456c2aea57c3d3462e493" ^
  -H "Accept-Language: en-US,en;q=0.9" ^
  -H "Cookie: _ga=GA1.1.619271479.1623880502; _ga_J17WPTD7PL=GS1.1.1623880502.1.1.1623881917.0" ^
  --compressed ^
  --insecure`