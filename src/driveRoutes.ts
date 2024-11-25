import { Router, Request, Response } from 'express';
import { google } from 'googleapis';

const router = Router();

// Service Account credentials for Google API
const KEY_FILE_PATH = './service-account.json'; // Replace with your path
const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const driveClient = google.drive({
    version: 'v3',
    auth: auth,
});

// Endpoint to upload a file to Google Drive
router.post('/upload', async (req: Request, res: Response) => {
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

// Endpoint to get folders and images from Google Drive
router.get('/get-folders-and-pictures', async (req: Request, res: Response) => {
    try {
        const foldersResponse = await driveClient.files.list({
            q: "mimeType = 'application/vnd.google-apps.folder'",
            fields: 'files(id, name)',
        });

        const imagesResponse = await driveClient.files.list({
            q: "mimeType = 'image/jpeg' or mimeType = 'image/png'",
            fields: 'files(id, name, mimeType)',
        });

        const data = {
            folders: foldersResponse.data.files,
            images: imagesResponse.data.files,
        };

        res.status(200).json(data);
    } catch (error) {
        console.error('Error retrieving folders and images:', error);
        res.status(500).send('Failed to fetch folders and images.');
    }
});

export default router;
