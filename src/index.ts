import express, { Request, Response } from 'express';
import { google } from 'googleapis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Load service account credentials for Google API
const KEY_FILE_PATH = process.env.KEY_FILE_PATH || './service-account.json'; // Path to your service account JSON key file

// Authentication with Service Account
const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: ['https://www.googleapis.com/auth/drive'],
});

// Create a Google Drive API client with Service Account
const driveClient = google.drive({
    version: 'v3',
    auth: auth,
});

// This is your OAuth2 client for the coworker's authentication
const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

// Generate the authentication URL for coworker login
const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive'],
});

// Serve the Google OAuth2 URL to the user
app.get('/auth/google', (req: Request, res: Response) => {
    res.send(`<a href="${authUrl}">Click here to authorize with Google</a>`);
});

// Handle the callback after coworker logs in
app.get('/auth/google/callback', async (req: Request, res: Response) => {
    const code = req.query.code as string;

    if (!code) {
        res.status(400).send('Missing authorization code.');
        return;
    }

    try {
        // Get tokens
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        // At this point, the user is authenticated and their Google Drive is accessible
        res.send('Authentication successful!');

        // Store the tokens securely (e.g., in a database or session)

    } catch (error) {
        console.error('Error during authentication:', error);
        res.status(500).send('Authentication failed.');
    }
});

// Upload a file to Google Drive using the Service Account
app.post('/upload', async (req: Request, res: Response) => {
    try {
        const fileMetadata = {
            name: 'photo.jpg',
            mimeType: 'image/jpeg',
        };
        const media = {
            mimeType: 'image/jpeg',
            body: req.body, // Assuming the body contains the file stream
        };

        const file = await driveClient.files.create({
            requestBody: fileMetadata,
            media: media,
        });

        res.status(200).send('File uploaded successfully!');
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send('File upload failed.');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
