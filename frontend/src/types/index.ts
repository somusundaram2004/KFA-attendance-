export type UserRole = 'ADMIN' | 'STAFF';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type StudentStatus = 'ACTIVE' | 'INACTIVE';
export type ClassType = 'REGULAR' | 'COMPENSATION';
export type ClassStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'HOLIDAY';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LEAVE' | 'LATE';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Grade {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Student {
  id: string;
  student_id: string;
  full_name: string;
  photo_url?: string;
  phone?: string;
  email?: string;
  status: StudentStatus;
  joining_date: string;
  current_grade_id?: string;
  current_grade_name?: string;
  current_batch_id?: string;
  current_batch_name?: string;
  attendance_rate?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StudentGradeHistory {
  id: string;
  student_id: string;
  grade_id: string;
  grade_name: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  created_at?: string;
}

export interface Batch {
  id: string;
  name: string;
  description?: string;
  grade_id?: string;
  grade_name?: string;
  is_active: boolean;
  staff_ids?: string[];
  staff_names?: string[];
  schedules?: BatchSchedule[];
  created_at?: string;
  updated_at?: string;
}

export interface BatchSchedule {
  id: string;
  batch_id: string;
  day_of_week: number; // 1 = Monday, 3 = Wednesday, etc.
  start_time: string; // HH:MM
  end_time: string; // HH:MM
}

export interface StudentBatchHistory {
  id: string;
  student_id: string;
  batch_id: string;
  batch_name: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  created_at?: string;
}

export interface ClassSession {
  id: string;
  batch_id: string;
  batch_name?: string;
  grade_id?: string;
  grade_name?: string;
  session_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  class_type: ClassType;
  status: ClassStatus;
  cancel_reason?: string;
  original_session_id?: string;
  original_session_date?: string;
  created_by?: string;
  created_at?: string;
  attendance_count?: {
    present: number;
    absent: number;
    leave: number;
    late: number;
    total: number;
  };
}

export interface AttendanceRecord {
  id: string;
  class_session_id: string;
  student_id: string;
  student_name?: string;
  student_code?: string;
  status: AttendanceStatus;
  notes?: string;
  marked_by?: string;
  edited_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceAudit {
  id: string;
  attendance_id?: string;
  class_session_id: string;
  student_id: string;
  student_name?: string;
  previous_status?: AttendanceStatus;
  new_status: AttendanceStatus;
  changed_by?: string;
  changed_by_name?: string;
  reason?: string;
  created_at: string;
}

export interface FilterOptions {
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  gradeId?: string;
  batchId?: string;
  studentId?: string;
  classType?: ClassType;
  attendanceStatus?: AttendanceStatus;
  searchQuery?: string;
}

export interface ReportSummary {
  totalStudents: number;
  expectedClasses: number;
  completedClasses: number;
  cancelledClasses: number;
  compensationAssigned: number;
  compensationCompleted: number;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  lateCount: number;
  attendancePercentage: number;
}
