import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { isValidUUID } from '../utils/uuid';

export const getStaffList = async (req: Request, res: Response) => {
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('[StaffController] Error fetching staff:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch staff', error: error.message });
      }

      return res.json({ success: true, staff: data || [] });
    }

    return res.json({ success: true, staff: [] });
  } catch (err: any) {
    console.error('[StaffController] getStaffList exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

export const createStaff = async (req: Request, res: Response) => {
  try {
    const { full_name, email, role, status, phone } = req.body || {};

    if (!full_name || !email) {
      return res.status(400).json({ success: false, message: 'Full name and email are required' });
    }

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Omit `id` to allow PostgreSQL DEFAULT uuid_generate_v4() to assign the primary key UUID
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          full_name: String(full_name).trim(),
          email: String(email).trim().toLowerCase(),
          role: role === 'ADMIN' ? 'ADMIN' : 'STAFF',
          status: status || 'ACTIVE',
          phone: phone || null,
        })
        .select()
        .single();

      if (error) {
        console.error('[StaffController] Error creating staff in Supabase:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to create staff profile', error: error.message });
      }

      console.log(`[StaffController] Created staff profile "${data.full_name}" with generated UUID: ${data.id}`);
      return res.status(201).json({ success: true, staff: data });
    }

    return res.status(400).json({ success: false, message: 'Database connection not configured' });
  } catch (err: any) {
    console.error('[StaffController] createStaff exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

export const updateStaffStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Staff UUID provided' });
    }

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[StaffController] Error updating staff:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to update staff status', error: error.message });
      }

      return res.json({ success: true, staff: data });
    }

    return res.status(400).json({ success: false, message: 'Database connection not configured' });
  } catch (err: any) {
    console.error('[StaffController] updateStaffStatus exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};
