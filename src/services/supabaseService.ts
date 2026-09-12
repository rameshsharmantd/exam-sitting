import { getSupabaseClient, getCurrentSupabaseConfig } from './supabaseClient';
import {
  Student,
  Hall,
  HallClassMapItem,
  SittingArrangement,
  ExamAttendanceRecord,
  ExamTimeTableEntry,
  SystemSettings,
  ActivityLog
} from '../types';

export interface SchoolDatabasePayload {
  students: Student[];
  halls: Hall[];
  hallClassMaps: HallClassMapItem[];
  sittingPlans: Record<string, SittingArrangement>;
  attendanceRecords: ExamAttendanceRecord[];
  timeTableEntries: ExamTimeTableEntry[];
  settings: SystemSettings;
  activityLogs: ActivityLog[];
}

/**
 * Test Supabase connectivity and verify permissions
 */
export const testSupabaseConnection = async (): Promise<{
  connected: boolean;
  message: string;
  tablesFound?: string[];
}> => {
  const supabase = getSupabaseClient();
  const config = getCurrentSupabaseConfig();

  try {
    // 1. Ping school_app_state table
    const { data, error } = await supabase
      .from('school_app_state')
      .select('key, updated_at')
      .limit(1);

    if (error) {
      // If table doesn't exist yet, standard error code is 42P01 (relation does not exist)
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          connected: true,
          message: `Connected to Supabase project ${config.projectId}. Tables not created yet - you can run the SQL schema in your Supabase SQL editor.`
        };
      }
      return {
        connected: false,
        message: `Supabase error (${error.code || 'ERR'}): ${error.message}`
      };
    }

    return {
      connected: true,
      message: `Successfully connected to Supabase project: ${config.projectId}`
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err.message || 'Unable to connect to Supabase'
    };
  }
};

/**
 * Push all local school state into Supabase:
 * 1. Saves complete snapshot to school_app_state
 * 2. Also attempts upserting individual relational tables
 */
export const pushAllToSupabase = async (
  payload: SchoolDatabasePayload
): Promise<{ success: boolean; message: string }> => {
  const supabase = getSupabaseClient();
  const config = getCurrentSupabaseConfig();
  const now = new Date().toISOString();

  let stateSaved = false;
  const structuredErrors: string[] = [];

  // 1. Primary Sync: Unified JSON state snapshot for 100% data fidelity & realtime sync
  try {
    const { error } = await supabase.from('school_app_state').upsert(
      {
        key: 'current_school_database',
        data: payload,
        updated_at: now
      },
      { onConflict: 'key' }
    );

    if (error) {
      structuredErrors.push(`Snapshot: ${error.message}`);
    } else {
      stateSaved = true;
    }
  } catch (e: any) {
    structuredErrors.push(`Snapshot: ${e.message}`);
  }

  // 2. Relational Sync: Upsert individual tables if created
  try {
    // Sync Settings
    await supabase.from('system_settings').upsert({
      id: 'default_school_settings',
      school_name: payload.settings.schoolName,
      subtitle: payload.settings.subtitle || '',
      affiliation: payload.settings.affiliation || '',
      default_session: payload.settings.defaultSession,
      default_exam: payload.settings.defaultExam,
      admin_username: payload.settings.adminUsername,
      admin_password_hash: payload.settings.adminPasswordHash,
      classes: payload.settings.classes,
      address: payload.settings.address || '',
      contact: payload.settings.contact || '',
      email: payload.settings.email || '',
      settings_json: payload.settings,
      updated_at: now
    });
  } catch (e) {
    // Optional table
  }

  if (payload.students.length > 0) {
    try {
      const studentRows = payload.students.map((s) => ({
        record_key: s.recordKey,
        student_id: s.studentId,
        roll_no: s.rollNo,
        class_name: s.className,
        name: s.name,
        father_name: s.fatherName,
        gender: s.gender,
        house: s.house,
        category: s.category,
        contact: s.contact,
        admission_no: s.admissionNo,
        address: s.address,
        remarks: s.remarks,
        updated_at: now
      }));
      await supabase.from('students').upsert(studentRows);
    } catch (e) {
      // Optional table
    }
  }

  if (payload.halls.length > 0) {
    try {
      const hallRows = payload.halls.map((h) => ({
        hall_id: h.hallId,
        hall_name: h.hallName,
        capacity: h.capacity,
        rows: h.rows,
        columns: h.columns,
        door_position: h.doorPosition,
        window_position: h.windowPosition,
        active: h.active,
        updated_at: now
      }));
      await supabase.from('halls').upsert(hallRows);
    } catch (e) {
      // Optional table
    }
  }

  if (payload.timeTableEntries.length > 0) {
    try {
      const ttRows = payload.timeTableEntries.map((t) => ({
        id: t.id,
        exam: t.exam,
        session: t.session,
        exam_date: t.date,
        day: t.day,
        exam_time: t.time,
        class_subjects: t.classSubjects,
        notes: t.notes || '',
        updated_at: now
      }));
      await supabase.from('timetable_entries').upsert(ttRows);
    } catch (e) {
      // Optional table
    }
  }

  if (stateSaved) {
    return {
      success: true,
      message: `Successfully pushed all records to Supabase Project (${config.projectId})!`
    };
  }

  if (structuredErrors.length > 0) {
    return {
      success: false,
      message: `Failed to push to Supabase: ${structuredErrors.join(', ')}`
    };
  }

  return {
    success: true,
    message: `Pushed records to Supabase (${config.projectId})`
  };
};

