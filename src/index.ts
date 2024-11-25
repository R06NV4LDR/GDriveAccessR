import dotenv from "dotenv";
import express, { Request, Response } from 'express';
import multer from 'multer';
import { google, drive_v3 } from 'googleapis';

// Load environment variables from .env file
dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });
const router = express.Router();

// Scopes for Google Drive API access
const scopes = ['https://www.googleapis.com/auth/drive.file'];

// Initialize OAuth2 client with credentials from environment variables
const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

// Set refresh token (if available) to avoid needing re-authentication
oAuth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
});

// Generate the authentication URL
const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline', // 'offline' to receive a refresh token
    scope: scopes,
    include_granted_scopes: true // Enable incremental authorization
});

// Route to get the authentication URL
router.get('/auth/google', (req: Request, res: Response) => {
    res.send(authUrl);
});

// Change the type of google.drive using type assertion
const driveClient = google.drive({ version: "v3" }) as drive_v3.Drive;
driveClient.context._options.auth = oAuth2Client; // Explicitly set the auth context

// Handle the callback from Google OAuth2 flow
router.get('/auth/google/callback', async (req: Request, res: Response) => {
    const code = req.query.code;

    if (typeof code !== 'string') {
        res.status(400).send('Invalid or missing authorization code');
        return;
    }

    try {
        // Exchange the authorization code for access and refresh tokens
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        // Optional: Save tokens in a database or session for future use

        // Respond with a success message or redirect to a success page
        res.send('Authentication successful!');
    } catch (error) {
        console.error('Error authenticating:', error);
        res.status(500).send('Authentication failed.');
    }
});

// Mount the router on the app
app.use('/', router);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
