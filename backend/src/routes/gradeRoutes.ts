import { Router } from 'express';
import { getGrades, createGrade, updateGrade, deleteGrade } from '../controllers/gradeController';

const router = Router();

router.get('/', getGrades);
router.post('/', createGrade);
router.put('/:id', updateGrade);
router.delete('/:id', deleteGrade);

export default router;
