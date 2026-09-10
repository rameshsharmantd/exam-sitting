export interface Student {
  className: string;
  rollNo: string; // e.g. "01"
  name: string;
  fatherName: string;
  gender: string;
  house: string;
  category: string;
  contact: string;
  admissionNo: string;
  studentId: string; // e.g. "XA01"
  address: string;
  remarks: string;
  recordKey: string;
}

export interface Hall {
  hallId: string;
  hallName: string;
  rows: number;
  columns: number;
  capacity: number;
  doorPosition: string; // e.g. "R1C1"
  windowPosition: string; // e.g. "R1C6, R5C6"
  active: boolean;
}

export interface HallClassMapItem {
  exam: string;
  session: string;
  hallId: string;
  hallName: string;
  className: string;
  order: number;
  active: boolean;
}

export interface SittingSeat {
  seatNo: string; // e.g. "R1C1"
  row: number;
  column: number;
  className: string;
  rollNo: string;
  studentId: string;
  studentName: string;
  recordKey: string;
  locked: boolean;
  doorWindow: string; // e.g. "DOOR", "WINDOW", "DOOR / WINDOW"
}

export interface SittingArrangement {
  exam: string;
  session: string;
  hallId: string;
  hallName: string;
  locked: boolean;
  algorithm: 'ROUND_ROBIN' | 'CLASS_WISE';
  fillDirection?: 'COLUMNS_FIRST' | 'ROWS_FIRST';
  seats: SittingSeat[];
  updatedAt: string;
  totalAssigned?: number;
  overflowCount?: number;
}

export interface ClassSeatingStatus {
  className: string;
  totalStudents: number;
  seatedCount: number;
  remainingCount: number;
  allocations: { hallId: string; hallName: string; count: number }[];
}

export interface ExamAttendanceRecord {
  sNo: number;
  exam: string;
  session: string;
  hall: string; // Hall Name e.g. "Room 101 - Main Examination Hall"
  hallId?: string; // Hall ID e.g. "H1"
  seatNo: string;
  className: string;
  rollNo: string;
  studentName: string;
  subject: string;
  date?: string; // YYYY-MM-DD
  day?: string; // Day of week e.g. "Monday"
  signature?: string;
  createdAt: string;
}

export interface ExamTimeTableEntry {
  id: string;
  exam: string;
  session: string;
  date: string; // YYYY-MM-DD
  day: string; // e.g. "Monday"
  time: string; // e.g. "09:00 AM - 12:00 PM"
  classSubjects: Record<string, string>; // Maps "NUR", "LKG", "UKG", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X" to Subject name
  notes?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  admin: string;
  action: string;
  studentId?: string;
  className?: string;
  details: string;
}

export interface SystemSettings {
  schoolName: string;
  defaultExam: string;
  defaultSession: string;
  adminUsername: string;
  adminPasswordHash: string; // SHA-256 or salt
  classes: string[];
  subtitle?: string;
  affiliation?: string;
  address?: string;
  contact?: string;
  email?: string;
}

export type ActiveSection =
  | 'dashboard'
  | 'students'
  | 'addStudent'
  | 'search'
  | 'promotion'
  | 'halls'
  | 'hallMap'
  | 'sitting'
  | 'timetable'
  | 'attendance'
  | 'reports'
  | 'activityLog'
  | 'settings';
