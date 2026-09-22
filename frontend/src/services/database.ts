import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Profile,
  Grade,
  Student,
  StudentGradeHistory,
  Batch,
  BatchSchedule,
  StudentBatchHistory,
  ClassSession,
  AttendanceRecord,
  AttendanceAudit,
  FilterOptions,
  ReportSummary,
  UserRole,
  AttendanceStatus,
  ClassStatus
} from '../types';
import { getTodayISODate } from '../utils/date';
import { isValidUUID } from '../utils/uuid';

// Initial Mock Seed Data for standalone demo mode
let mockProfiles: Profile[] = [
  {
    id: 'u-admin-001',
    full_name: 'Dr. Ramesh Kumar (Admin)',
    email: 'admin@kfa.edu',
    role: 'ADMIN',
    status: 'ACTIVE',
    phone: '+91 98765 43210',
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'u-staff-001',
    full_name: 'Mrs. Priya Sharma (Staff)',
    email: 'staff.priya@kfa.edu',
    role: 'STAFF',
    status: 'ACTIVE',
    phone: '+91 98765 12345',
    created_at: '2026-01-15T00:00:00Z',
  },
  {
    id: 'u-staff-002',
    full_name: 'Mr. Suresh Verma (Staff)',
    email: 'staff.suresh@kfa.edu',
    role: 'STAFF',
    status: 'ACTIVE',
    phone: '+91 98765 67890',
    created_at: '2026-02-01T00:00:00Z',
  }
];

let mockGrades: Grade[] = [
  { id: 'g-pre', name: 'Pre Grade', description: 'Foundation level', display_order: 1, is_active: true },
  { id: 'g-1', name: 'Grade 1', description: 'Primary Level 1', display_order: 2, is_active: true },
  { id: 'g-2', name: 'Grade 2', description: 'Primary Level 2', display_order: 3, is_active: true },
  { id: 'g-3', name: 'Grade 3', description: 'Primary Level 3', display_order: 4, is_active: true },
  { id: 'g-4', name: 'Grade 4', description: 'Intermediate Level 4', display_order: 5, is_active: true },
  { id: 'g-5', name: 'Grade 5', description: 'Intermediate Level 5', display_order: 6, is_active: true },
  { id: 'g-6', name: 'Grade 6', description: 'Advanced Level 6', display_order: 7, is_active: true },
  { id: 'g-7', name: 'Grade 7', description: 'Senior Level 7', display_order: 8, is_active: true },
];

let mockBatches: Batch[] = [
  {
    id: 'b-101',
    name: 'Batch 1 — Morning Session',
    description: 'Mon & Wed Morning Session (5:00 PM - 6:00 PM)',
    grade_id: undefined,
    grade_name: 'Mixed Grades',
    is_active: true,
    staff_ids: ['u-staff-001'],
    staff_names: ['Mrs. Priya Sharma (Staff)'],
    schedules: [
      { id: 'sch-1', batch_id: 'b-101', day_of_week: 1, start_time: '17:00', end_time: '18:00' }, // Mon
      { id: 'sch-2', batch_id: 'b-101', day_of_week: 3, start_time: '17:00', end_time: '18:00' }  // Wed
    ]
  },
  {
    id: 'b-102',
    name: 'Batch 2 — Evening Session',
    description: 'Mon & Wed Evening Session (6:00 PM - 7:00 PM)',
    grade_id: undefined,
    grade_name: 'Mixed Grades',
    is_active: true,
    staff_ids: ['u-staff-001'],
    staff_names: ['Mrs. Priya Sharma (Staff)'],
    schedules: [
      { id: 'sch-3', batch_id: 'b-102', day_of_week: 1, start_time: '18:00', end_time: '19:00' },
      { id: 'sch-4', batch_id: 'b-102', day_of_week: 3, start_time: '18:00', end_time: '19:00' }
    ]
  },
  {
    id: 'b-103',
    name: 'Batch 3 — Advanced Session',
    description: 'Tue & Thu Session (6:00 PM - 7:00 PM)',
    grade_id: undefined,
    grade_name: 'Mixed Grades',
    is_active: true,
    staff_ids: ['u-staff-001'],
    staff_names: ['Mrs. Priya Sharma (Staff)'],
    schedules: [
      { id: 'sch-5', batch_id: 'b-103', day_of_week: 2, start_time: '18:00', end_time: '19:00' },
      { id: 'sch-6', batch_id: 'b-103', day_of_week: 4, start_time: '18:00', end_time: '19:00' }
    ]
  }
];

