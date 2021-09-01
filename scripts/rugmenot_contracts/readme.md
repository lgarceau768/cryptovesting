# Info  
this is the tokens database watcher which will spawn new worker.js files when a token is added to the database  
it then runs it through our static contract check and adds it to the respective databse based on its score  

# Monitor  
Currently running as a linux service  
`sudo systemctl status tokens_listener.service`