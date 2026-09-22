import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { isValidUUID } from '../utils/uuid';

export const getAttendance = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.query;

    if (sessionId && !isValidUUID(String(sessionId))) {
      return res.status(400).json({ success: false, message: 'Invalid class_session_id UUID' });
    }

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      let query = supabase.from('attendance').select('*, student:students(full_name, student_id)');
      if (sessionId) {
        query = query.eq('class_session_id', String(sessionId));
      }
      const { data, error } = await query;

      if (error) {
        console.error('[AttendanceController] Error fetching attendance:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch attendance records', error: error.message });
      }

      return res.json({ success: true, records: data || [] });
    }

    return res.json({ success: true, records: [] });
  } catch (err: any) {
    console.error('[AttendanceController] getAttendance exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

export const saveAttendance = async (req: Request, res: Response) => {
  try {
    const { sessionId, records, marked_by } = req.body || {};

    if (!sessionId || !isValidUUID(String(sessionId))) {
      return res.status(400).json({ success: false, message: 'Valid class_session_id UUID is required' });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'No attendance records provided' });
    }

    // Validate student_id UUIDs
    for (const rec of records) {
      if (!rec.student_id || !isValidUUID(String(rec.student_id))) {
        return res.status(400).json({ success: false, message: `Invalid student_id UUID in attendance payload: ${rec.student_id}` });
      }
    }

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const payload = records.map((rec: any) => ({
        class_session_id: String(sessionId),
        student_id: String(rec.student_id),
        student_name: rec.student_name || null,
        student_code: rec.student_code || null,
        status: rec.status,
        notes: rec.notes || '',
        marked_by: marked_by && isValidUUID(String(marked_by)) ? String(marked_by) : null,
      }));

      const { data, error } = await supabase
        .from('attendance')
        .upsert(payload, { onConflict: 'class_session_id,student_id' })
        .select();

      if (error) {
        console.error('[AttendanceController] Error saving attendance:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to save attendance in database', error: error.message });
      }

      return res.json({ success: true, message: 'Attendance recorded successfully', count: data?.length || 0, records: data });
    }

    return res.status(400).json({ success: false, message: 'Database connection not configured' });
  } catch (err: any) {
    console.error('[AttendanceController] saveAttendance exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

export const saveObservation = async (req: Request, res: Response) => {
  try {
    const { student_id, student_name, batch_id, batch_name, category, description, staff_id, staff_name, attendance_date } = req.body || {};

    if (!student_id || !isValidUUID(String(student_id))) {
      return res.status(400).json({ success: false, message: 'Valid student_id UUID is required for observation' });
    }

    if (batch_id && !isValidUUID(String(batch_id))) {
      return res.status(400).json({ success: false, message: 'Invalid batch_id UUID provided' });
    }

    if (!category || !description) {
      return res.status(400).json({ success: false, message: 'Category and description are required' });
    }

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Omit `id` so PostgreSQL DEFAULT uuid_generate_v4() assigns primary key UUID
      const { data, error } = await supabase
        .from('observations')
        .insert({
          student_id: String(student_id),
          student_name: student_name || null,
          batch_id: batch_id && isValidUUID(String(batch_id)) ? String(batch_id) : null,
          batch_name: batch_name || null,
          attendance_date: attendance_date || new Date().toISOString().split('T')[0],
          staff_id: staff_id && isValidUUID(String(staff_id)) ? String(staff_id) : null,
          staff_name: staff_name || null,
          category: String(category).trim(),
          description: String(description).trim(),
        })
        .select()
        .single();

      if (error) {
        console.error('[AttendanceController] Error saving observation:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to save observation', error: error.message });
      }

      console.log(`[AttendanceController] Saved observation for student ${student_id} with generated UUID: ${data.id}`);
      return res.status(201).json({ success: true, observation: data });
    }

    return res.status(400).json({ success: false, message: 'Database connection not configured' });
  } catch (err: any) {
    console.error('[AttendanceController] saveObservation exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

export const getObservations = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.query;

    if (studentId && !isValidUUID(String(studentId))) {
      return res.status(400).json({ success: false, message: 'Invalid student_id UUID' });
    }

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      let query = supabase.from('observations').select('*').order('created_at', { ascending: false });
      if (studentId) {
        query = query.eq('student_id', String(studentId));
      }
      const { data, error } = await query;

      if (error) {
        console.error('[AttendanceController] Error fetching observations:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch observations', error: error.message });
      }

      return res.json({ success: true, observations: data || [] });
    }

    return res.json({ success: true, observations: [] });
  } catch (err: any) {
    console.error('[AttendanceController] getObservations exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

export const getClassSessions = async (req: Request, res: Response) => {
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabase
        .from('class_sessions')
        .select('*')
        .order('session_date', { ascending: false });

      if (error) {
        console.error('[AttendanceController] Error fetching class sessions:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch class sessions', error: error.message });
      }

      return res.json({ success: true, sessions: data || [] });
    }

    return res.json({ success: true, sessions: [] });
  } catch (err: any) {
    console.error('[AttendanceController] getClassSessions exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

export const createClassSession = async (req: Request, res: Response) => {
  try {
    const { batch_id, batch_name, grade_id, grade_name, session_date, start_time, end_time, class_type, status, cancel_reason, created_by } = req.body || {};

    if (batch_id && !isValidUUID(String(batch_id))) {
      return res.status(400).json({ success: false, message: 'Invalid batch_id UUID provided' });
    }

    if (grade_id && !isValidUUID(String(grade_id))) {
      return res.status(400).json({ success: false, message: 'Invalid grade_id UUID provided' });
    }

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Omit `id` so PostgreSQL DEFAULT uuid_generate_v4() assigns primary key UUID
      const { data, error } = await supabase
        .from('class_sessions')
        .insert({
          batch_id: batch_id || null,
          batch_name: batch_name || null,
          grade_id: grade_id || null,
          grade_name: grade_name || null,
          session_date: session_date || new Date().toISOString().split('T')[0],
          start_time: start_time || '09:00',
          end_time: end_time || '10:00',
          class_type: class_type || 'REGULAR',
          status: status || 'SCHEDULED',
          cancel_reason: cancel_reason || null,
          created_by: created_by && isValidUUID(String(created_by)) ? String(created_by) : null,
        })
        .select()
        .single();

      if (error) {
        console.error('[AttendanceController] Error creating class session:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to create class session', error: error.message });
      }

      console.log(`[AttendanceController] Created class session with generated UUID: ${data.id}`);
      return res.status(201).json({ success: true, session: data });
    }

    return res.status(400).json({ success: false, message: 'Database connection not configured' });
  } catch (err: any) {
    console.error('[AttendanceController] createClassSession exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};