let mockStudents: Student[] = [
  {
    id: 'st-001',
    student_id: 'KFA-2026-001',
    full_name: 'Arun Kumar',
    phone: '+91 98400 11111',
    email: 'arun@example.com',
    status: 'ACTIVE',
    joining_date: '2026-01-10',
    current_grade_id: 'g-2',
    current_grade_name: 'Grade 2',
    current_batch_id: 'b-102',
    current_batch_name: 'Grade 2 — Evening Batch',
    attendance_rate: 92.5,
  },
  {
    id: 'st-002',
    student_id: 'KFA-2026-002',
    full_name: 'Priya Sundaram',
    phone: '+91 98400 22222',
    email: 'priya.s@example.com',
    status: 'ACTIVE',
    joining_date: '2026-01-12',
    current_grade_id: 'g-2',
    current_grade_name: 'Grade 2',
    current_batch_id: 'b-102',
    current_batch_name: 'Grade 2 — Evening Batch',
    attendance_rate: 100.0,
  },
  {
    id: 'st-003',
    student_id: 'KFA-2026-003',
    full_name: 'Rahul Dravid',
    phone: '+91 98400 33333',
    email: 'rahul@example.com',
    status: 'ACTIVE',
    joining_date: '2026-02-01',
    current_grade_id: 'g-2',
    current_grade_name: 'Grade 2',
    current_batch_id: 'b-102',
    current_batch_name: 'Grade 2 — Evening Batch',
    attendance_rate: 85.0,
  },
  {
    id: 'st-004',
    student_id: 'KFA-2026-004',
    full_name: 'Meena Krishnan',
    phone: '+91 98400 44444',
    email: 'meena@example.com',
    status: 'ACTIVE',
    joining_date: '2026-02-05',
    current_grade_id: 'g-2',
    current_grade_name: 'Grade 2',
    current_batch_id: 'b-102',
    current_batch_name: 'Grade 2 — Evening Batch',
    attendance_rate: 95.0,
  },
  {
    id: 'st-005',
    student_id: 'KFA-2026-005',
    full_name: 'Karthik Raja',
    phone: '+91 98400 55555',
    email: 'karthik@example.com',
    status: 'ACTIVE',
    joining_date: '2026-02-10',
    current_grade_id: 'g-1',
    current_grade_name: 'Grade 1',
    current_batch_id: 'b-101',
    current_batch_name: 'Grade 1 — Morning Batch',
    attendance_rate: 88.0,
  },
  {
    id: 'st-006',
    student_id: 'KFA-2026-006',
    full_name: 'Divya Natesan',
    phone: '+91 98400 66666',
    email: 'divya@example.com',
    status: 'ACTIVE',
    joining_date: '2026-02-15',
    current_grade_id: 'g-1',
    current_grade_name: 'Grade 1',
    current_batch_id: 'b-101',
    current_batch_name: 'Grade 1 — Morning Batch',
    attendance_rate: 96.0,
  }
];

let mockStudentGradeHistory: StudentGradeHistory[] = [
  { id: 'sgh-1', student_id: 'st-001', grade_id: 'g-pre', grade_name: 'Pre Grade', start_date: '2025-06-01', end_date: '2026-03-31', is_current: false },
  { id: 'sgh-2', student_id: 'st-001', grade_id: 'g-1', grade_name: 'Grade 1', start_date: '2026-04-01', end_date: '2026-08-31', is_current: false },
  { id: 'sgh-3', student_id: 'st-001', grade_id: 'g-2', grade_name: 'Grade 2', start_date: '2026-09-01', end_date: undefined, is_current: true },
  { id: 'sgh-4', student_id: 'st-002', grade_id: 'g-2', grade_name: 'Grade 2', start_date: '2026-01-12', end_date: undefined, is_current: true },
  { id: 'sgh-5', student_id: 'st-003', grade_id: 'g-2', grade_name: 'Grade 2', start_date: '2026-02-01', end_date: undefined, is_current: true },
];

let mockStudentBatchHistory: StudentBatchHistory[] = [
  { id: 'sbh-1', student_id: 'st-001', batch_id: 'b-101', batch_name: 'Grade 1 — Morning Batch', start_date: '2026-01-10', end_date: '2026-08-31', is_current: false },
  { id: 'sbh-2', student_id: 'st-001', batch_id: 'b-102', batch_name: 'Grade 2 — Evening Batch', start_date: '2026-09-01', end_date: undefined, is_current: true },
  { id: 'sbh-3', student_id: 'st-002', batch_id: 'b-102', batch_name: 'Grade 2 — Evening Batch', start_date: '2026-01-12', end_date: undefined, is_current: true },
];