/**
 * Fetch all school data from Supabase
 */
export const pullAllFromSupabase = async (): Promise<{
  success: boolean;
  data?: Partial<SchoolDatabasePayload>;
  message: string;
}> => {
  const supabase = getSupabaseClient();
  const config = getCurrentSupabaseConfig();

  try {
    // 1. Try reading from school_app_state first (contains complete high-fidelity dataset)
    const { data: stateData, error: stateError } = await supabase
      .from('school_app_state')
      .select('data, updated_at')
      .eq('key', 'current_school_database')
      .single();

    if (stateData && stateData.data) {
      return {
        success: true,
        data: stateData.data as SchoolDatabasePayload,
        message: `Loaded all school records from Supabase (${config.projectId})!`
      };
    }

    // 2. If school_app_state is empty, fallback to individual relational tables
    const partialData: Partial<SchoolDatabasePayload> = {};

    const { data: studentsData } = await supabase.from('students').select('*');
    if (studentsData && studentsData.length > 0) {
      partialData.students = studentsData.map((s: any) => ({
        recordKey: s.record_key || s.student_id,
        studentId: s.student_id,
        rollNo: s.roll_no || '',
        className: s.class_name,
        name: s.name,
        fatherName: s.father_name || '',
        gender: s.gender || 'MALE',
        house: s.house || '',
        category: s.category || '',
        contact: s.contact || '',
        admissionNo: s.admission_no || '',
        address: s.address || '',
        remarks: s.remarks || ''
      }));
    }

    const { data: hallsData } = await supabase.from('halls').select('*');
    if (hallsData && hallsData.length > 0) {
      partialData.halls = hallsData.map((h: any) => ({
        hallId: h.hall_id,
        hallName: h.hall_name,
        capacity: h.capacity || 40,
        rows: h.rows || 5,
        columns: h.columns || 8,
        doorPosition: h.door_position || 'R1C1',
        windowPosition: h.window_position || '',
        active: h.active !== false
      }));
    }

    const { data: ttData } = await supabase.from('timetable_entries').select('*');
    if (ttData && ttData.length > 0) {
      partialData.timeTableEntries = ttData.map((t: any) => ({
        id: t.id,
        exam: t.exam,
        session: t.session,
        date: t.exam_date,
        day: t.day || '',
        time: t.exam_time || '',
        classSubjects: t.class_subjects || {},
        notes: t.notes || ''
      }));
    }

    const { data: settingsData } = await supabase
      .from('system_settings')
      .select('*')
      .limit(1)
      .single();

    if (settingsData) {
      if (settingsData.settings_json) {
        partialData.settings = settingsData.settings_json;
      } else {
        partialData.settings = {
          schoolName: settingsData.school_name,
          subtitle: settingsData.subtitle || '',
          affiliation: settingsData.affiliation || '',
          defaultSession: settingsData.default_session || '2025-2026',
          defaultExam: settingsData.default_exam || 'Half Yearly Examination',
          adminUsername: settingsData.admin_username || 'admin',
          adminPasswordHash: settingsData.admin_password_hash || 'admin123',
          classes: settingsData.classes || ['NUR', 'LKG', 'UKG', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'],
          address: settingsData.address || '',
          contact: settingsData.contact || '',
          email: settingsData.email || ''
        };
      }
    }

    if (Object.keys(partialData).length > 0) {
      return {
        success: true,
        data: partialData,
        message: `Synced records from Supabase tables!`
      };
    }

    return {
      success: false,
      message: 'No records found in Supabase yet. Push your school data first to initialize your cloud database.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Failed to fetch data from Supabase'
    };
  }
};
