<<<<<<< HEAD
const fs = require('fs')
let pathUse = ""
function init(path) {
    pathUse = path
    let isoString = new Date();
    fs.writeFileSync(path, "[ START "+ isoString.toISOString() + " ] Starting app.js to listen to the sql and run contract checks\n")
}

_l = (data, level="LOG") => {
    let isoString = new Date();
    let line = "[ " + level + " " + isoString.toISOString() + " ] " + data + "\n";
    fs.appendFileSync(pathUse, line)
}


module.exports = {
    init, _l
=======
const fs = require('fs')
let pathUse = ""
function init(path) {
    pathUse = path
    let isoString = new Date();
    fs.writeFileSync(path, "[ START "+ isoString.toISOString() + " ] Starting app.js to listen to the sql and run contract checks\n")
}

_l = (data, level="LOG") => {
    let isoString = new Date();
    let line = "[ " + level + " " + isoString.toISOString() + " ] " + data + "\n";
    fs.appendFileSync(pathUse, line)
}


module.exports = {
    init, _l
>>>>>>> 1e3863f015956128c6e5f2af8081280410a04cc7
}