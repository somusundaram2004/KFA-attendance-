-- ==========================================
-- SEED DATA FOR KFA ACADEMY ATTENDANCE
-- ==========================================

-- Insert Default Grades
INSERT INTO public.grades (id, name, description, display_order) VALUES
('g0000000-0000-0000-0000-000000000000', 'Pre Grade', 'Foundation level for early academy learners', 1),
('g0000000-0000-0000-0000-000000000001', 'Grade 1', 'Primary Level 1', 2),
('g0000000-0000-0000-0000-000000000002', 'Grade 2', 'Primary Level 2', 3),
('g0000000-0000-0000-0000-000000000003', 'Grade 3', 'Primary Level 3', 4),
('g0000000-0000-0000-0000-000000000004', 'Grade 4', 'Intermediate Level 4', 5),
('g0000000-0000-0000-0000-000000000005', 'Grade 5', 'Intermediate Level 5', 6),
('g0000000-0000-0000-0000-000000000006', 'Grade 6', 'Advanced Level 6', 7),
('g0000000-0000-0000-0000-000000000007', 'Grade 7', 'Senior Level 7', 8)
ON CONFLICT (name) DO NOTHING;

-- Insert Application Settings
INSERT INTO public.application_settings (key, value, description) VALUES
('academy_name', '"KFA Academy"', 'Name of the academy'),
('timezone', '"Asia/Kolkata"', 'Primary timezone'),
('date_format', '"DD-MM-YYYY"', 'Preferred date display format'),
('default_class_duration_mins', '60', 'Default class duration in minutes')
ON CONFLICT (key) DO NOTHING;
