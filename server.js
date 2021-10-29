const express = require('express');
const fs = require('fs');
const path = require('path');
const { downloadGame, getVData } = require('./download.js');
var app = express();
const sendFileOptions = {
    root: path.join(__dirname),
}


//To disable a feature:
//  node server.js --no-FEATURENAME
//ex: node server.js --no-speedrun
//ex: node server.js --no-mods

//DEFAULT CONFIG
const enableMods = true;
//Allow overwriting files
//Enable this and copy the file to the overwrites folder
//This will force OvO to use the overwritten file
const enableOverwrites = true;
//Version of the game when none is specified
const gameVersion = 'CrashTest';
//Speedrun mode!
//Adds:
//  Mobile mode below 1.4.4
const speedrunMode = false;

//Order of loading
//1. If we are using debug mode, load the debug overwrites
//2. If mods are enabled, load all the mods' .js files for that version into index.html
//3. If mods are enabled, load all the mods from mods/default into index.html
//4. If overwrites are enabled, send all the overwrites'files
//5. Load the default files



const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
let debug = false
const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 [options]')
        .example('$0 -v 1.4.4', 'Play version 1.4.4')
        .example('$0 -v CrashTest', 'Play version CrashTest')
        .example('$0', 'Play the default version set in server.js')
        .example('$0 debug', 'Output debug files for default version')
        .example('$0 debug 1.4.4', 'Output debug files for 1.4.4')
    .command('$0', 'Run/download the game') 
        .version(false)
        .alias('v', 'version')
            .nargs('v', 1)
            .describe('v', 'The version to play')
            .string('v')
            .default('v', gameVersion)
        .alias('m', 'mods')
            .describe('m', 'Enable mods')
            .boolean('m')
            .default('m', enableMods)
        .alias('o', 'overwrites')
            .describe('o', 'Enable overwrites')
            .boolean('o')
            .default('o', enableOverwrites)
        .alias('s', 'speedrun')
            .describe('s', 'Enables speedrun-safe mods')
            .boolean('s')
            .default('s', speedrunMode)
        .alias('d', 'debug')
            .describe('d', 'Use debug overwrites')
            .boolean('d')
            .default('d', false)
    .command(['debug', 'd'], 'Output various debug files', noop, ()=>{debug = true})
        .version(false)
        .alias('v', 'version')
            .nargs('v', 1)
            .describe('v', 'The version to debug')
            .string('v')
            .default('v', gameVersion)
    .help('h')
        .alias('h', 'help')
        .nargs('h', 0)
    .epilog('LvnaLoader')   
    .argv;


(async () => {if(!debug){

    if(argv.s) {
        argv.m = false
        argv.o = false
        argv.d = false
        console.log('Speedrun mode enabled. Mods, overwrites, and debug are disabled.')
    }


    fs.mkdirSync(`mods/${argv.v}`, {recursive: true});
    fs.mkdirSync('mods/default', {recursive: true});
    fs.mkdirSync(`overwrites/${argv.v}`, {recursive: true});

    //Check if the game is already downloaded
    if (!fs.existsSync(`gameFiles/${argv.v}/versionData.json`)) {
        console.log('Game not found, downloading...');
        try{
            await downloadGame(argv.v);
        }catch(e){console.error('Download Error. Do you have internet? ' + e)}
    } else {try{
        let vData = JSON.parse(fs.readFileSync(`gameFiles/${argv.v}/versionData.json`, 'utf8'));
        let onlineVData = await getVData(argv.v);
        if(vData.ver !== onlineVData.version) {
            console.log('Update Required. Deleting old files...');
            fs.rmdirSync(`gameFiles/${argv.v}`, { recursive: true });
            await downloadGame(argv.v);
        }
    }catch(e){console.error('Download Error. Do you have internet? ' + e)}}

    if(argv.m) {
        let modNames = []
        let modStr = '\n\n	<!--- lvnaMod Loader Mods --->'
        fs.readdirSync(`mods/${argv.v}`).forEach(file => {
            if(!file.startsWith('_')) modNames.push(file)
        });
        fs.readdirSync('mods/default').forEach(file => {
            if(!file.startsWith('_')) modNames.push(file)
        });
        modNames.forEach(mod => {
            modStr += `\n	<script src="${mod}"></script>`
        })
        modStr += '\n	<!--- lvnaMod Loader Mods --->'

        function indexHandler(req, res) {
            fs.readFile(`gameFiles/${argv.v}/index.html`, 'utf8', function(err, data) {
                if (err) {
                    res.sendStatus(404);
                } else {
                    res.send(data.replace(/(<script src="c2runtime\.js"><\/script>)/, `$1${modStr}`));
                }
            });
        }
        app.get('/index.html', indexHandler);
        app.get('/', indexHandler);
        app.get('/index', indexHandler);


        app.use(express.static(`mods/${argv.v}`));
        app.use(express.static('mods/default'));
    }

    if(argv.s) {

        let modStr = '\n\n	<!--- lvnaMod Loader Speedrun Edition --->\n	<script src="speedrun.js"></script>\n	<!--- lvnaMod Loader Speedrun Edition --->'

        function indexHandler(req, res) {
            fs.readFile(`gameFiles/${argv.v}/index.html`, 'utf8', function(err, data) {
                if (err) {
                    res.sendStatus(404);
                } else {
                    res.send(data.replace(/(<script src="c2runtime\.js"><\/script>)/, `$1${modStr}`));
                }
            });
        }
        app.get('/index.html', indexHandler);
        app.get('/', indexHandler);
        app.get('/index', indexHandler);
        app.get('/speedrun.js', (req, res) => {
            res.sendFile(`speedrun.js`, sendFileOptions)
        })
    }

    if(argv.o) app.use(express.static('overwrites'));
    if(argv.d) app.use(express.static(`debug/${argv.v}`));

    app.use(express.static(`gameFiles/${argv.v}`));

    //VERY shitty string manip
    //none: 'running at http...'
    //mod: 'running with mods at http...'
    //overwrite: 'running with overwrites at http...'
    //both: 'running with mods and overwrites at http...'
    let statusStr = '';
    if(argv.m) {
        statusStr = 'with mods ';
        if(argv.o) statusStr += 'and overwrites '
    } else if(argv.o) statusStr = 'with overwrites '
    if(argv.s) statusStr = 'in speedrun mode '
    app.listen(8080, () => {
        console.log(`OvO ${argv.v} running ${statusStr}at http://localhost:8080`)
    })

} else {
    let dataJson = fs.readFileSync(`gameFiles/${argv.v}/data.js`, 'utf8')
    if(dataJson.charCodeAt(0) === 65279) dataJson = dataJson.trim()
    dataJson = JSON.parse(dataJson)
    dataJson = JSON.stringify(dataJson, null, 2)
    fs.mkdirSync(`debug/${argv.v}`, { recursive: true })
    fs.writeFileSync(`debug/${argv.v}/gameData.json`, dataJson)
    fs.copyFileSync(`gameFiles/${argv.v}/c2runtime.js`, `debug/${argv.v}/c2runtime.js`)
    //File doesnt exist in 1.4.3
    try{fs.copyFileSync(`gameFiles/${argv.v}/adconfig.json`, `debug/${argv.v}/adconfig.json`)}catch(e){}
    fs.copyFileSync(`gameFiles/${argv.v}/versionData.json`, `debug/${argv.v}/versionData.json`)
}})()

function noop() {};