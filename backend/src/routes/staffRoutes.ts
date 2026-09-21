import { Router } from 'express';
import { getStaffList, createStaff } from '../controllers/staffController';

const router = Router();

router.get('/', getStaffList);
router.post('/', createStaff);

export default router;
