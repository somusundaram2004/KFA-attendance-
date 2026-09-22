import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { isValidUUID } from '../utils/uuid';

export const getStudents = async (req: Request, res: Response) => {
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('[StudentController] Error fetching students:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch students', error: error.message });
      }

      return res.json({ success: true, students: data || [] });
    }

    return res.json({ success: true, students: [] });
  } catch (err: any) {
    console.error('[StudentController] getStudents exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

export const createStudent = async (req: Request, res: Response) => {
  try {
    const {
      student_id,
      full_name,
      phone,
      email,
      photo_url,
      status,
      joining_date,
      current_grade_id,
      current_grade_name,
      current_batch_id,
      current_batch_name,
    } = req.body || {};

    if (!full_name || typeof full_name !== 'string' || !full_name.trim()) {
      return res.status(400).json({ success: false, message: 'Student full name is required' });
    }

    if (current_grade_id && !isValidUUID(current_grade_id)) {
      return res.status(400).json({ success: false, message: 'Invalid current_grade_id UUID provided' });
    }

    if (current_batch_id && !isValidUUID(current_batch_id)) {
      return res.status(400).json({ success: false, message: 'Invalid current_batch_id UUID provided' });
    }

    const generatedStudentId = student_id || `KFA-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Omit `id` so PostgreSQL DEFAULT uuid_generate_v4() assigns primary key UUID
      const { data, error } = await supabase
        .from('students')
        .insert({
          student_id: generatedStudentId,
          full_name: full_name.trim(),
          phone: phone || null,
          email: email || null,
          photo_url: photo_url || null,
          status: status || 'ACTIVE',
          joining_date: joining_date || new Date().toISOString().split('T')[0],
          current_grade_id: current_grade_id || null,
          current_grade_name: current_grade_name || null,
          current_batch_id: current_batch_id || null,
          current_batch_name: current_batch_name || null,
        })
        .select()
        .single();

      if (error) {
        console.error('[StudentController] Error creating student in Supabase:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to create student in database', error: error.message });
      }

      console.log(`[StudentController] Created student "${data.full_name}" with generated UUID: ${data.id}`);
      return res.status(201).json({ success: true, student: data });
    }

    return res.status(400).json({ success: false, message: 'Database connection not configured' });
  } catch (err: any) {
    console.error('[StudentController] createStudent exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Student UUID provided' });
    }

    const updates = { ...req.body };
    delete updates.id;

    if (updates.current_grade_id && !isValidUUID(updates.current_grade_id)) {
      return res.status(400).json({ success: false, message: 'Invalid current_grade_id UUID provided' });
    }

    if (updates.current_batch_id && !isValidUUID(updates.current_batch_id)) {
      return res.status(400).json({ success: false, message: 'Invalid current_batch_id UUID provided' });
    }

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[StudentController] Error updating student:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to update student', error: error.message });
      }

      return res.json({ success: true, student: data });
    }

    return res.status(400).json({ success: false, message: 'Database connection not configured' });
  } catch (err: any) {
    console.error('[StudentController] updateStudent exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Student UUID provided' });
    }

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { error } = await supabase.from('students').delete().eq('id', id);

      if (error) {
        console.error('[StudentController] Error deleting student:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to delete student', error: error.message });
      }

      return res.json({ success: true, message: 'Student deleted successfully' });
    }

    return res.status(400).json({ success: false, message: 'Database connection not configured' });
  } catch (err: any) {
    console.error('[StudentController] deleteStudent exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};
