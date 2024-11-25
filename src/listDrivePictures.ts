import fs from 'fs';
import readline from 'readline';
import {google, Auth, drive_v3} from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URIS = process.env.REDIRECT_URIS?.split(',') || [];

if (!CLIENT_ID || !CLIENT_SECRET||REDIRECT_URIS.length === 0) {
    throw new Error('Missing required environment variables for Google API credentials');
}

const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URIS[0]
);

// fs.readFile('credentials.json', 'utf8', (err, data) => {
//     if (err) {
//         console.error('Error loading client secret file:', err);
//         return;
//     }
//     authorize(JSON.parse(data) as Credentials, listPictures);
// });

function authorize(callback: (auth: Auth.OAuth2Client) => void) {
    // const {client_secret, client_id, redirect_uris} = credentials.installed;
    // const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    fs.readFile('token.json', 'utf8', (err, token) => {
        if (err) {
            return getNewToken(oAuth2Client, callback);
        }
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

function getNewToken(oAuth2Client: Auth.OAuth2Client, callback: (auth: Auth.OAuth2Client) => void) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive.metadata.readonly']
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) {
                console.error('Error retrieving access token', err);
                return;
            }
            if (token) {
                oAuth2Client.setCredentials(token);

                fs.writeFile('token.json', JSON.stringify(token), err => {
                    if (err) return console.error(err);
                    console.log('Token stored to', 'token.json');
                });
                callback(oAuth2Client);
            }
        });
    });
}

function listPictures(auth: Auth.OAuth2Client) {
    const drive = google.drive({version: 'v3', auth}) as drive_v3.Drive;
    drive.files.list({
            pageSize: 10,
            fields: 'nextPageToken, files(id, name, mimeType)',
            q: "mimeType contains 'image/'"
        },
        (err, res) => {
            if (err) {
                console.error('The API returned an error:', err);
                return;
            }
            const files = res?.data.files;
            if (files && files.length > 0) {
                console.log('Files:');
                files.forEach((file) => {
                    console.log(`${file.name} (${file.id}) - ${file.mimeType}`);
                });
            } else {
                console.log('No files found.');
            }
        }
    );
}