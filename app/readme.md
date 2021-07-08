<<<<<<< HEAD
# Info  
The frontend is currently a plain html file being hosted on 25.89.250.119:4041 with the following endpoints:  
- /upload_token
  for manual token upload to the database  
- /upload_event
  for later use with a discord server the the worker scripts will post events / updates to the backend  
- /pull_events
  for use for the discord bot which will constantly pull for events and then it will clear the current ones  

# Linux Processes  
manaul_entry.service - for hosting the front end  
manual_backend.service - for running the nodejs backend  

## Monitor 
for the backend it outputs to the logs but you can also see the output via ssh and running:  
`sudo systemctl status manual_backend.service`  
you can mirror this functionality for the front end but it should never be needed since all its doing is very simple   
=======
# Info  
The frontend is currently a plain html file being hosted on 25.89.250.119:4041 with the following endpoints:  
- /upload_token
  for manual token upload to the database  
- /upload_event
  for later use with a discord server the the worker scripts will post events / updates to the backend  
- /pull_events
  for use for the discord bot which will constantly pull for events and then it will clear the current ones  

# Linux Processes  
manaul_entry.service - for hosting the front end  
manual_backend.service - for running the nodejs backend  

## Monitor 
for the backend it outputs to the logs but you can also see the output via ssh and running:  
`sudo systemctl status manual_backend.service`  
you can mirror this functionality for the front end but it should never be needed since all its doing is very simple   
>>>>>>> 1e3863f015956128c6e5f2af8081280410a04cc7
`sudo systemctl status manaul_entry.serivce` (mind the typo its on purpose) 