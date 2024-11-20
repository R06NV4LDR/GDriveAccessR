import fs from 'fs';
import readline from 'readline';
import {google, Auth} from 'googleapis';

interface Credentials {
    installed: {
        client_id: string;
        project_id: string;
        auth_uri: string;
        token_uri: string;
        auth_provider_x509_cert_url: string;
        client_secret: string;
        redirect_uris: string[];
    };
}

fs.readFile('credentials.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error loading client secret file:', err);
        return;
    }
    authorize(JSON.parse(data) as Credentials, listPictures);
});

function authorize(credentials: Credentials, callback: (auth: Auth.OAuth2Client) => void) {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    fs.readFile('token.json','utf8', (err, token) => {
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
    const drive = google.drive({version: 'v3', auth});
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
            if (files && files.length) {
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