import { Router } from 'express';
import { getAttendance, saveAttendance, saveObservation } from '../controllers/attendanceController';
import { roleMiddleware } from '../middleware/authMiddleware';

const router = Router();

// GET attendance: Both ADMIN and STAFF can view attendance records
router.get('/', getAttendance);

// POST attendance / observation: ONLY STAFF can mark or modify attendance records
router.post('/', roleMiddleware(['STAFF']), saveAttendance);
router.post('/observation', roleMiddleware(['STAFF']), saveObservation);

export default router;
