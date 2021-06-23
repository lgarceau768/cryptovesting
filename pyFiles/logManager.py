import os, sys, inspect, re, traceback
from datetime import datetime


class LogManager:

    def __init__(self, dir="logs"):
        self.fileName = os.path.join(os.getcwd(), dir, "runLog" + datetime.now().strftime("%m_%d_%Y__%H_%M_%S") + ".log")
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
        "]+", flags=re.UNICODE)
        return emoji_pattern.sub(r'', string)

    def getTime(self):
        return datetime.now().strftime("%c")

    def log(self, data, level="LOG"):
        try:
            with open(self.fileName, 'a+') as file:
                calledBy = inspect.stack()[1].function
                fileName = inspect.stack()[1].filename
                line = "[%s | %s | %s | %s]: %s\n" % (level, self.getTime(), fileName, calledBy, self.remove_emoji(str(data)))
                file.write(line)
                file.close()
        except:
            print('logmanager fail')            
            exc_type, exc_value, exc_traceback = sys.exc_info()
            print("*** print_tb:")
            traceback.print_tb(exc_traceback, limit=1, file=sys.stdout)
            print("*** print_exception:")
            # exc_type below is ignored on 3.5 and later
            traceback.print_exception(exc_type, exc_value, exc_traceback,
                                    limit=2, file=sys.stdout)
        