import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import multer from 'multer';
import fs from 'fs';

const router = Router();
const KEY_FILE_PATH = './service-account.json'; // Replace with your path

// Google Drive Authentication
const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: ['https://www.googleapis.com/auth/drive'],
});
const driveClient = google.drive({ version: 'v3', auth });

// Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// **1. Test Connection to Google Drive**
router.get('/test-connection', async (req: Request, res: Response) => {
    try {
        const filesResponse = await driveClient.files.list({
            pageSize: 1,
            fields: 'files(id, name)',
        });

        if (filesResponse.data.files?.length) {
            res.status(200).send('Connection to Google Drive successful!');
        } else {
            res.status(200).send('Connected, but no files found.');
        }
    } catch (error) {
        console.error('Connection test failed:', error);
        res.status(500).send('Connection to Google Drive failed.');
    }
});

// **2. Get Folders and Pictures**
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

        res.status(200).json({
            folders: foldersResponse.data.files,
            images: imagesResponse.data.files,
        });
    } catch (error) {
        console.error('Error fetching folders and pictures:', error);
        res.status(500).send('Failed to fetch folders and images.');
    }
});

// **3. Upload a File**
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileMetadata = { name: req.file.originalname };
        const media = { mimeType: req.file.mimetype, body: fs.createReadStream(req.file.path) };

        const file = await driveClient.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id',
        });

        res.status(200).json({ message: 'File uploaded successfully!', fileId: file.data.id });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send('File upload failed.');
    }
});

// **4. Download a File**
router.get('/download/:fileId', async (req: Request, res: Response) => {
    try {
        const fileId = req.params.fileId;

        const response = await driveClient.files.get(
            { fileId, alt: 'media' },
            { responseType: 'stream' }
        );

        response.data
            .on('end', () => console.log('File download completed.'))
            .on('error', (error) => console.error('Error downloading file:', error))
            .pipe(res);
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).send('Failed to download the file.');
    }
});

export default router;
