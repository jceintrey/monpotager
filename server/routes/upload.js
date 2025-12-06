import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// POST - Upload image (base64)
router.post('/', async (req, res, next) => {
  try {
    const { image, filename } = req.body;

    if (!image || !filename) {
      return res.status(400).json({ error: 'Image and filename are required' });
    }

    // Decode base64 image
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(filename);
    const uniqueFilename = `${timestamp}-${filename}`;
    const uploadPath = path.join(__dirname, '../../uploads', uniqueFilename);

    // Ensure uploads directory exists
    await fs.mkdir(path.dirname(uploadPath), { recursive: true });

    // Save file
    await fs.writeFile(uploadPath, buffer);

    // Return URL
    const url = `/uploads/${uniqueFilename}`;
    res.json({ url });
  } catch (error) {
    next(error);
  }
});

export default router;
