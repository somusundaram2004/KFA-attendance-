import dotenv from 'dotenv';

// Load environment variables before importing app or other modules
dotenv.config();

import app from './app';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 KFA Attendance Backend Server listening on port ${PORT}`);
});

