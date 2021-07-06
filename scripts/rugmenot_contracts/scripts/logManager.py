import os, sys, inspect, re, traceback
from datetime import datetime


class LogManager:

    def __init__(self, basename, dirName="logs"):
    
        self.fileName = "/home/fullsend/cryptovesting/scripts/rugmenot_contracts/logs/" +basename +  "Log_" + datetime.now().strftime("%m_%d_%Y__%H_%M_%S") + ".log"
        print(self.fileName)
        with open(self.fileName, "w") as file:
            file.write("Scrape started on: "+datetime.now().strftime("%X") + "\n")
            file.close()

    # TODO:
    # add more emojis here
    def remove_emoji(self, string):
        emoji_pattern = re.compile("["
            u"\U0001F600-\U0001F64F"  # emoticons
            u"\U0001F300-\U0001F5FF"  # symbols & pictographs
            u"\U0001F680-\U0001F6FF"  # transport & map symbols
            u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
            u"\U00002500-\U00002BEF"  # chinese char
            u"\U00002702-\U000027B0"
            u"\U00002702-\U000027B0"
            u"\U000024C2-\U0001F251"
            u"\U0001f926-\U0001f937"
            u"\U00010000-\U0010ffff"
            u"\u2640-\u2642"
            u"\u2600-\u2B55"
            u"\u200d"
            u"\u23cf"
            u"\u23e9"
            u"\u231a"
            u"\ufe0f"  # dingbats
            u"\u3030"
            u"\u0110"
            u"\u01b0"
            u"\u0131"
            u"\u1ec7"
            u"\xF0\x9F\x90\x9D"
            u"\xF0\x9F\xA4\xB2\xF0\x9F"
            u"\xF0\x9F\xA6\x8F"
            u"\xF0\x9F\x97\xBF"
            u"\xF0\x9F\x92\xA0"
            u"\xF0\x9F\x9A\x80"
            u"\xF0\x9F\x8C\x95"
            u"\xF0\x9F\xA6\x8D"
            u"\xF0\x9F\x8C\x9F"
            u"\xF0\x9F\x90\x96"
            u"\xF0\x9F\x92\xB2"
            u"\xF0\x9F\x94\x85"
            u"\xF0\x9F\x92\xA0"
            u"\xF0\x9F\x92\xA9"
            u"\xF0\x9F\x8C\x90"
            u"\xF0\x9F\x8C\x95"
            u"\xF0\x9F\x94\xB1"
            u"\xF0\x9F\x92\xA5"
            u"\xF0\x9F\x92\xAE"
        "]+", flags=re.UNICODE)
        return emoji_pattern.sub(r'', string)

    def getTime(self):
        return datetime.now().strftime("%c")

    def log(self, data, level="LOG"):
        with open(self.fileName, 'a+') as file:
            line = "[%s | %s | %s | %s]: %s\n" % (level, self.getTime(), self.remove_emoji(str(data)))
            file.write(line)
            file.close()
        
        