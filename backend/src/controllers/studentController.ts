import { Request, Response } from 'express';

export const getStudents = async (req: Request, res: Response) => {
  res.json({ success: true, students: [] });
};

export const createStudent = async (req: Request, res: Response) => {
  const studentData = req.body;
  res.json({ success: true, student: { id: `st-${Date.now()}`, ...studentData } });
};
