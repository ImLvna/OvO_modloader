const express = require('express');
const fs = require('fs');
const path = require('path');
const downloadGame = require('./download.js');
var app = express();

//CONFIG
const enableMods = true;
//Allow overwriting files
//Enable this and copy the file to the overwrites folder
//This will force OvO to use the overwritten file
const enableOverwrites = true;


//Order of loading
//1. If mods are enabled, load all the mods' .js files into index.html
//2. If overwrites are enabled, send all the overwrites'files
//3. Load the default files


(async () => {

    //Check if the game is already downloaded
    if (!fs.existsSync('./gameFiles')) {
        console.log('Game not found, downloading...');
        await downloadGame();
    }

    if(enableMods) {
        let modNames = []
        let modStr = '\n\n	<!--- lvnaMod Loader Mods --->'
        fs.readdirSync('mods').forEach(file => {
            if(!file.startsWith('_')) modNames.push(file)
        });
        modNames.forEach(mod => {
            modStr += '\n	<script src="' + mod + '"></script>'
        })
        modStr += '\n	<!--- lvnaMod Loader Mods --->'

        function indexHandler(req, res) {
            fs.readFile(path.join(__dirname, 'gameFiles', 'index.html'), function(err, data) {
                if (err) {
                    res.sendStatus(404);
                } else {
                    res.send(data.toString().replace('<script src="c2runtime.js"></script>', '<script src="c2runtime.js"></script>'+modStr));
                }
            });
        }
        app.get("/index.html", indexHandler);
        app.get("/", indexHandler);
        app.get("/index", indexHandler);


        app.use(express.static(__dirname + '/mods'));
    }

    if(enableOverwrites) app.use(express.static(__dirname + '/overwrites'));

    app.use(express.static(__dirname + '/gameFiles'));

    //VERY shitty string manip
    //none: 'running at http...'
    //mod: 'running with mods at http...'
    //overwrite: 'running with overwrites at http...'
    //both: 'running with mods and overwrites at http...'
    let statusStr = '';
    if(enableMods) {
        statusStr = 'with mods ';
        if(enableOverwrites) statusStr += 'and overwrites '
    } else if(enableOverwrites) statusStr = 'with overwrites '
    app.listen(8080, () => {
        console.log(`OvO running ${statusStr}at http://localhost:8080`)
    })

})();