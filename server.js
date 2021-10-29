const express = require('express');
const fs = require('fs');
const path = require('path');
const { downloadGame, getVData } = require('./download.js');
var app = express();




//CONFIG
const enableMods = true;
//Allow overwriting files
//Enable this and copy the file to the overwrites folder
//This will force OvO to use the overwritten file
const enableOverwrites = true;
//Version of the game when none is specified
const defaultVersion = 'CrashTest';

//Order of loading
//1. If mods are enabled, load all the mods' .js files into index.html
//2. If overwrites are enabled, send all the overwrites'files
//3. Load the default files



const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 [options]')
    .command('$0', 'default')
    .example('$0 -v 1.4.4', 'Play version 1.4.4')
    .example('$0 -v CrashTest', 'Play version CrashTest')
    .example('$0', 'Play the default version set in server.js')
    .version(false)
    .alias('v', 'version')
    .nargs('v', 1)
    .describe('v', 'The version to play')
    .string('v')
    .default('v', defaultVersion)
    .help('h')
    .alias('h', 'help')
    .nargs('h', 0)
    .epilog('LvnaLoader')   
    .argv;



(async () => {

    

    //Check if the game is already downloaded
    if (!fs.existsSync('./gameFiles/' + argv.v + '/versionData.json')) {
        console.log('Game not found, downloading...');
        await downloadGame(argv.v);
    } else {
        let vData = JSON.parse(fs.readFileSync('./gameFiles/' + argv.v + '/versionData.json', 'utf8'));
        let onlineVData = await getVData(argv.v);
        if(vData.ver !== onlineVData.version) {
            console.log('Update Required. Deleting old files...');
            fs.rmdirSync('./gameFiles/' + argv.v, { recursive: true });
            await downloadGame(argv.v);
        }
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
            fs.readFile(path.join(__dirname, 'gameFiles', argv.v ,'index.html'), 'utf8', function(err, data) {
                if (err) {
                    res.sendStatus(404);
                } else {
                    res.send(data.replace('<script src="c2runtime.js"></script>', '<script src="c2runtime.js"></script>'+modStr));
                }
            });
        }
        app.get("/index.html", indexHandler);
        app.get("/", indexHandler);
        app.get("/index", indexHandler);


        app.use(express.static(__dirname + '/mods'));
    }

    if(enableOverwrites) app.use(express.static(__dirname + '/overwrites'));

    app.use(express.static(__dirname + '/gameFiles/' + argv.v));

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
        console.log(`OvO ${argv.v} running ${statusStr}at http://localhost:8080`)
    })

})();