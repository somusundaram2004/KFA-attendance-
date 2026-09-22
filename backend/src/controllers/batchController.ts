import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { isValidUUID } from '../utils/uuid';

export const getBatches = async (req: Request, res: Response) => {
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('[BatchController] Error fetching batches:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to fetch batches', error: error.message });
      }

      return res.json({ success: true, batches: data || [] });
    }

    return res.json({ success: true, batches: [] });
  } catch (err: any) {
    console.error('[BatchController] getBatches exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

export const createBatch = async (req: Request, res: Response) => {
  try {
    const { name, description, grade_id, grade_name, is_active, staff_ids, staff_names, schedules } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Batch name is required' });
    }

    if (grade_id && !isValidUUID(grade_id)) {
      return res.status(400).json({ success: false, message: 'Invalid grade_id UUID provided' });
    }

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Omit `id` to allow PostgreSQL DEFAULT uuid_generate_v4() to assign the primary key UUID
      const { data, error } = await supabase
        .from('batches')
        .insert({
          name: name.trim(),
          description: description ? String(description).trim() : '',
          grade_id: grade_id || null,
          grade_name: grade_name || null,
          is_active: is_active !== undefined ? Boolean(is_active) : true,
          staff_ids: staff_ids || [],
          staff_names: staff_names || [],
          schedules: schedules || [],
        })
        .select()
        .single();

      if (error) {
        console.error('[BatchController] Error creating batch in Supabase:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to create batch in database', error: error.message });
      }

      console.log(`[BatchController] Created batch "${data.name}" with generated UUID: ${data.id}`);
      return res.status(201).json({ success: true, batch: data });
    }

    return res.status(400).json({ success: false, message: 'Database connection not configured' });
  } catch (err: any) {
    console.error('[BatchController] createBatch exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

export const updateBatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Batch UUID provided' });
    }

    const updates = { ...req.body };
    delete updates.id;

    if (updates.grade_id && !isValidUUID(updates.grade_id)) {
      return res.status(400).json({ success: false, message: 'Invalid grade_id UUID provided' });
    }

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data, error } = await supabase
        .from('batches')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[BatchController] Error updating batch:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to update batch', error: error.message });
      }

      return res.json({ success: true, batch: data });
    }

    return res.status(400).json({ success: false, message: 'Database connection not configured' });
  } catch (err: any) {
    console.error('[BatchController] updateBatch exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};

export const deleteBatch = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Batch UUID provided' });
    }

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { error } = await supabase.from('batches').delete().eq('id', id);

      if (error) {
        console.error('[BatchController] Error deleting batch:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to delete batch', error: error.message });
      }

      return res.json({ success: true, message: 'Batch deleted successfully' });
    }

    return res.status(400).json({ success: false, message: 'Database connection not configured' });
  } catch (err: any) {
    console.error('[BatchController] deleteBatch exception:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
};
