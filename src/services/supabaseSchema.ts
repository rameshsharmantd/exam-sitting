export const SUPABASE_SQL_SCHEMA = `-- =========================================================
-- School Student & Exam Management System - Supabase Schema
-- Run this in your Supabase SQL Editor:
-- Project: https://supabase.com/dashboard/project/pkshcgdjjgijjkhijghf/sql
-- =========================================================

-- 1. App State & Instant Sync Snapshot Table
CREATE TABLE IF NOT EXISTS public.school_app_state (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.school_app_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on school_app_state"
  ON public.school_app_state
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS public.students (
  record_key TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  roll_no TEXT,
  class_name TEXT NOT NULL,
  name TEXT NOT NULL,
  father_name TEXT,
  gender TEXT,
  house TEXT,
  category TEXT,
  contact TEXT,
  admission_no TEXT,
  address TEXT,
  remarks TEXT,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on students"
  ON public.students
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Halls Table
CREATE TABLE IF NOT EXISTS public.halls (
  hall_id TEXT PRIMARY KEY,
  hall_name TEXT NOT NULL,
  rows INTEGER DEFAULT 5,
  columns INTEGER DEFAULT 8,
  capacity INTEGER DEFAULT 40,
  door_position TEXT,
  window_position TEXT,
  active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.halls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on halls"
  ON public.halls
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Hall Class Maps
CREATE TABLE IF NOT EXISTS public.hall_class_maps (
  id TEXT PRIMARY KEY,
  exam TEXT NOT NULL,
  session TEXT NOT NULL,
  hall_id TEXT NOT NULL,
  hall_name TEXT,
  class_name TEXT NOT NULL,
  map_order INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.hall_class_maps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on hall_class_maps"
  ON public.hall_class_maps
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Sitting Plans
CREATE TABLE IF NOT EXISTS public.sitting_plans (
  plan_key TEXT PRIMARY KEY,
  exam TEXT NOT NULL,
  session TEXT NOT NULL,
  hall_id TEXT NOT NULL,
  hall_name TEXT,
  locked BOOLEAN DEFAULT false,
  algorithm TEXT DEFAULT 'ROUND_ROBIN',
  fill_direction TEXT,
  seats JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sitting_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on sitting_plans"
  ON public.sitting_plans
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Exam Attendance Records
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id TEXT PRIMARY KEY,
  s_no INTEGER,
  exam TEXT NOT NULL,
  session TEXT NOT NULL,
  hall TEXT NOT NULL,
  hall_id TEXT,
  seat_no TEXT NOT NULL,
  class_name TEXT NOT NULL,
  roll_no TEXT,
  student_name TEXT NOT NULL,
  subject TEXT,
  exam_date TEXT,
  day TEXT,
  signature TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on attendance_records"
  ON public.attendance_records
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 7. Exam Timetable Entries
CREATE TABLE IF NOT EXISTS public.timetable_entries (
  id TEXT PRIMARY KEY,
  exam TEXT NOT NULL,
  session TEXT NOT NULL,
  exam_date TEXT NOT NULL,
  day TEXT,
  exam_time TEXT,
  class_subjects JSONB NOT NULL,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on timetable_entries"
  ON public.timetable_entries
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 8. System Settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  id TEXT PRIMARY KEY DEFAULT 'default_school_settings',
  school_name TEXT NOT NULL,
  subtitle TEXT,
  affiliation TEXT,
  default_session TEXT,
  default_exam TEXT,
  admin_username TEXT,
  admin_password_hash TEXT,
  classes JSONB,
  address TEXT,
  contact TEXT,
  email TEXT,
  settings_json JSONB,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on system_settings"
  ON public.system_settings
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 9. Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  admin TEXT NOT NULL,
  action TEXT NOT NULL,
  student_id TEXT,
  class_name TEXT,
  details TEXT
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on activity_logs"
  ON public.activity_logs
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Realtime Publication for collaborative multi-tab sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.school_app_state;
`;
