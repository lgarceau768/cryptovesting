# Info  
this will be the main app.js that runs and controls the workers 
- buy
- sell
- sniper
- token balance manager
- static contract check
- token sniffer check  

# Flow  
1. token added to cryptovesting.tokens  
2. spawns a contractCheckWorker
  - pass -> added to tokens_passed_contract_check table and continue
  - fail -> added to tokens_failed_contract_check table and next token
3. spawns a tokenSnifferCheckWorker  
  - pass -> added to tokens_for_sniping table and continue  
  - fail -> added to tokens_failed_sniffer table and next token  
4. spawns a sniperWorker
  - onPairCreated -> buy with bnb amount then take result amount of coin and add it to the wallet_tokens_balance table and trigger step 5
5. spawn a tokenBalanceManagerWork for the token put in wallet_tokens_balance
  - will update the table with the given coins price 
  - once price has 2xed 
    - spawn a sellWorker (to sell the token and update the wallet_tokens_balance table) 