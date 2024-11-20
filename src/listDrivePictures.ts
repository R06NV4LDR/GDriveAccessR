import fs from 'fs';
import readline from 'readline';
import {google, Auth} from 'googleapis';

fs.readFile('credentials.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error loading client secret file:', err);
        return;
    }
    authorize(JSON.parse(data) as Credentials, listPictures);
});

function authorize(credentials, callback) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    fs.readFile('token.json', (err, token) => {
        if (err) {
            return getNewToken(oAuth2Client, callback);
        }
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive.metadata.readonly']
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            fs.writeFile('token.json', JSON.stringify(token), err => {
                if (err) return console.error(err);
                console.log('Token stored to', 'token.json');
            });
            callback(oAuth2Client);
        });
    });
}

function listPictures(auth) {
    const drive = google.drive({version: 'v3', auth});
    drive.files.list({
            pageSize: 10,
            fields: 'nextPageToken, files(id, name, mimeType)',
            q: "mimeType contains 'image/'"
        }, (err, res) => {
            if (err) return console.error('The API returned an error:', err);
            const files = res.data.files;
            if (files.length) {
                console.log('Files:');
                files.map((file) => {
                    console.log(`${file.name} (${file.id}) - ${file.mimeType}`);
                });
            } else {
                console.log('No files found.');
            }
        }
    );
}