import dotenv from "dotenv";
import express, { Request, Response } from 'express';
import multer from 'multer';
import { google, drive_v3 } from 'googleapis';

// Load environment variables from .env file
dotenv.config();

const app = express();
const upload = multer({dest: 'uploads/'})
const router = express.Router();

const oAuth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
    );

// Create an OAuth2 client
oAuth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
});

// Generate the authentication URL
const authUrl = oAuth2Client.generateAuthUrl({
    // 'online' (default) or 'offline' (gets refresh_token)
    access_type: 'offline',
    /** Pass in the scopes array defined above.
     * Alternatively, if only one scope is needed, you can pass a scope URL as a string */
    scope: scopes,
    // Enable incremental authorization. Recommended as a best practice.
    include_granted_scopes: true
});

// Get the authentication URL
router.get('/auth/google', (req: Request, res: Response) => {
    res.send(authUrl);
});

const drive: drive_v3.Drive = google.drive.v3({
    version: "v3",
    auth: oAuth2Client,
});

// Handle the callback from the authentication flow
router.get('/auth/google/callback', async (req: Request, res: Response) => {
    const code = req.query.code;

    if (typeof code !== 'string') {
        res.status(400).send('Invalid or missing authorization code');
        return;
    }

    try {
        // Exchange the authorization code for access and refresh tokens
        const { tokens } = await oAuth2Client.getToken(code);
        const accessToken = tokens.access_token;
        const refreshToken = tokens.refresh_token;
        oAuth2Client.setCredentials({ refresh_token: refreshToken, access_token:accessToken });

        // Save the tokens in a database or session for future use

        // Redirect the user to a success page or perform other actions
        res.send('Authentication successful!');
    } catch (error) {
        console.error('Error authenticating:', error);
        res.status(500).send('Authentication failed.');
    }
});

module.exports = router;