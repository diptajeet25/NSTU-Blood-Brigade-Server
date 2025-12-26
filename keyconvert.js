const fs = require('fs');
const key = fs.readFileSync('../nstu-blood-brigade-firebase-adminsdk-fbsvc-b970b38553.json', 'utf8')
const base64 = Buffer.from(key).toString('base64')
console.log(base64)