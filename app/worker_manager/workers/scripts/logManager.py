import os, sys, inspect, re, traceback
from datetime import datetime

os.chdir('/home/fullsend/cryptovesting/app/worker_manager')
class LogManager:

    def __init__(self, basename):    
        self.fileName = basename +  ".log"
        self.fileName = os.path.join(os.getcwd(), 'workers', 'logs', self.fileName)
        with open(self.fileName, "w") as file:
            file.write("Scrape started on: "+datetime.now().strftime("%X") + "\n")
            file.close()

    def getTime(self):
        return datetime.now().strftime("%c")

    def log(self, data, level="LOG"):
        line = "[%s %s]: %s\n" % (level, self.getTime(), str(data))
        with open(self.fileName, 'a+') as file:
            file.write(line)
            file.close()
        
        