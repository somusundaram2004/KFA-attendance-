import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import securityRoutes from './routes/securityRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import studentRoutes from './routes/studentRoutes';
import staffRoutes from './routes/staffRoutes';
import batchRoutes from './routes/batchRoutes';
import gradeRoutes from './routes/gradeRoutes';
import { authenticate, verifyHandshake, authorizeStaffBatch } from './middleware/authMiddleware';

import notificationRoutes from './routes/notificationRoutes';

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, 'http://localhost:8081', 'http://localhost:3000', 'http://localhost:19006']
  : '*';

app.use(cors({
  origin: allowedOrigins,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-handshake-token', 'x-handshake-key'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'KFA Attendance Backend API', timestamp: new Date().toISOString() });
});

// Push Notification Routes
app.use('/api/notifications', notificationRoutes);

// Authentication Routes (Public + Rate Limited)
app.use('/api/auth', authRoutes);

// Security Handshake Routes (Key-1 and Key-2 challenge generation)
app.use('/api/security', securityRoutes);

// Protected API Pipeline: authenticate -> verifyHandshake -> authorizeStaffBatch -> Controller
app.use('/api/attendance', authenticate, verifyHandshake, authorizeStaffBatch, attendanceRoutes);
app.use('/api/students', authenticate, verifyHandshake, authorizeStaffBatch, studentRoutes);
app.use('/api/staff', authenticate, verifyHandshake, staffRoutes);
app.use('/api/batches', authenticate, verifyHandshake, authorizeStaffBatch, batchRoutes);
app.use('/api/grades', authenticate, verifyHandshake, gradeRoutes);

export default app;
