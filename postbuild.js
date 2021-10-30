const fs = require('fs');

let speedrunload = fs.readFileSync('speedrunload.js', 'utf8')
let speedrunloadComment = 'Hey! Luna here! This is obfuscated, to hide the tamper detection code. I would be happy to send the unobfuscated version to anyone trusted in the community.'
fs.writeFileSync('speedrunload.js', `//${speedrunloadComment}\n${speedrunload}`)