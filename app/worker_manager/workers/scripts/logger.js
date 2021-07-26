const fs = require('fs')
let pathUse = ""
function init(path, program) {
    pathUse = path
    let isoString = new Date();
    fs.writeFileSync(path, "[ START "+ isoString.toISOString() + " ] Starting " + program + "\n")
}

const _l = (data, level="LOG") => {
    let isoString = new Date();
    let line = "[ " + level + " " + isoString.toISOString() + " ] " + data + "\n";
    fs.appendFileSync(pathUse, line)
}


module.exports = {
    init, _l
}