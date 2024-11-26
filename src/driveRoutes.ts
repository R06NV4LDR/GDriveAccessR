import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import multer from "multer";
import fs from 'fs';

const router = Router();
const KEY_FILE_PATH = './service-account.json';

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: ['https://www.googleapis.com/auth/drive'],
});
const driveClient = google.drive({
    version: 'v3',
    auth: auth,
});

const upload = multer({ dest: 'uploads/' });

// Endpoint to upload a file to Google Drive
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({message: 'No file uploaded'});
        }
        const fileMetadata = {
            name: req.file.originalname,
            mimeType: req.file.mimetype,
        };

        const media = {
            mimeType: req.file.mimetype,
            body: fs.createReadStream(req.file.path), // Assuming the body contains the file stream
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


// Endpoint to test connection to Google Drive
router.get('/test-connection', async (req: Request, res: Response) => {
    try {
        // Testing Google Drive API connection by listing files in the root folder
        const filesResponse = await driveClient.files.list({
            pageSize: 1,
            fields: 'files(id, name)',
        });

        if (filesResponse.data.files && filesResponse.data.files.length > 0) {
            res.status(200).send('Connection to Google Drive successful!');
        } else {
            res.status(500).send('No files found. Connection failed.');
        }
    } catch (error) {
        console.error('Error connecting to Google Drive:', error);
        res.status(500).send('Connection to Google Drive failed.');
    }
});

export default router;