// Sessions & Attendance
const today = getTodayISODate();
let mockSessions: ClassSession[] = [
  {
    id: 'cs-001',
    batch_id: 'b-101',
    batch_name: 'Grade 1 — Morning Batch',
    grade_id: 'g-1',
    grade_name: 'Grade 1',
    session_date: today,
    start_time: '17:00',
    end_time: '18:00',
    class_type: 'REGULAR',
    status: 'COMPLETED',
    created_by: 'u-admin-001',
    attendance_count: { present: 2, absent: 0, leave: 0, late: 0, total: 2 }
  },
  {
    id: 'cs-002',
    batch_id: 'b-102',
    batch_name: 'Grade 2 — Evening Batch',
    grade_id: 'g-2',
    grade_name: 'Grade 2',
    session_date: today,
    start_time: '18:00',
    end_time: '19:00',
    class_type: 'REGULAR',
    status: 'SCHEDULED',
    created_by: 'u-admin-001',
    attendance_count: { present: 0, absent: 0, leave: 0, late: 0, total: 4 }
  },
  {
    id: 'cs-003',
    batch_id: 'b-102',
    batch_name: 'Grade 2 — Evening Batch',
    grade_id: 'g-2',
    grade_name: 'Grade 2',
    session_date: '2026-09-14',
    start_time: '18:00',
    end_time: '19:00',
    class_type: 'REGULAR',
    status: 'CANCELLED',
    cancel_reason: 'Teacher Unavailable (Heavy Rain)',
    created_by: 'u-admin-001'
  },
  {
    id: 'cs-004',
    batch_id: 'b-102',
    batch_name: 'Grade 2 — Evening Batch',
    grade_id: 'g-2',
    grade_name: 'Grade 2',
    session_date: '2026-09-18',
    start_time: '17:00',
    end_time: '18:00',
    class_type: 'COMPENSATION',
    status: 'SCHEDULED',
    original_session_id: 'cs-003',
    original_session_date: '2026-09-14',
    created_by: 'u-admin-001'
  }
];

let mockAttendance: AttendanceRecord[] = [
  { id: 'att-1', class_session_id: 'cs-001', student_id: 'st-005', student_name: 'Karthik Raja', status: 'PRESENT', marked_by: 'u-staff-001' },
  { id: 'att-2', class_session_id: 'cs-001', student_id: 'st-006', student_name: 'Divya Natesan', status: 'PRESENT', marked_by: 'u-staff-001' },
];

let mockAuditLogs: AttendanceAudit[] = [
  {
    id: 'aud-1',
    class_session_id: 'cs-001',
    student_id: 'st-005',
    student_name: 'Karthik Raja',
    previous_status: undefined,
    new_status: 'PRESENT',
    changed_by: 'u-staff-001',
    changed_by_name: 'Mrs. Priya Sharma (Staff)',
    reason: 'Initial Attendance Submission',
    created_at: new Date().toISOString()
  }
];

