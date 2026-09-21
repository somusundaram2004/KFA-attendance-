import { Router } from 'express';
import { getBatches, createBatch } from '../controllers/batchController';

const router = Router();

router.get('/', getBatches);
router.post('/', createBatch);

export default router;
