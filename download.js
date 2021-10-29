const https = require('https'); // or 'https' for https:// URLs
const fs = require('fs');
const request = require('request');


module.exports.getVData = (ver) => {return new Promise((resolve, reject) => {try{
	request(`https://dedragames.com/games/ovo/${ver}/offline.js`, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			if(body.charCodeAt(0) === 65279) body = body.trim()
			resolve(JSON.parse(body))
		} else {
			reject(error || response.statusCode)
		}
	})
}catch(e){reject(e)}})};


module.exports.downloadGame = (ver) => {return new Promise((resolve, reject) => {try{
	const gameUrl = `https://dedragames.com/games/ovo/${ver}/`
	module.exports.getVData(ver).then(body => {
		let fileList = body.fileList;
		if(!fileList.includes('')) fileList.push('')
		let finished = 0
		console.log(`Downloading files for version ${ver}. Do not close until finished...`)
		fileList.forEach((i) =>{
			if(i === '') i = 'index.html';
			let dirs = i.split('/')
			dirs.pop()
			dirs = dirs.join('/')
			fs.mkdirSync(`gameFiles/${ver}/${dirs}`, { recursive: true })
			const file = fs.createWriteStream(`gameFiles/${ver}/${i}`);
			const request = https.get(gameUrl + i, function(response) {
				response.pipe(file);
				file.on('close', () => {
					finished++;
					process.stdout.clearLine();
					process.stdout.cursorTo(0);
					process.stdout.write(`${finished}/${fileList.length} files`);
					if(finished === fileList.length) {
						let verData = {
							readableVer: ver,
							ver: body.version,
						}
						fs.writeFile(`gameFiles/${ver}/versionData.json`, JSON.stringify(verData, null, 2), () => {
							resolve()
							console.log('\nDone!');
						})
					}
				})
			});
		})
	}, err => {reject(err)})
}catch(e){reject(e)}})};