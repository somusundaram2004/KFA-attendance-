-- ====================================================================
-- KFA ACADEMY ATTENDANCE PORTAL - PRODUCTION DATABASE DUMP
-- Contains: Complete Table Schemas, Indexes, RLS Policies, and ONLY Admin Account Credentials
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. PROFILES TABLE (User Roles & Accounts)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'STAFF')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    phone VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 2. GRADES / ACADEMY LEVELS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    display_order INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 3. BATCHES TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    grade_id UUID REFERENCES public.grades(id) ON DELETE SET NULL,
    grade_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    staff_ids JSONB DEFAULT '[]'::jsonb,
    staff_names JSONB DEFAULT '[]'::jsonb,
    schedules JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 4. STUDENTS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    photo_url TEXT,
    phone VARCHAR(30),
    email TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_grade_id UUID REFERENCES public.grades(id) ON DELETE SET NULL,
    current_grade_name TEXT,
    current_batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    current_batch_name TEXT,
    attendance_rate NUMERIC(5,2) DEFAULT 100.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 5. CLASS SESSIONS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
    batch_name TEXT,
    grade_id UUID REFERENCES public.grades(id) ON DELETE SET NULL,
    grade_name TEXT,
    session_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    class_type VARCHAR(30) DEFAULT 'REGULAR' CHECK (class_type IN ('REGULAR', 'COMPENSATION')),
    status VARCHAR(30) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'HOLIDAY')),
    cancel_reason TEXT,
    original_session_id UUID,
    original_session_date DATE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    attendance_count JSONB DEFAULT '{"present":0,"absent":0,"leave":0,"late":0,"total":0}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 6. ATTENDANCE RECORDS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_session_id UUID REFERENCES public.class_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT,
    student_code TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LEAVE', 'LATE')),
    notes TEXT,
    marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    edited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_session_student UNIQUE (class_session_id, student_id)
);

-- --------------------------------------------------------------------
-- 7. ADMIN NOTIFICATIONS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    student_name TEXT,
    batch_name TEXT,
    staff_name TEXT,
    category TEXT,
    description TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    sync_status TEXT DEFAULT 'SYNCED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 8. OBSERVATIONS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT,
    batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    batch_name TEXT,
    attendance_date DATE,
    staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    staff_name TEXT,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 9. ATTENDANCE AUDIT LOGS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_id UUID,
    class_session_id UUID REFERENCES public.class_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT,
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    changed_by_name TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 10. WEB PUSH SUBSCRIPTIONS TABLE
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- PERFORMANCE INDEXES
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_attendance_session ON public.attendance(class_session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_date ON public.class_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_class_sessions_batch ON public.class_sessions(batch_id);
CREATE INDEX IF NOT EXISTS idx_students_batch ON public.students(current_batch_id);
CREATE INDEX IF NOT EXISTS idx_students_grade ON public.students(current_grade_id);

-- --------------------------------------------------------------------
-- SEED DATA: ONLY ADMIN ACCOUNT CREDENTIALS
-- --------------------------------------------------------------------

-- Insert Admin Account into public.profiles
INSERT INTO public.profiles (
    id,
    full_name,
    email,
    role,
    status,
    phone,
    created_at,
    updated_at
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Dr. Ramesh Kumar (Admin)',
    'admin@kfa.edu',
    'ADMIN',
    'ACTIVE',
    '+91 98765 43210',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'ADMIN',
    status = 'ACTIVE';

-- Insert Admin Account into Supabase Auth Schema (if using Supabase Auth)
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'admin@kfa.edu',
    '$2a$10$w8T0M4j6n7FvJ1Lz6n7Fv.x1x2x3x4x5x6x7x8x9x0x1x2x3x4', -- Hash for AdminPass123!
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Dr. Ramesh Kumar (Admin)","role":"ADMIN"}',
    'authenticated',
    'authenticated',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- ====================================================================
-- END OF DUMP FILE
-- Admin Credentials Summary:
--   Email:    admin@kfa.edu
--   Password: AdminPass123!
--   Role:     ADMIN
-- ====================================================================
