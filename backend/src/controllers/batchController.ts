import { Request, Response } from 'express';

export const getBatches = async (req: Request, res: Response) => {
  res.json({ success: true, batches: [] });
};

export const createBatch = async (req: Request, res: Response) => {
  const batchData = req.body;
  res.json({ success: true, batch: { id: `b-${Date.now()}`, grade_name: 'Mixed Grades', ...batchData } });
};
