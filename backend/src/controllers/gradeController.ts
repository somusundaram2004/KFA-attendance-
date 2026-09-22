import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { isValidUUID } from '../utils/uuid';

export const getGrades = async (req: Request, res: Response) => {
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('[GradeController] Error fetching grades from Supabase:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch grades', error: error.message });
      }

      return res.json({ success: true, grades: data || [] });
    }

    return res.json({ success: true, grades: [] });
  } catch (err: any) {
    console.error('[GradeController] getGrades exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

export const createGrade = async (req: Request, res: Response) => {
  try {
    const { name, description, display_order, is_active } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Grade name is required' });
    }

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Allow PostgreSQL DEFAULT uuid_generate_v4() to generate the UUID primary key
      const { data, error } = await supabase
        .from('grades')
        .insert({
          name: name.trim(),
          description: description ? String(description).trim() : '',
          display_order: typeof display_order === 'number' ? display_order : 1,
          is_active: is_active !== undefined ? Boolean(is_active) : true,
        })
        .select()
        .single();

      if (error) {
        console.error('[GradeController] Error creating grade in Supabase:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to create grade in database', error: error.message });
      }

      console.log(`[GradeController] Created grade "${data.name}" with generated UUID: ${data.id}`);
      return res.status(201).json({ success: true, grade: data });
    }

    return res.status(400).json({ success: false, message: 'Database connection not configured' });
  } catch (err: any) {
    console.error('[GradeController] createGrade exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

export const updateGrade = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Grade UUID provided' });
    }

    const updates = { ...req.body };
    delete updates.id; // Do not mutate primary key

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabase
        .from('grades')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[GradeController] Error updating grade:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to update grade', error: error.message });
      }

      return res.json({ success: true, grade: data });
    }

    return res.status(400).json({ success: false, message: 'Database connection not configured' });
  } catch (err: any) {
    console.error('[GradeController] updateGrade exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

export const deleteGrade = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Grade UUID provided' });
    }

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { error } = await supabase.from('grades').delete().eq('id', id);

      if (error) {
        console.error('[GradeController] Error deleting grade:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to delete grade', error: error.message });
      }

      return res.json({ success: true, message: 'Grade deleted successfully' });
    }

    return res.status(400).json({ success: false, message: 'Database connection not configured' });
  } catch (err: any) {
    console.error('[GradeController] deleteGrade exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};
