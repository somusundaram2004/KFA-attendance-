import { Router } from 'express';
import { getStaffList, createStaff, updateStaffStatus } from '../controllers/staffController';

const router = Router();

router.get('/', getStaffList);
router.post('/', createStaff);
router.put('/:id', updateStaffStatus);

export default router;
