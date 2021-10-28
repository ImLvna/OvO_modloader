const https = require('https'); // or 'https' for https:// URLs
const fs = require('fs');
const request = require('request');





module.exports = () => {return new Promise(resolve => {
	//CONFIG, EDIT ME
	//Url to access game
	const gameUrl = 'https://dedragames.com/games/ovo/CrashTest/'
	//Folder to save files to. Must be recursive
	const downloadDir = 'gameFiles'


	if(!gameUrl.endsWith('/')) gameUrl += '/'
	request(gameUrl + 'offline.js', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			if(body.charCodeAt(0) === 65279) body = body.trim()
	    	let fileList = JSON.parse(body).fileList;
			if(!fileList.includes('')) fileList.push('')
			console.log(fileList.length)
			let finished = 0
			console.log('Downloading files. Do not close until finished...')
			fileList.forEach((i) =>{
				if(i === '') i = 'index.html';
				let dirs = i.split('/')
				dirs.pop()
				dirs = dirs.join('/')
				fs.mkdir(`${downloadDir}/${dirs}`, { recursive: true }, ()=>{})
				const file = fs.createWriteStream(downloadDir + i);
				const request = https.get(gameUrl + i, function(response) {
					response.pipe(file);
					file.on('close', () => {
						finished++;
						process.stdout.clearLine();
	    				process.stdout.cursorTo(0);
	    				process.stdout.write(`${finished}/${fileList.length} files`);
						if(finished === fileList.length) {
							console.log('\nDone!');
							resolve()
						}
					})
				});
			});
		}
	})

})};