import inspect, datetime, os, time
import logging

path = os.path.join(os.getcwd(), 'logs', 'cryptovesting_'+str(time.time())+'.log')
file = open(path, 'w')
file.write('Starting Logger\n')
file.close()
class LogObject:
    def __init__(self, name):        
        global path
        logging.basicConfig(filename=path, encoding='utf-8', level=logging.DEBUG)
        self.name = name
        self.logPath = path
    
    def log(self, message, level):
        if level is None:
            level = 'debug'
        functionCaller = inspect.stack()[1][3]
        timestamp = str(datetime.datetime.now()).split('.')[0]
        line = self.name + ' | ' + level + ' | ' + functionCaller + ' @ ' + timestamp + ' -> ' + message
        self.writeToFile(line)

    def logWithCaller(self, message, level, caller):
        if level is None:
            level = 'debug'
        timestamp = str(datetime.datetime.now()).split('.')[0]
        line = self.name + ' | ' + level + ' | ' + caller + ' @ ' + timestamp + ' -> ' + message
        self.writeToFile(line)

    def writeToFile(self, line):
        if 'error' in line:
            logging.error(line)
        else:
            logging.info(line)

    def logArgs(self, *args):
        functionCaller = inspect.stack()[1][3]
        line = '('
        for arg in args:
            line += str(arg) + ', '
        line = line[:len(line) - 2]
        line += ')'
        self.logWithCaller(line, 'call', functionCaller)
