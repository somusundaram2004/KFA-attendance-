-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR KFA ACADEMY
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN' AND status = 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if current user is assigned staff to a batch
CREATE OR REPLACE FUNCTION public.is_assigned_staff(p_batch_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.batch_staff
    WHERE batch_id = p_batch_id AND staff_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------
-- 1. PROFILES POLICIES
-- ------------------------------------------
CREATE POLICY "Admins full access on profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

CREATE POLICY "Users read own profile"
    ON public.profiles FOR SELECT
    USING (id = auth.uid());

-- ------------------------------------------
-- 2. GRADES POLICIES
-- ------------------------------------------
CREATE POLICY "Admins full access on grades"
    ON public.grades FOR ALL
    USING (public.is_admin());

CREATE POLICY "All authenticated users view grades"
    ON public.grades FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- ------------------------------------------
-- 3. STUDENTS POLICIES
-- ------------------------------------------
CREATE POLICY "Admins full access on students"
    ON public.students FOR ALL
    USING (public.is_admin());

CREATE POLICY "Staff view students in assigned batches"
    ON public.students FOR SELECT
    USING (
        auth.uid() IS NOT NULL AND (
            public.is_admin() OR
            EXISTS (
                SELECT 1 FROM public.student_batches sb
                JOIN public.batch_staff bs ON sb.batch_id = bs.batch_id
                WHERE sb.student_id = students.id
                  AND bs.staff_id = auth.uid()
                  AND sb.is_current = TRUE
            )
        )
    );

-- ------------------------------------------
-- 4. STUDENT GRADES POLICIES
-- ------------------------------------------
CREATE POLICY "Admins full access on student_grades"
    ON public.student_grades FOR ALL
    USING (public.is_admin());

CREATE POLICY "Staff view student_grades"
    ON public.student_grades FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- ------------------------------------------
-- 5. BATCHES & BATCH STAFF POLICIES
-- ------------------------------------------
CREATE POLICY "Admins full access on batches"
    ON public.batches FOR ALL
    USING (public.is_admin());

CREATE POLICY "Staff view assigned batches"
    ON public.batches FOR SELECT
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.batch_staff
            WHERE batch_staff.batch_id = batches.id AND batch_staff.staff_id = auth.uid()
        )
    );

CREATE POLICY "Admins full access on batch_staff"
    ON public.batch_staff FOR ALL
    USING (public.is_admin());

CREATE POLICY "Staff view own batch assignments"
    ON public.batch_staff FOR SELECT
    USING (staff_id = auth.uid());

-- ------------------------------------------
-- 6. STUDENT BATCHES & SCHEDULES
-- ------------------------------------------
CREATE POLICY "Admins full access on student_batches"
    ON public.student_batches FOR ALL
    USING (public.is_admin());

CREATE POLICY "Staff view student_batches"
    ON public.student_batches FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins full access on batch_schedules"
    ON public.batch_schedules FOR ALL
    USING (public.is_admin());

CREATE POLICY "Staff view batch_schedules"
    ON public.batch_schedules FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- ------------------------------------------
-- 7. CLASS SESSIONS POLICIES
-- ------------------------------------------
CREATE POLICY "Admins full access on class_sessions"
    ON public.class_sessions FOR ALL
    USING (public.is_admin());

CREATE POLICY "Staff view class_sessions for assigned batches"
    ON public.class_sessions FOR SELECT
    USING (
        public.is_admin() OR
        public.is_assigned_staff(batch_id)
    );

-- ------------------------------------------
-- 8. ATTENDANCE POLICIES
-- ------------------------------------------
CREATE POLICY "Admins full access on attendance"
    ON public.attendance FOR ALL
    USING (public.is_admin());

CREATE POLICY "Staff view attendance for assigned batches"
    ON public.attendance FOR SELECT
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.class_sessions cs
            WHERE cs.id = attendance.class_session_id
              AND public.is_assigned_staff(cs.batch_id)
        )
    );

CREATE POLICY "Staff insert attendance for assigned batches"
    ON public.attendance FOR INSERT
    WITH CHECK (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.class_sessions cs
            WHERE cs.id = class_session_id
              AND public.is_assigned_staff(cs.batch_id)
        )
    );

CREATE POLICY "Staff update attendance for assigned batches"
    ON public.attendance FOR UPDATE
    USING (
        public.is_admin() OR
        EXISTS (
            SELECT 1 FROM public.class_sessions cs
            WHERE cs.id = attendance.class_session_id
              AND public.is_assigned_staff(cs.batch_id)
        )
    );

-- ------------------------------------------
-- 9. AUDIT LOG & SETTINGS POLICIES
-- ------------------------------------------
CREATE POLICY "Admins full access on attendance_audit"
    ON public.attendance_audit FOR ALL
    USING (public.is_admin());

CREATE POLICY "Everyone read settings"
    ON public.application_settings FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage settings"
    ON public.application_settings FOR ALL
    USING (public.is_admin());
