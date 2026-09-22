import { Router } from 'express';
import {
  getAttendance,
  saveAttendance,
  saveObservation,
  getObservations,
  getClassSessions,
  createClassSession,
} from '../controllers/attendanceController';

const router = Router();

router.get('/', getAttendance);
router.post('/', saveAttendance);

router.get('/observations', getObservations);
router.post('/observation', saveObservation);

router.get('/sessions', getClassSessions);
router.post('/session', createClassSession);

export default router;
