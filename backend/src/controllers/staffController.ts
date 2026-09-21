import { Request, Response } from 'express';

export const getStaffList = async (req: Request, res: Response) => {
  res.json({ success: true, staff: [] });
};

export const createStaff = async (req: Request, res: Response) => {
  const staffData = req.body;
  res.json({ success: true, staff: { id: `u-staff-${Date.now()}`, ...staffData } });
};
