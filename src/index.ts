import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import driveRoutes from './driveRoutes'; // Import the routes module

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON request bodies

// Use the routes from the separate file
app.use('/drive', driveRoutes); // Prefix all routes with '/drive'

// Test the server connection (basic check)
app.get('/test-connection', (req: Request, res: Response) => {
    res.status(200).send('Connection to Google Drive successful!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
