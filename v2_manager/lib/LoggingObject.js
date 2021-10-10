const fs = require('fs');
const path = require('path')

const startTime = new Date();
const logPath = path.join(__dirname, '..', 'logs', 'crypotvesting_api'+ startTime.getTime() + '.log')
fs.writeFileSync(logPath, 'Starting Cryptovesting Service '+ startTime.toISOString() + '\n')

Object.defineProperty(global, '__stack', {
    get: function() {
            var orig = Error.prepareStackTrace;
            Error.prepareStackTrace = function(_, stack) {
                return stack;
            };
            var err = new Error;
            Error.captureStackTrace(err, arguments.callee);
            var stack = err.stack;
            Error.prepareStackTrace = orig;
            return stack;
        }
    });
    
    Object.defineProperty(global, '__line', {
    get: function() {
            return __stack[1].getLineNumber();
        }
    });
    
    Object.defineProperty(global, '__function', {
    get: function() {
        let e = new Error();
        let frame = e.stack.split("\n")[3]; // change to 3 for grandparent func
        let functionName = frame.split(" ")[5] + frame.split(' ')[6];
        return functionName.split('(')[0]
        }
    }
);

class LogObject {
    constructor(name){
        this.name = name;
        return this;
    }

    log(message, level) {
        if(level === undefined) {
            level = 'debug'
        }
        let caller = '';
        try {
            caller = __function
        } catch (e) {};
        let timestamp = new Date();
        if(this.date !== timestamp.getDate()) {
            this.date = timestamp.getDate();
            fs.appendFileSync(logPath, 'New Day '+ this.date + '\n')
        }        
        let timeString = timestamp.getHours() + ':' + timestamp.getMinutes() + '.' + timestamp.getSeconds();
        let line = this.name + '|' + level + '|' + caller + ' @ ' + timeString + ' -> ' +  message + '\n';
        fs.appendFileSync(logPath, line)
    }

    logWithParent(message, level, parentCaller) {
        if(level === undefined) {
            level = 'debug'
        }
        let timestamp = new Date();
        if(this.date !== timestamp.getDate()) {
            this.date = timestamp.getDate();
            fs.appendFileSync(logPath, 'New Day '+ this.date + '\n')
        }        
        let timeString = timestamp.getHours() + ':' + timestamp.getMinutes() + '.' + timestamp.getSeconds();
        let line = this.name + '|' + level + '|' + parentCaller + ' @ ' + timeString + ' -> ' +  message + '\n';
        fs.appendFileSync(logPath, line)
    }

    logArgs() {
        let caller = 'logArgs';
        try {
            caller = __function
        } catch (e) {};
        let baseString = 'arguments ('
        for(let i = 0; i < arguments.length; i++) {
            baseString = baseString + arguments[i] + ','
        }
        baseString = baseString.substring(0, baseString.lastIndexOf(','))
        baseString = baseString + ')'
        this.logWithParent(baseString, 'call', caller)
    }
}

module.exports = LogObject;