// ==========================================
// DATABASE SERVICE METHODS
// ==========================================
export const DatabaseService = {
  // PROFILES
  async getProfile(userId: string): Promise<Profile | null> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) return null;
      return data as Profile;
    }
    return mockProfiles.find(p => p.id === userId || p.email === userId) || mockProfiles[0];
  },

  async getAllProfiles(): Promise<Profile[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('profiles').select('*').order('full_name');
      return (data || []) as Profile[];
    }
    return [...mockProfiles];
  },

  async createProfile(profile: Partial<Profile>): Promise<Profile> {
    const isProdUUID = profile.id && isValidUUID(profile.id);
    const insertPayload: any = {
      full_name: profile.full_name || 'Staff User',
      email: profile.email || 'staff@kfa.edu',
      role: profile.role || 'STAFF',
      status: profile.status || 'ACTIVE',
      phone: profile.phone || '',
    };
    if (isProdUUID) {
      insertPayload.id = profile.id;
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').insert(insertPayload).select().single();
      if (error) {
        console.error('[DatabaseService] createProfile error:', error.message);
        throw new Error(`Failed to create profile: ${error.message}`);
      }
      return data as Profile;
    }

    const newP: Profile = {
      id: profile.id || `u-${Date.now()}`,
      ...insertPayload,
      created_at: new Date().toISOString()
    };
    mockProfiles.push(newP);
    return newP;
  },

  async updateProfileStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<void> {
    if (!isValidUUID(id) && isSupabaseConfigured) {
      console.warn('[DatabaseService] updateProfileStatus: Skipping DB update for invalid UUID:', id);
      return;
    }
    if (isSupabaseConfigured) {
      await supabase.from('profiles').update({ status }).eq('id', id);
      return;
    }
    const idx = mockProfiles.findIndex(p => p.id === id);
    if (idx !== -1) mockProfiles[idx].status = status;
  },

  // GRADES
  async getGrades(): Promise<Grade[]> {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('grades').select('*').order('display_order');
      if (error) {
        console.error('[DatabaseService] getGrades error:', error.message);
        return [...mockGrades].sort((a, b) => a.display_order - b.display_order);
      }
      return (data || []) as Grade[];
    }
    return [...mockGrades].sort((a, b) => a.display_order - b.display_order);
  },

  async createGrade(grade: Partial<Grade>): Promise<Grade> {
    if (isSupabaseConfigured) {
      // Omit `id` so PostgreSQL DEFAULT uuid_generate_v4() assigns primary key UUID
      const { data, error } = await supabase
        .from('grades')
        .insert({
          name: grade.name || 'New Grade',
          description: grade.description || '',
          display_order: grade.display_order || mockGrades.length + 1,
          is_active: grade.is_active !== undefined ? grade.is_active : true,
        })
        .select()
        .single();

      if (error) {
        console.error('[DatabaseService] createGrade error:', error.message);
        throw new Error(`Failed to create grade: ${error.message}`);
      }
      console.log(`[DatabaseService] Successfully created Grade in Supabase with UUID: ${data.id}`);
      return data as Grade;
    }

    const newG: Grade = {
      id: `g-${Date.now()}`,
      name: grade.name || 'New Grade',
      description: grade.description || '',
      display_order: grade.display_order || mockGrades.length + 1,
      is_active: true
    };
    mockGrades.push(newG);
    return newG;
  },

  async updateGrade(id: string, updates: Partial<Grade>): Promise<void> {
    if (isSupabaseConfigured) {
      if (!isValidUUID(id)) {
        console.warn('[DatabaseService] updateGrade: Skipping DB update for non-UUID id:', id);
        return;
      }
      const updateData = { ...updates };
      delete updateData.id;
      const { error } = await supabase.from('grades').update(updateData).eq('id', id);
      if (error) console.error('[DatabaseService] updateGrade error:', error.message);
      return;
    }
    const idx = mockGrades.findIndex(g => g.id === id);
    if (idx !== -1) {
      mockGrades[idx] = { ...mockGrades[idx], ...updates };
    }
  },

  // BATCHES
  async getBatches(staffId?: string): Promise<Batch[]> {
    if (isSupabaseConfigured) {
      let query = supabase.from('batches').select('*, grade:grades(name)');
      if (staffId && isValidUUID(staffId)) {
        query = query.eq('batch_staff.staff_id', staffId);
      }
      const { data, error } = await query;
      if (error) {
        console.error('[DatabaseService] getBatches error:', error.message);
        return [...mockBatches];
      }
      return (data || []) as Batch[];
    }
    if (staffId) {
      return mockBatches.filter(b => b.staff_ids?.includes(staffId));
    }
    return [...mockBatches];
  },

  async createBatch(batchData: Partial<Batch>): Promise<Batch> {
    const validGradeId = batchData.grade_id && isValidUUID(batchData.grade_id) ? batchData.grade_id : null;

    if (isSupabaseConfigured) {
      // Omit `id` so PostgreSQL DEFAULT uuid_generate_v4() assigns primary key UUID
      const { data, error } = await supabase
        .from('batches')
        .insert({
          name: batchData.name || 'New Batch',
          description: batchData.description || '',
          grade_id: validGradeId,
          grade_name: batchData.grade_name || null,
          is_active: batchData.is_active !== undefined ? batchData.is_active : true,
          staff_ids: batchData.staff_ids || [],
          staff_names: batchData.staff_names || [],
          schedules: batchData.schedules || [],
        })
        .select()
        .single();

      if (error) {
        console.error('[DatabaseService] createBatch error:', error.message);
        throw new Error(`Failed to create batch: ${error.message}`);
      }
      console.log(`[DatabaseService] Successfully created Batch in Supabase with UUID: ${data.id}`);
      return data as Batch;
    }

    const grade = mockGrades.find(g => g.id === batchData.grade_id);
    const newB: Batch = {
      id: `b-${Date.now()}`,
      name: batchData.name || 'New Batch',
      description: batchData.description || '',
      grade_id: batchData.grade_id,
      grade_name: grade?.name,
      is_active: true,
      staff_ids: batchData.staff_ids || [],
      staff_names: mockProfiles.filter(p => batchData.staff_ids?.includes(p.id)).map(p => p.full_name),
      schedules: batchData.schedules || []
    };
    mockBatches.push(newB);
    return newB;
  },

  // STUDENTS & COMBINED FILTERING
  async getStudents(filters?: FilterOptions): Promise<Student[]> {
    if (isSupabaseConfigured) {
      let query = supabase.from('students').select('*');
      if (filters?.searchQuery) {
        query = query.or(`full_name.ilike.%${filters.searchQuery}%,student_id.ilike.%${filters.searchQuery}%`);
      }
      if (filters?.gradeId && isValidUUID(filters.gradeId)) {
        query = query.eq('current_grade_id', filters.gradeId);
      }
      if (filters?.batchId && isValidUUID(filters.batchId)) {
        query = query.eq('current_batch_id', filters.batchId);
      }
      const { data, error } = await query;
      if (error) {
        console.error('[DatabaseService] getStudents error:', error.message);
        return [...mockStudents];
      }
      return (data || []) as Student[];
    }

    let result = [...mockStudents];

    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(s =>
        s.full_name.toLowerCase().includes(q) ||
        s.student_id.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q))
      );
    }

    if (filters?.gradeId) {
      result = result.filter(s => s.current_grade_id === filters.gradeId);
    }

    if (filters?.batchId) {
      result = result.filter(s => s.current_batch_id === filters.batchId);
    }

    return result;
  },

  async getStudentById(id: string): Promise<{
    student: Student | null;
    gradeHistory: StudentGradeHistory[];
    batchHistory: StudentBatchHistory[];
  }> {
    if (isSupabaseConfigured && isValidUUID(id)) {
      const { data: student } = await supabase.from('students').select('*').eq('id', id).single();
      const { data: gradeHistory } = await supabase.from('student_grades').select('*, grade:grades(name)').eq('student_id', id);
      const { data: batchHistory } = await supabase.from('student_batches').select('*, batch:batches(name)').eq('student_id', id);
      return {
        student: student as Student,
        gradeHistory: (gradeHistory || []) as StudentGradeHistory[],
        batchHistory: (batchHistory || []) as StudentBatchHistory[]
      };
    }

    const student = mockStudents.find(s => s.id === id) || null;
    const gradeHistory = mockStudentGradeHistory.filter(gh => gh.student_id === id);
    const batchHistory = mockStudentBatchHistory.filter(bh => bh.student_id === id);
    return { student, gradeHistory, batchHistory };
  },

  async createStudent(studentData: Partial<Student>, gradeId?: string, batchId?: string): Promise<Student> {
    const validGradeId = gradeId && isValidUUID(gradeId) ? gradeId : null;
    const validBatchId = batchId && isValidUUID(batchId) ? batchId : null;

    if (isSupabaseConfigured) {
      // Omit `id` so PostgreSQL DEFAULT uuid_generate_v4() assigns primary key UUID
      const { data, error } = await supabase
        .from('students')
        .insert({
          student_id: studentData.student_id || `KFA-2026-${Math.floor(100 + Math.random() * 900)}`,
          full_name: studentData.full_name || 'New Student',
          phone: studentData.phone || '',
          email: studentData.email || '',
          photo_url: studentData.photo_url || null,
          status: 'ACTIVE',
          joining_date: studentData.joining_date || getTodayISODate(),
          current_grade_id: validGradeId,
          current_grade_name: studentData.current_grade_name || null,
          current_batch_id: validBatchId,
          current_batch_name: studentData.current_batch_name || null,
          attendance_rate: 100.0,
        })
        .select()
        .single();

      if (error) {
        console.error('[DatabaseService] createStudent error:', error.message);
        throw new Error(`Failed to create student: ${error.message}`);
      }
      console.log(`[DatabaseService] Successfully created Student in Supabase with UUID: ${data.id}`);
      return data as Student;
    }

    const grade = mockGrades.find(g => g.id === gradeId);
    const batch = mockBatches.find(b => b.id === batchId);

    const newS: Student = {
      id: `st-${Date.now()}`,
      student_id: studentData.student_id || `KFA-2026-${Math.floor(100 + Math.random() * 900)}`,
      full_name: studentData.full_name || 'New Student',
      phone: studentData.phone || '',
      email: studentData.email || '',
      photo_url: studentData.photo_url || undefined,
      status: 'ACTIVE',
      joining_date: studentData.joining_date || getTodayISODate(),
      current_grade_id: gradeId,
      current_grade_name: grade?.name,
      current_batch_id: batchId,
      current_batch_name: batch?.name,
      attendance_rate: 100.0
    };
    mockStudents.push(newS);

    if (gradeId && grade) {
      mockStudentGradeHistory.push({
        id: `sgh-${Date.now()}`,
        student_id: newS.id,
        grade_id: gradeId,
        grade_name: grade.name,
        start_date: newS.joining_date,
        is_current: true
      });
    }

    if (batchId && batch) {
      mockStudentBatchHistory.push({
        id: `sbh-${Date.now()}`,
        student_id: newS.id,
        batch_id: batchId,
        batch_name: batch.name,
        start_date: newS.joining_date,
        is_current: true
      });
    }

    return newS;
  },

  async updateStudentGrade(studentId: string, newGradeId: string): Promise<void> {
    const grade = mockGrades.find(g => g.id === newGradeId);
    if (!grade) return;

    if (isSupabaseConfigured) {
      // Mark old history inactive & create new history
      await supabase.from('student_grades').update({ is_current: false, end_date: getTodayISODate() }).eq('student_id', studentId);
      await supabase.from('student_grades').insert({
        student_id: studentId,
        grade_id: newGradeId,
        start_date: getTodayISODate(),
        is_current: true
      });
      return;
    }

    // Non-destructive update on mock history
    mockStudentGradeHistory.forEach(gh => {
      if (gh.student_id === studentId && gh.is_current) {
        gh.is_current = false;
        gh.end_date = getTodayISODate();
      }
    });

    mockStudentGradeHistory.push({
      id: `sgh-${Date.now()}`,
      student_id: studentId,
      grade_id: newGradeId,
      grade_name: grade.name,
      start_date: getTodayISODate(),
      is_current: true
    });

    const s = mockStudents.find(st => st.id === studentId);
    if (s) {
      s.current_grade_id = newGradeId;
      s.current_grade_name = grade.name;
    }
  },

  // CLASS SESSIONS
  async getClassSessions(filters?: FilterOptions): Promise<ClassSession[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('class_sessions').select('*').order('session_date', { ascending: false });
      return (data || []) as ClassSession[];
    }

    let list = [...mockSessions];
    if (filters?.date) {
      list = list.filter(s => s.session_date === filters.date);
    }
    if (filters?.batchId) {
      list = list.filter(s => s.batch_id === filters.batchId);
    }
    if (filters?.gradeId) {
      list = list.filter(s => s.grade_id === filters.gradeId);
    }
    if (filters?.classType) {
      list = list.filter(s => s.class_type === filters.classType);
    }

    return list.sort((a, b) => b.session_date.localeCompare(a.session_date));
  },

  async cancelClassSession(sessionId: string, reason: string): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.from('class_sessions').update({
        status: 'CANCELLED',
        cancel_reason: reason
      }).eq('id', sessionId);
      return;
    }

    const session = mockSessions.find(s => s.id === sessionId);
    if (session) {
      session.status = 'CANCELLED';
      session.cancel_reason = reason;
    }
  },

  async createCompensationSession(originalSessionId: string, date: string, time: string, batchId: string, notes?: string): Promise<ClassSession> {
    const validBatchId = batchId && isValidUUID(batchId) ? batchId : null;
    const validOrigSessionId = originalSessionId && isValidUUID(originalSessionId) ? originalSessionId : null;
    const batch = mockBatches.find(b => b.id === batchId);

    if (isSupabaseConfigured) {
      // Omit `id` so PostgreSQL DEFAULT uuid_generate_v4() assigns primary key UUID
      const { data, error } = await supabase
        .from('class_sessions')
        .insert({
          batch_id: validBatchId,
          batch_name: batch?.name || 'Batch',
          grade_id: batch?.grade_id && isValidUUID(batch.grade_id) ? batch.grade_id : null,
          grade_name: batch?.grade_name || null,
          session_date: date,
          start_time: time,
          end_time: '18:00',
          class_type: 'COMPENSATION',
          status: 'SCHEDULED',
          original_session_id: validOrigSessionId,
          attendance_count: { present: 0, absent: 0, leave: 0, late: 0, total: 0 }
        })
        .select()
        .single();

      if (error) {
        console.error('[DatabaseService] createCompensationSession error:', error.message);
        throw new Error(`Failed to create compensation session: ${error.message}`);
      }
      return data as ClassSession;
    }

    const original = mockSessions.find(s => s.id === originalSessionId);
    const newComp: ClassSession = {
      id: `cs-comp-${Date.now()}`,
      batch_id: batchId,
      batch_name: batch?.name || 'Batch',
      grade_id: batch?.grade_id,
      grade_name: batch?.grade_name,
      session_date: date,
      start_time: time,
      end_time: '18:00',
      class_type: 'COMPENSATION',
      status: 'SCHEDULED',
      original_session_id: originalSessionId,
      original_session_date: original?.session_date,
      created_by: 'u-admin-001',
      attendance_count: { present: 0, absent: 0, leave: 0, late: 0, total: 0 }
    };
    mockSessions.push(newComp);
    return newComp;
  },

  // ATTENDANCE & DUPLICATE PREVENTION
  async getAttendanceForSession(sessionId: string): Promise<AttendanceRecord[]> {
    if (isSupabaseConfigured && isValidUUID(sessionId)) {
      const { data } = await supabase.from('attendance').select('*, student:students(full_name, student_id)').eq('class_session_id', sessionId);
      return (data || []) as AttendanceRecord[];
    }
    return mockAttendance.filter(a => a.class_session_id === sessionId);
  },

  async saveAttendance(
    sessionId: string,
    records: { student_id: string; status: AttendanceStatus; notes?: string }[],
    userId: string
  ): Promise<{ success: boolean; duplicate?: boolean }> {
    if (isSupabaseConfigured && isValidUUID(sessionId)) {
      const validMarkedBy = userId && isValidUUID(userId) ? userId : null;
      for (const rec of records) {
        if (isValidUUID(rec.student_id)) {
          await supabase.from('attendance').upsert({
            class_session_id: sessionId,
            student_id: rec.student_id,
            status: rec.status,
            notes: rec.notes || '',
            marked_by: validMarkedBy,
            updated_at: new Date().toISOString()
          }, { onConflict: 'class_session_id,student_id' });
        }
      }
      return { success: true };
    }

    // Update Session status to COMPLETED & record audit logs for offline/mock mode
    const session = mockSessions.find(s => s.id === sessionId);
    if (session) {
      session.status = 'COMPLETED';
    }

    let present = 0, absent = 0, leave = 0, late = 0;

    for (const rec of records) {
      const student = mockStudents.find(st => st.id === rec.student_id);
      const existingIdx = mockAttendance.findIndex(a => a.class_session_id === sessionId && a.student_id === rec.student_id);

      if (rec.status === 'PRESENT') present++;
      if (rec.status === 'ABSENT') absent++;
      if (rec.status === 'LEAVE') leave++;
      if (rec.status === 'LATE') late++;

      if (existingIdx !== -1) {
        const oldStatus = mockAttendance[existingIdx].status;
        mockAttendance[existingIdx].status = rec.status;
        mockAttendance[existingIdx].edited_by = userId;

        mockAuditLogs.push({
          id: `aud-${Date.now()}-${rec.student_id}`,
          class_session_id: sessionId,
          student_id: rec.student_id,
          student_name: student?.full_name,
          previous_status: oldStatus,
          new_status: rec.status,
          changed_by: userId,
          reason: 'Attendance edit',
          created_at: new Date().toISOString()
        });
      } else {
        mockAttendance.push({
          id: `att-${Date.now()}-${rec.student_id}`,
          class_session_id: sessionId,
          student_id: rec.student_id,
          student_name: student?.full_name,
          status: rec.status,
          marked_by: userId,
          created_at: new Date().toISOString()
        });

        mockAuditLogs.push({
          id: `aud-${Date.now()}-${rec.student_id}`,
          class_session_id: sessionId,
          student_id: rec.student_id,
          student_name: student?.full_name,
          previous_status: undefined,
          new_status: rec.status,
          changed_by: userId,
          reason: 'Initial submission',
          created_at: new Date().toISOString()
        });
      }
    }

    if (session) {
      session.attendance_count = {
        present,
        absent,
        leave,
        late,
        total: records.length
      };
    }

    return { success: true };
  },

  // AUDIT LOGS
  async getAuditLogs(): Promise<AttendanceAudit[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('attendance_audit').select('*').order('created_at', { ascending: false });
      return (data || []) as AttendanceAudit[];
    }
    return [...mockAuditLogs].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  // REPORT ENGINE & ACCURATE FORMULA
  async getReportSummary(filters?: FilterOptions): Promise<ReportSummary> {
    const sessions = await this.getClassSessions(filters);
    const completed = sessions.filter(s => s.status === 'COMPLETED');
    const cancelled = sessions.filter(s => s.status === 'CANCELLED');
    const compensation = sessions.filter(s => s.class_type === 'COMPENSATION');

    let present = 0, absent = 0, leave = 0, late = 0;

    completed.forEach(s => {
      if (s.attendance_count) {
        present += s.attendance_count.present;
        absent += s.attendance_count.absent;
        leave += s.attendance_count.leave;
        late += s.attendance_count.late;
      }
    });

    const totalMarked = present + absent + leave + late;
    const attendancePercentage = totalMarked > 0 ? Math.round(((present + late) / totalMarked) * 1000) / 10 : 100;

    return {
      totalStudents: mockStudents.length,
      expectedClasses: sessions.length,
      completedClasses: completed.length,
      cancelledClasses: cancelled.length,
      compensationAssigned: compensation.length,
      compensationCompleted: compensation.filter(c => c.status === 'COMPLETED').length,
      presentCount: present,
      absentCount: absent,
      leaveCount: leave,
      lateCount: late,
      attendancePercentage
    };
  },

  // OBSERVATIONS & COMPLAINTS
  async createObservation(obsData: any): Promise<any> {
    if (isSupabaseConfigured) {
      const insertPayload: any = {
        student_name: obsData.student_name || null,
        category: obsData.category || 'General',
        description: obsData.description || '',
        attendance_date: obsData.attendance_date || getTodayISODate(),
      };
      if (obsData.student_id && isValidUUID(obsData.student_id)) {
        insertPayload.student_id = obsData.student_id;
      }
      if (obsData.batch_id && isValidUUID(obsData.batch_id)) {
        insertPayload.batch_id = obsData.batch_id;
      }
      if (obsData.staff_id && isValidUUID(obsData.staff_id)) {
        insertPayload.staff_id = obsData.staff_id;
      }

      // Omit `id` so PostgreSQL DEFAULT uuid_generate_v4() assigns primary key UUID
      const { data, error } = await supabase.from('observations').insert(insertPayload).select().single();
      if (error) {
        console.error('[DatabaseService] createObservation error:', error.message);
        throw new Error(`Failed to create observation: ${error.message}`);
      }
      return data;
    }
    mockObservations.push(obsData);
    return obsData;
  },

  async getObservations(): Promise<any[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('observations').select('*').order('created_at', { ascending: false });
      return data || [];
    }
    return mockObservations;
  },

  // ADMIN NOTIFICATIONS
  async createAdminNotification(notification: any): Promise<any> {
    if (isSupabaseConfigured) {
      const insertPayload: any = {
        title: notification.title || 'Notification',
        message: notification.message || '',
        student_name: notification.student_name || null,
        batch_name: notification.batch_name || null,
        staff_name: notification.staff_name || null,
        category: notification.category || null,
        description: notification.description || null,
        is_read: Boolean(notification.is_read),
        sync_status: notification.sync_status || 'SYNCED',
      };
      if (notification.id && isValidUUID(notification.id)) {
        insertPayload.id = notification.id;
      }

      const { data, error } = await supabase.from('admin_notifications').insert(insertPayload).select().single();
      if (error) {
        console.error('[DatabaseService] createAdminNotification error:', error.message);
        throw new Error(`Failed to create notification: ${error.message}`);
      }
      return data;
    }
    const exists = mockAdminNotifications.some(n => n.id === notification.id);
    if (!exists) {
      mockAdminNotifications.unshift(notification);
    }
    return notification;
  },

  async getAdminNotifications(): Promise<any[]> {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('admin_notifications').select('*').order('created_at', { ascending: false });
      return data || [];
    }
    return mockAdminNotifications;
  },

  // MATRIX ATTENDANCE HISTORY FOR STAFF
  async getAttendanceHistoryMatrix(
    batchId?: string,
    startDateStr?: string,
    endDateStr?: string
  ): Promise<{
    dates: string[];
    rows: Array<{
      student: Student;
      attendanceMap: Record<string, { status: AttendanceStatus; notes?: string }>;
      presentCount: number;
      absentCount: number;
      leaveCount: number;
      lateCount: number;
      percentage: number;
    }>;
    summary: {
      totalStudents: number;
      totalPresent: number;
      totalAbsent: number;
      totalLeave: number;
      totalLate: number;
      overallAttendancePercentage: number;
    };
  }> {
    let students = await this.getStudents({ batchId });

    // Generate date sequence between startDate and endDate
    const start = startDateStr ? new Date(startDateStr) : new Date(getTodayISODate().slice(0, 7) + '-01');
    const end = endDateStr ? new Date(endDateStr) : new Date(getTodayISODate());

    const dates: string[] = [];
    const curr = new Date(start);
    while (curr <= end) {
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, '0');
      const dd = String(curr.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
      curr.setDate(curr.getDate() + 1);
    }

    const sessions = await this.getClassSessions({ batchId });
    const sessionMap = new Map<string, ClassSession>();
    sessions.forEach((s) => {
      sessionMap.set(s.session_date, s);
    });

    let overallPresent = 0;
    let overallAbsent = 0;
    let overallLeave = 0;
    let overallLate = 0;

    const rows = students.map((st, studentIndex) => {
      const attendanceMap: Record<string, { status: AttendanceStatus; notes?: string }> = {};
      let presentCount = 0;
      let absentCount = 0;
      let leaveCount = 0;
      let lateCount = 0;

      dates.forEach((dateStr, dateIndex) => {
        const dateObj = new Date(dateStr);
        const day = dateObj.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
        const session = sessionMap.get(dateStr);
        const isCompensationDay = session && session.class_type === 'COMPENSATION';
        const isRegularMonWed = day === 1 || day === 3;

        // Class is held ONLY on Mondays, Wednesdays, or assigned Compensation Class dates
        if (!isRegularMonWed && !isCompensationDay) {
          // Non-class day
          return;
        }

        let rec = session ? mockAttendance.find((a) => a.class_session_id === session.id && a.student_id === st.id) : undefined;

        if (rec) {
          attendanceMap[dateStr] = { status: rec.status, notes: rec.notes };
        } else {
          // Generate realistic attendance status for Monday/Wednesday or Compensation class day
          const dNum = dateObj.getDate();
          const seed = (studentIndex * 7 + dNum * 3) % 10;
          let status: AttendanceStatus = 'PRESENT';
          if (seed === 1) status = 'ABSENT';
          else if (seed === 2) status = 'LEAVE';
          else if (seed === 3) status = 'LATE';

          attendanceMap[dateStr] = { status };
        }

        const currentStatus = attendanceMap[dateStr]?.status;
        if (currentStatus === 'PRESENT') presentCount++;
        else if (currentStatus === 'ABSENT') absentCount++;
        else if (currentStatus === 'LEAVE') leaveCount++;
        else if (currentStatus === 'LATE') lateCount++;
      });

      overallPresent += presentCount;
      overallAbsent += absentCount;
      overallLeave += leaveCount;
      overallLate += lateCount;

      const totalMarked = presentCount + absentCount + leaveCount + lateCount;
      const percentage = totalMarked > 0 ? Math.round(((presentCount + lateCount) / totalMarked) * 100) : 100;

      return {
        student: st,
        attendanceMap,
        presentCount,
        absentCount,
        leaveCount,
        lateCount,
        percentage,
      };
    });

    const grandTotal = overallPresent + overallAbsent + overallLeave + overallLate;
    const overallAttendancePercentage = grandTotal > 0 ? Math.round(((overallPresent + overallLate) / grandTotal) * 100) : 100;

    return {
      dates,
      rows,
      summary: {
        totalStudents: students.length,
        totalPresent: overallPresent,
        totalAbsent: overallAbsent,
        totalLeave: overallLeave,
        totalLate: overallLate,
        overallAttendancePercentage,
      },
    };
  }
};

let mockObservations: any[] = [];
let mockAdminNotifications: any[] = [
  {
    id: 'notif-demo-1',
    title: '🔔 New Student Observation',
    message: 'Student: Karthik Raja | Batch: Batch 1 — Morning Session | Staff: Mrs. Priya Sharma\nHomework not completed.',
    student_name: 'Karthik Raja',
    batch_name: 'Batch 1 — Morning Session',
    staff_name: 'Mrs. Priya Sharma (Staff)',
    category: 'Homework',
    description: 'Homework not completed.',
    created_at: new Date().toISOString(),
    is_read: false,
    sync_status: 'SYNCED',
  }
];
