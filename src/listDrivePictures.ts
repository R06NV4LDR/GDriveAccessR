const fs = require('fs');
const { google } = require('googleapis');

fs.readFile('credentials.json', 'utf8', (err, data) => {
    if (err) return console.error('Error loading client secret file:', err)
})