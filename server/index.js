import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import vegetablesRouter from './routes/vegetables.js';
import harvestsRouter from './routes/harvests.js';
import climatesRouter from './routes/climates.js';
import sowingTypesRouter from './routes/sowing-types.js';
import calendarRouter from './routes/calendar.js';
import userSettingsRouter from './routes/user-settings.js';
import uploadRouter from './routes/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/vegetables', vegetablesRouter);
app.use('/api/harvests', harvestsRouter);
app.use('/api/climates', climatesRouter);
app.use('/api/sowing-types', sowingTypesRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/user-settings', userSettingsRouter);
app.use('/api/upload', uploadRouter);

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve Angular app
app.use(express.static(path.join(__dirname, '../dist')));

// All other routes serve index.html (Angular routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});
