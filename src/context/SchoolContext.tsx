import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Student,
  Hall,
  HallClassMapItem,
  SittingArrangement,
  SittingSeat,
  ExamAttendanceRecord,
  ActivityLog,
  SystemSettings,
  ClassSeatingStatus
} from '../types';
import { CONFIG } from '../data/constants';
import {
  INITIAL_STUDENTS,
  INITIAL_HALLS,
  INITIAL_HALL_CLASS_MAPS,
  INITIAL_ACTIVITY_LOGS,
  DEFAULT_SETTINGS
} from '../data/initialData';

interface SchoolContextType {
  // Auth
  adminUser: string | null;
  currentUser: string | null;
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  updateAdminCredentials: (username: string, password: string) => void;

  // Settings
  settings: SystemSettings;
  saveSettings: (exam: string, session: string) => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  resetAllData: () => void;

  // Students
  students: Student[];
  getStudentsByClass: (className?: string) => Student[];
  getStudentByRecordKey: (recordKey: string) => Student | undefined;
  getStudentByStudentId: (studentId: string) => Student | undefined;
  checkDuplicates: (
    data: Partial<Student>,
    excludeRecordKey?: string
  ) => string[];
  addStudent: (
    data: Omit<Student, 'rollNo' | 'studentId' | 'recordKey'>,
    confirmed?: boolean
  ) => { success: boolean; requiresConfirmation?: boolean; warnings?: string[]; student?: Student };
  updateStudent: (
    data: Student,
    confirmed?: boolean
  ) => { success: boolean; requiresConfirmation?: boolean; warnings?: string[]; student?: Student };
  deleteStudent: (recordKey: string) => { success: boolean; message: string };
  searchStudents: (query: string) => Student[];

  // Promotion
  promoteStudent: (
    recordKey: string,
    targetClass: string,
    confirmed?: boolean
  ) => { success: boolean; requiresConfirmation?: boolean; warnings?: string[]; student?: Student };
  promoteClass: (
    sourceClass: string,
    targetClass: string,
    confirmed?: boolean
  ) => { success: boolean; requiresConfirmation?: boolean; warnings?: string[]; moved?: number; message?: string };

  // Halls
  halls: Hall[];
  saveHall: (hall: Omit<Hall, 'capacity'>) => { success: boolean };
  deleteHall: (hallId: string) => { success: boolean };

  // Hall Class Mapping
  hallClassMaps: HallClassMapItem[];
  getHallClasses: (exam: string, session: string, hallId?: string) => HallClassMapItem[];
  setHallClasses: (exam: string, session: string, hallId: string, classList: string[]) => { success: boolean };

  // Sitting Arrangement
  sittingPlans: Record<string, SittingArrangement>;
  generateSitting: (
    exam: string,
    session: string,
    hallId: string,
    algorithm: 'ROUND_ROBIN' | 'CLASS_WISE',
    fillDirection?: 'COLUMNS_FIRST' | 'ROWS_FIRST'
  ) => {
    success: boolean;
    message?: string;
    students?: number;
    capacity?: number;
    overflowCount?: number;
    overflowStudents?: { recordKey: string; name: string; rollNo: string; className: string; studentId: string }[];
  };
  getSittingPlan: (exam: string, session: string, hallId: string) => SittingArrangement | undefined;
  clearSittingPlan: (exam: string, session: string, hallId: string) => void;
  getRemainingStudentsForClass: (
    exam: string,
    session: string,
    className: string,
    excludeHallId?: string
  ) => Student[];
  getClassSeatingStatus: (exam: string, session: string) => Record<string, ClassSeatingStatus>;
  swapSeats: (exam: string, session: string, hallId: string, seatA: string, seatB: string) => { success: boolean; message?: string };
  emptySeat: (exam: string, session: string, hallId: string, seatNo: string) => { success: boolean; message?: string };
  lockSitting: (exam: string, session: string, hallId: string) => { success: boolean };
  unlockSitting: (exam: string, session: string, hallId: string) => { success: boolean };

  // Exam Attendance
  attendanceRecords: ExamAttendanceRecord[];
  generateAttendance: (
    exam: string,
    session: string,
    hallId: string,
    subject: string
  ) => { success: boolean; generated: number; message?: string };
  clearAttendanceForSubject: (exam: string, session: string, subject: string) => void;

  // Activity Log
  activityLogs: ActivityLog[];
  logActivity: (action: string, studentId?: string, className?: string, details?: string) => void;

  // System actions
  resetToDefaults: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => { success: boolean; message?: string };
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

// Helper functions matching Code.gs
function formatRoll(number: number): string {
  return String(number).padStart(2, '0');
}

function makeStudentId(className: string, roll: number): string {
  return className + formatRoll(roll);
}

function generateUuid(): string {
  return 'uuid-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
}

const STORAGE_KEYS = {
  ADMIN_AUTH: 'sm_admin_auth',
  SETTINGS: 'sm_settings',
  STUDENTS: 'sm_students',
  HALLS: 'sm_halls',
  HALL_MAPS: 'sm_hall_maps',
  SITTING_PLANS: 'sm_sitting_plans',
  ATTENDANCE: 'sm_attendance',
  ACTIVITY_LOGS: 'sm_activity_logs'
};

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Auth state
  const [adminUser, setAdminUser] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) || CONFIG.DEFAULT_ADMIN_USER;
  });

  // 2. Settings state
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  // 3. Students
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse students", e);
      }
    }
    return INITIAL_STUDENTS;
  });

  // 4. Halls
  const [halls, setHalls] = useState<Hall[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HALLS);
    if (saved) {
      try {
        const parsed: Hall[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map(h => h.hallId));
        const missing = INITIAL_HALLS.filter(h => !existingIds.has(h.hallId));
        if (missing.length > 0) {
          return [...parsed, ...missing];
        }
        return parsed;
      } catch (e) {
        console.error("Failed to parse halls", e);
      }
    }
    return INITIAL_HALLS;
  });

  // 5. Hall Class Mapping
  const [hallClassMaps, setHallClassMaps] = useState<HallClassMapItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HALL_MAPS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse hall maps", e);
      }
    }
    return INITIAL_HALL_CLASS_MAPS;
  });

  // 6. Sitting Plans
  const [sittingPlans, setSittingPlans] = useState<Record<string, SittingArrangement>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SITTING_PLANS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse sitting plans", e);
      }
    }
    return {};
  });

  // 7. Attendance
  const [attendanceRecords, setAttendanceRecords] = useState<ExamAttendanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse attendance", e);
      }
    }
    return [];
  });

  // 8. Activity Logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse logs", e);
      }
    }
    return INITIAL_ACTIVITY_LOGS;
  });

  // Persistence hooks
  useEffect(() => {
    if (adminUser) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, adminUser);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    }
  }, [adminUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HALLS, JSON.stringify(halls));
  }, [halls]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HALL_MAPS, JSON.stringify(hallClassMaps));
  }, [hallClassMaps]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SITTING_PLANS, JSON.stringify(sittingPlans));
  }, [sittingPlans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(activityLogs));
  }, [activityLogs]);

  // Activity logger
  const logActivity = (action: string, studentId?: string, className?: string, details?: string) => {
    const newLog: ActivityLog = {
      id: generateUuid(),
      timestamp: new Date().toISOString(),
      admin: adminUser || 'SYSTEM',
      action,
      studentId: studentId || '',
      className: className || '',
      details: details || ''
    };
    setActivityLogs(prev => [newLog, ...prev.slice(0, 199)]);
  };

  // Auth methods
  const login = (username: string, pass: string) => {
    if (username.trim() === settings.adminUsername && pass === settings.adminPasswordHash) {
      setAdminUser(username.trim());
      logActivity('LOGIN', '', '', `Admin ${username.trim()} logged in`);
      return { success: true };
    }
    return { success: false, message: 'Invalid username or password.' };
  };

  const logout = () => {
    if (adminUser) {
      logActivity('LOGOUT', '', '', `Admin ${adminUser} logged out`);
    }
    setAdminUser(null);
  };

  const updateAdminCredentials = (username: string, pass: string) => {
    setSettings(prev => ({
      ...prev,
      adminUsername: username.trim(),
      adminPasswordHash: pass
    }));
    setAdminUser(username.trim());
    logActivity('CREDENTIALS_UPDATED', '', '', `Updated credentials for ${username.trim()}`);
  };

  // Settings
  const saveSettings = (exam: string, session: string) => {
    setSettings(prev => ({
      ...prev,
      defaultExam: exam,
      defaultSession: session
    }));
    logActivity('SETTINGS_UPDATED', '', '', `Default exam: ${exam}, session: ${session}`);
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    logActivity('SETTINGS_UPDATED', '', '', 'Institutional configuration updated.');
  };

  // Students Helpers
  const getStudentsByClass = (className?: string): Student[] => {
    if (!className || className === 'ALL') {
      return [...students].sort((a, b) => a.className.localeCompare(b.className) || Number(a.rollNo) - Number(b.rollNo));
    }
    return students
      .filter(s => s.className === className)
      .sort((a, b) => Number(a.rollNo) - Number(b.rollNo));
  };

  const getStudentByRecordKey = (recordKey: string): Student | undefined => {
    return students.find(s => s.recordKey === recordKey);
  };

  const getStudentByStudentId = (studentId: string): Student | undefined => {
    return students.find(s => s.studentId.toUpperCase() === studentId.toUpperCase().trim());
  };

  const checkDuplicates = (data: Partial<Student>, excludeRecordKey?: string): string[] => {
    const warnings: string[] = [];
    const admission = (data.admissionNo || '').trim().toLowerCase();
    const contact = (data.contact || '').trim().replace(/\D/g, '');
    const name = (data.name || '').trim().toLowerCase();
    const father = (data.fatherName || '').trim().toLowerCase();

    students.forEach(s => {
      if (excludeRecordKey && s.recordKey === excludeRecordKey) return;

      if (admission && s.admissionNo.trim().toLowerCase() === admission) {
        warnings.push(`Admission No. already exists: ${s.studentId} (${s.name}, ${s.className})`);
      }
      if (contact && s.contact.replace(/\D/g, '') === contact) {
        warnings.push(`Contact No. already exists: ${s.studentId} (${s.name}, ${s.className})`);
      }
      if (
        name &&
        father &&
        s.name.trim().toLowerCase() === name &&
        s.fatherName.trim().toLowerCase() === father
      ) {
        warnings.push(`Same Student Name + Father's Name found: ${s.studentId} (${s.className})`);
      }
    });

    return warnings;
  };

  // Resequence a specific class
  const resequenceClassList = (allStudents: Student[], className: string): Student[] => {
    const classStudents = allStudents
      .filter(s => s.className === className)
      .sort((a, b) => Number(a.rollNo) - Number(b.rollNo));

    const updatedClassStudents = classStudents.map((student, idx) => {
      const rollNumber = idx + 1;
      return {
        ...student,
        rollNo: formatRoll(rollNumber),
        studentId: makeStudentId(className, rollNumber)
      };
    });

    const otherStudents = allStudents.filter(s => s.className !== className);
    return [...otherStudents, ...updatedClassStudents];
  };

  const addStudent = (
    data: Omit<Student, 'rollNo' | 'studentId' | 'recordKey'>,
    confirmed = false
  ) => {
    if (!data.className || !data.name.trim()) {
      return { success: false, warnings: ['Class and Student Name are required.'] };
    }

    const warnings = checkDuplicates(data);
    if (warnings.length > 0 && !confirmed) {
      return { success: false, requiresConfirmation: true, warnings };
    }

    const currentClassStudents = students.filter(s => s.className === data.className);
    const nextRoll = currentClassStudents.length + 1;
    const rollNo = formatRoll(nextRoll);
    const studentId = makeStudentId(data.className, nextRoll);
    const recordKey = generateUuid();

    const newStudent: Student = {
      ...data,
      rollNo,
      studentId,
      recordKey
    };

    setStudents(prev => [...prev, newStudent]);
    logActivity('ADD_STUDENT', studentId, data.className, `Student added: ${data.name}`);

    return { success: true, student: newStudent };
  };

  const updateStudent = (data: Student, confirmed = false) => {
    const existing = students.find(s => s.recordKey === data.recordKey);
    if (!existing) {
      return { success: false, warnings: ['Student not found.'] };
    }

    const warnings = checkDuplicates(data, data.recordKey);
    if (warnings.length > 0 && !confirmed) {
      return { success: false, requiresConfirmation: true, warnings };
    }

    // Check if class changed (move student)
    if (existing.className !== data.className) {
      // Remove from old class, resequence old class
      const remainingWithoutOld = students.filter(s => s.recordKey !== data.recordKey);
      const resequencedOld = resequenceClassList(remainingWithoutOld, existing.className);

      // Add to new class as last roll
      const targetClassStudents = resequencedOld.filter(s => s.className === data.className);
      const newRoll = targetClassStudents.length + 1;
      const newRollNo = formatRoll(newRoll);
      const newStudentId = makeStudentId(data.className, newRoll);

      const movedStudent: Student = {
        ...data,
        className: data.className,
        rollNo: newRollNo,
        studentId: newStudentId
      };

      setStudents([...resequencedOld, movedStudent]);
      logActivity(
        'MOVE_STUDENT',
        newStudentId,
        data.className,
        `Student moved from ${existing.className} to ${data.className}: ${data.name}`
      );
      return { success: true, student: movedStudent };
    }

    // Normal update within same class
    const updatedList = students.map(s => (s.recordKey === data.recordKey ? data : s));
    setStudents(updatedList);
    logActivity('UPDATE_STUDENT', data.studentId, data.className, `Student updated: ${data.name}`);
    return { success: true, student: data };
  };

  const deleteStudent = (recordKey: string) => {
    const target = students.find(s => s.recordKey === recordKey);
    if (!target) {
      return { success: false, message: 'Student not found.' };
    }

    const remaining = students.filter(s => s.recordKey !== recordKey);
    const resequenced = resequenceClassList(remaining, target.className);

    setStudents(resequenced);
    logActivity('DELETE_STUDENT', target.studentId, target.className, `Deleted: ${target.name}`);
    return {
      success: true,
      message: `Student ${target.name} (${target.studentId}) deleted and roll numbers resequenced.`
    };
  };

  const searchStudents = (query: string): Student[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return students.filter(s => {
      const searchSpace = [
        s.studentId,
        s.name,
        s.fatherName,
        s.contact,
        s.admissionNo,
        s.rollNo,
        s.className,
        s.address,
        s.remarks
      ];
      return searchSpace.some(field => (field || '').toLowerCase().includes(q));
    });
  };

  // Promotion
  const promoteStudent = (recordKey: string, targetClass: string, confirmed = false) => {
    const student = students.find(s => s.recordKey === recordKey);
    if (!student) {
      return { success: false, warnings: ['Student not found.'] };
    }
    if (student.className === targetClass) {
      return { success: false, warnings: ['Target class is the same as current class.'] };
    }

    const warnings = checkDuplicates(student, student.recordKey);
    if (warnings.length > 0 && !confirmed) {
      return { success: false, requiresConfirmation: true, warnings };
    }

    return updateStudent({ ...student, className: targetClass }, true);
  };

  const promoteClass = (sourceClass: string, targetClass: string, confirmed = false) => {
    if (sourceClass === targetClass) {
      return { success: false, message: 'Source and target classes cannot be the same.' };
    }

    const sourceStudents = students
      .filter(s => s.className === sourceClass)
      .sort((a, b) => Number(a.rollNo) - Number(b.rollNo));

    if (sourceStudents.length === 0) {
      return { success: true, moved: 0, message: 'No students found in source class.' };
    }

    // Check duplicates if needed
    const warnings: string[] = [];
    sourceStudents.forEach(s => {
      const w = checkDuplicates(s, s.recordKey);
      warnings.push(...w);
    });

    if (warnings.length > 0 && !confirmed) {
      return { success: false, requiresConfirmation: true, warnings };
    }

    // Remove source students from main list
    const otherStudents = students.filter(s => s.className !== sourceClass);

    // Get current target class students count
    const existingTargetStudents = otherStudents.filter(s => s.className === targetClass);
    let nextRoll = existingTargetStudents.length + 1;

    const promotedStudents: Student[] = sourceStudents.map(s => {
      const rollNumber = nextRoll++;
      return {
        ...s,
        className: targetClass,
        rollNo: formatRoll(rollNumber),
        studentId: makeStudentId(targetClass, rollNumber)
      };
    });

    setStudents([...otherStudents, ...promotedStudents]);
    logActivity(
      'PROMOTION_BULK',
      '',
      targetClass,
      `${sourceStudents.length} students promoted from ${sourceClass} to ${targetClass}`
    );

    return {
      success: true,
      moved: sourceStudents.length,
      message: `${sourceStudents.length} students promoted from ${sourceClass} to ${targetClass} successfully.`
    };
  };

  // Halls
  const saveHall = (hallData: Omit<Hall, 'capacity'>) => {
    const capacity = hallData.rows * hallData.columns;
    const fullHall: Hall = {
      ...hallData,
      capacity
    };

    setHalls(prev => {
      const exists = prev.findIndex(h => h.hallId === hallData.hallId);
      if (exists >= 0) {
        const copy = [...prev];
        copy[exists] = fullHall;
        return copy;
      }
      return [...prev, fullHall];
    });

    logActivity('HALL_SAVED', '', '', `${hallData.hallId} (${hallData.hallName}) capacity: ${capacity}`);
    return { success: true };
  };

  const deleteHall = (hallId: string) => {
    setHalls(prev => prev.filter(h => h.hallId !== hallId));
    logActivity('HALL_DELETED', '', '', `Deleted hall ${hallId}`);
    return { success: true };
  };

  // Hall Class Mapping
  const getHallClasses = (exam: string, session: string, hallId?: string) => {
    return hallClassMaps
      .filter(m => m.exam === exam && m.session === session && (!hallId || m.hallId === hallId) && m.active)
      .sort((a, b) => a.order - b.order);
  };

  const setHallClasses = (exam: string, session: string, hallId: string, classList: string[]) => {
    const hall = halls.find(h => h.hallId === hallId);
    if (!hall) {
      return { success: false };
    }

    const remainingMaps = hallClassMaps.filter(
      m => !(m.exam === exam && m.session === session && m.hallId === hallId)
    );

    const newMappings: HallClassMapItem[] = classList.map((cls, idx) => ({
      exam,
      session,
      hallId: hall.hallId,
      hallName: hall.hallName,
      className: cls,
      order: idx + 1,
      active: true
    }));

    setHallClassMaps([...remainingMaps, ...newMappings]);
    logActivity(
      'HALL_CLASS_MAP',
      '',
      '',
      `${hallId} mapped to classes: ${classList.join(', ')} for ${exam} (${session})`
    );
    return { success: true };
  };

  // Sitting Arrangement
  const getSittingPlan = (exam: string, session: string, hallId: string): SittingArrangement | undefined => {
    const key = `${exam}_${session}_${hallId}`;
    return sittingPlans[key];
  };

  const clearSittingPlan = (exam: string, session: string, hallId: string) => {
    const key = `${exam}_${session}_${hallId}`;
    setSittingPlans(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    logActivity('SITTING_CLEARED', '', '', `Seating plan cleared for ${exam} / ${session} / ${hallId}`);
  };

  const getRemainingStudentsForClass = (
    exam: string,
    session: string,
    className: string,
    excludeHallId?: string
  ): Student[] => {
    const classStudents = getStudentsByClass(className);
    const seatedKeys = new Set<string>();
    (Object.values(sittingPlans) as SittingArrangement[]).forEach(plan => {
      if (plan.exam === exam && plan.session === session && (!excludeHallId || plan.hallId !== excludeHallId)) {
        plan.seats.forEach(seat => {
          if (seat.recordKey && seat.studentName.trim() !== '') {
            seatedKeys.add(seat.recordKey);
          }
        });
      }
    });
    return classStudents.filter(s => !seatedKeys.has(s.recordKey));
  };

  const getClassSeatingStatus = (exam: string, session: string): Record<string, ClassSeatingStatus> => {
    const statusMap: Record<string, ClassSeatingStatus> = {};

    settings.classes.forEach(cls => {
      const total = getStudentsByClass(cls).length;
      statusMap[cls] = {
        className: cls,
        totalStudents: total,
        seatedCount: 0,
        remainingCount: total,
        allocations: []
      };
    });

    (Object.values(sittingPlans) as SittingArrangement[]).forEach(plan => {
      if (plan.exam === exam && plan.session === session) {
        const countsByClassInHall: Record<string, number> = {};
        plan.seats.forEach(seat => {
          if (seat.className && seat.studentName.trim() !== '') {
            countsByClassInHall[seat.className] = (countsByClassInHall[seat.className] || 0) + 1;
          }
        });

        Object.entries(countsByClassInHall).forEach(([cls, cnt]) => {
          if (!statusMap[cls]) {
            statusMap[cls] = {
              className: cls,
              totalStudents: getStudentsByClass(cls).length,
              seatedCount: 0,
              remainingCount: getStudentsByClass(cls).length,
              allocations: []
            };
          }
          statusMap[cls].seatedCount += cnt;
          statusMap[cls].remainingCount = Math.max(0, statusMap[cls].totalStudents - statusMap[cls].seatedCount);
          statusMap[cls].allocations.push({
            hallId: plan.hallId,
            hallName: plan.hallName,
            count: cnt
          });
        });
      }
    });

    return statusMap;
  };

  const generateSitting = (
    exam: string,
    session: string,
    hallId: string,
    algorithm: 'ROUND_ROBIN' | 'CLASS_WISE',
    fillDirection: 'COLUMNS_FIRST' | 'ROWS_FIRST' = 'COLUMNS_FIRST'
  ) => {
    const hall = halls.find(h => h.hallId === hallId);
    if (!hall) {
      return { success: false, message: 'Hall not found.' };
    }

    const assigned = getHallClasses(exam, session, hallId);
    if (!assigned.length) {
      return { success: false, message: 'No classes assigned to this hall. Please assign classes first in Hall Class Assignment.' };
    }

    // 1. Gather remaining unseated students for each assigned class (excluding current hall so re-runs work)
    const studentsByClass: Record<string, Student[]> = {};
    let totalEligible = 0;
    assigned.forEach(a => {
      const unseated = getRemainingStudentsForClass(exam, session, a.className, hallId);
      studentsByClass[a.className] = unseated;
      totalEligible += unseated.length;
    });

    if (totalEligible === 0) {
      return {
        success: false,
        message: 'All students of the selected classes are already seated in previous halls!'
      };
    }

    // 2. Arrange student order by algorithm
    const allStudents: Student[] = [];
    if (algorithm === 'CLASS_WISE') {
      assigned.forEach(a => {
        (studentsByClass[a.className] || []).forEach(s => {
          allStudents.push(s);
        });
      });
    } else {
      // ROUND_ROBIN algorithm: interleaves students from assigned classes
      let remaining = true;
      let index = 0;
      while (remaining) {
        remaining = false;
        assigned.forEach(a => {
          const arr = studentsByClass[a.className] || [];
          if (index < arr.length) {
            allStudents.push(arr[index]);
            remaining = true;
          }
        });
        index++;
      }
    }

    // 3. Hall capacity slice: fill hall from beginning (R1C1) up to capacity; remaining roll over!
    const capacity = hall.rows * hall.columns;
    const seatedStudents = allStudents.slice(0, capacity);
    const overflowStudents = allStudents.slice(capacity);

    const seatMap: Record<string, SittingSeat> = {};
    const doorPositions = (hall.doorPosition || '').toUpperCase().split(',').map(s => s.trim());
    const windowPositions = (hall.windowPosition || '').toUpperCase().split(',').map(s => s.trim());

    for (let r = 1; r <= hall.rows; r++) {
      for (let c = 1; c <= hall.columns; c++) {
        const seatNo = `R${r}C${c}`;
        let doorWindow = '';
        if (doorPositions.includes(seatNo.toUpperCase())) {
          doorWindow = 'DOOR';
        }
        if (windowPositions.includes(seatNo.toUpperCase())) {
          doorWindow += (doorWindow ? ' / ' : '') + 'WINDOW';
        }

        seatMap[seatNo] = {
          seatNo,
          row: r,
          column: c,
          className: '',
          rollNo: '',
          studentId: '',
          studentName: '',
          recordKey: '',
          locked: false,
          doorWindow
        };
      }
    }

    if (fillDirection === 'COLUMNS_FIRST') {
      let studentIndex = 0;
      for (let c = 1; c <= hall.columns; c++) {
        for (let r = 1; r <= hall.rows; r++) {
          const seatNo = `R${r}C${c}`;
          const student = seatedStudents[studentIndex];
          if (student && seatMap[seatNo]) {
            seatMap[seatNo].className = student.className;
            seatMap[seatNo].rollNo = student.rollNo;
            seatMap[seatNo].studentId = student.studentId;
            seatMap[seatNo].studentName = student.name;
            seatMap[seatNo].recordKey = student.recordKey;
            studentIndex++;
          }
        }
      }
    } else {
      let studentIndex = 0;
      for (let r = 1; r <= hall.rows; r++) {
        for (let c = 1; c <= hall.columns; c++) {
          const seatNo = `R${r}C${c}`;
          const student = seatedStudents[studentIndex];
          if (student && seatMap[seatNo]) {
            seatMap[seatNo].className = student.className;
            seatMap[seatNo].rollNo = student.rollNo;
            seatMap[seatNo].studentId = student.studentId;
            seatMap[seatNo].studentName = student.name;
            seatMap[seatNo].recordKey = student.recordKey;
            studentIndex++;
          }
        }
      }
    }

    const seats: SittingSeat[] = [];
    for (let r = 1; r <= hall.rows; r++) {
      for (let c = 1; c <= hall.columns; c++) {
        seats.push(seatMap[`R${r}C${c}`]);
      }
    }

    const planKey = `${exam}_${session}_${hallId}`;
    const newPlan: SittingArrangement = {
      exam,
      session,
      hallId: hall.hallId,
      hallName: hall.hallName,
      locked: false,
      algorithm,
      fillDirection,
      seats,
      updatedAt: new Date().toISOString(),
      totalAssigned: allStudents.length,
      overflowCount: overflowStudents.length
    };

    setSittingPlans(prev => ({
      ...prev,
      [planKey]: newPlan
    }));

    logActivity(
      'SITTING_GENERATED',
      '',
      '',
      `${exam} / ${session} / ${hallId} generated using ${algorithm} (${seatedStudents.length} seated, ${overflowStudents.length} remaining)`
    );

    return {
      success: true,
      students: seatedStudents.length,
      capacity,
      overflowCount: overflowStudents.length,
      overflowStudents: overflowStudents.map(s => ({
        recordKey: s.recordKey,
        name: s.name,
        rollNo: s.rollNo,
        className: s.className,
        studentId: s.studentId
      })),
      message: overflowStudents.length > 0
        ? `Hall filled to capacity with ${seatedStudents.length} students (${hall.rows}x${hall.columns}). ${overflowStudents.length} remaining students will be allocated to the next hall.`
        : `Successfully seated all ${seatedStudents.length} students in ${hall.hallName} (${capacity - seatedStudents.length} vacant desks).`
    };
  };

  const swapSeats = (exam: string, session: string, hallId: string, seatA: string, seatB: string) => {
    const key = `${exam}_${session}_${hallId}`;
    const plan = sittingPlans[key];
    if (!plan) return { success: false, message: 'Sitting plan not found.' };
    if (plan.locked) return { success: false, message: 'Sitting arrangement is locked. Unlock to make changes.' };

    const idxA = plan.seats.findIndex(s => s.seatNo === seatA);
    const idxB = plan.seats.findIndex(s => s.seatNo === seatB);
    if (idxA === -1 || idxB === -1) return { success: false, message: 'Seat not found.' };

    const newSeats = [...plan.seats];
    const a = newSeats[idxA];
    const b = newSeats[idxB];

    // Swap student attributes only, retain row/col/seatNo/doorWindow
    newSeats[idxA] = {
      ...a,
      className: b.className,
      rollNo: b.rollNo,
      studentId: b.studentId,
      studentName: b.studentName,
      recordKey: b.recordKey
    };
    newSeats[idxB] = {
      ...b,
      className: a.className,
      rollNo: a.rollNo,
      studentId: a.studentId,
      studentName: a.studentName,
      recordKey: a.recordKey
    };

    setSittingPlans(prev => ({
      ...prev,
      [key]: {
        ...plan,
        seats: newSeats,
        updatedAt: new Date().toISOString()
      }
    }));

    logActivity('SEATS_SWAPPED', '', '', `${hallId}: ${seatA} ↔ ${seatB}`);
    return { success: true };
  };

  const emptySeat = (exam: string, session: string, hallId: string, seatNo: string) => {
    const key = `${exam}_${session}_${hallId}`;
    const plan = sittingPlans[key];
    if (!plan) return { success: false, message: 'Sitting plan not found.' };
    if (plan.locked) return { success: false, message: 'Sitting arrangement is locked.' };

    const idx = plan.seats.findIndex(s => s.seatNo === seatNo);
    if (idx === -1) return { success: false, message: 'Seat not found.' };

    const newSeats = [...plan.seats];
    const current = newSeats[idx];
    const clearedStudent = current.studentName;

    newSeats[idx] = {
      ...current,
      className: '',
      rollNo: '',
      studentId: '',
      studentName: '',
      recordKey: ''
    };

    setSittingPlans(prev => ({
      ...prev,
      [key]: {
        ...plan,
        seats: newSeats,
        updatedAt: new Date().toISOString()
      }
    }));

    logActivity('SEAT_EMPTIED', '', '', `${hallId}: ${seatNo} cleared (was ${clearedStudent})`);
    return { success: true };
  };

  const lockSitting = (exam: string, session: string, hallId: string) => {
    const key = `${exam}_${session}_${hallId}`;
    const plan = sittingPlans[key];
    if (!plan) return { success: false };

    const newSeats = plan.seats.map(s => ({ ...s, locked: true }));
    setSittingPlans(prev => ({
      ...prev,
      [key]: {
        ...plan,
        locked: true,
        seats: newSeats,
        updatedAt: new Date().toISOString()
      }
    }));

    logActivity('SITTING_LOCKED', '', '', `${hallId} / ${exam} / ${session}`);
    return { success: true };
  };

  const unlockSitting = (exam: string, session: string, hallId: string) => {
    const key = `${exam}_${session}_${hallId}`;
    const plan = sittingPlans[key];
    if (!plan) return { success: false };

    const newSeats = plan.seats.map(s => ({ ...s, locked: false }));
    setSittingPlans(prev => ({
      ...prev,
      [key]: {
        ...plan,
        locked: false,
        seats: newSeats,
        updatedAt: new Date().toISOString()
      }
    }));

    logActivity('SITTING_UNLOCKED', '', '', `${hallId} / ${exam} / ${session}`);
    return { success: true };
  };

  // Exam Attendance
  const generateAttendance = (exam: string, session: string, hallId: string, subject: string) => {
    if (!exam || !session || !subject.trim()) {
      return { success: false, generated: 0, message: 'Exam, Session and Subject are required.' };
    }

    // Collect relevant sitting plans
    let targetPlans: SittingArrangement[] = [];
    if (!hallId || hallId === 'ALL') {
      targetPlans = (Object.values(sittingPlans) as SittingArrangement[]).filter(
        p => p.exam === exam && p.session === session
      );
    } else {
      const single = getSittingPlan(exam, session, hallId);
      if (single) targetPlans = [single];
    }

    if (!targetPlans.length) {
      return {
        success: false,
        generated: 0,
        message: 'No sitting arrangement found for selected exam/session/hall. Generate sitting arrangement first.'
      };
    }

    let serial = attendanceRecords.length + 1;
    const newRecords: ExamAttendanceRecord[] = [];

    targetPlans.forEach(plan => {
      const occupiedSeats = plan.seats
        .filter(s => s.studentName.trim() !== '')
        .sort((a, b) => a.row - b.row || a.column - b.column);

      occupiedSeats.forEach(seat => {
        newRecords.push({
          sNo: serial++,
          exam,
          session,
          hall: plan.hallName || plan.hallId,
          seatNo: seat.seatNo,
          className: seat.className,
          rollNo: seat.rollNo,
          studentName: seat.studentName,
          subject: subject.trim(),
          signature: '',
          createdAt: new Date().toISOString()
        });
      });
    });

    if (!newRecords.length) {
      return { success: false, generated: 0, message: 'No seated students found in the sitting plan.' };
    }

    setAttendanceRecords(prev => [...prev, ...newRecords]);
    logActivity(
      'ATTENDANCE_GENERATED',
      '',
      '',
      `${exam} / ${session} / ${hallId || 'ALL'} / ${subject} (${newRecords.length} records generated)`
    );

    return {
      success: true,
      generated: newRecords.length
    };
  };

  const clearAttendanceForSubject = (exam: string, session: string, subject: string) => {
    setAttendanceRecords(prev =>
      prev.filter(r => !(r.exam === exam && r.session === session && r.subject === subject))
    );
  };

  // Reset to default
  const resetToDefaults = () => {
    setStudents(INITIAL_STUDENTS);
    setHalls(INITIAL_HALLS);
    setHallClassMaps(INITIAL_HALL_CLASS_MAPS);
    setSittingPlans({});
    setAttendanceRecords([]);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setSettings(DEFAULT_SETTINGS);
    logActivity('SYSTEM_RESET', '', '', 'Restored default school starter dataset.');
  };

  // JSON Backup / Export
  const exportDataJSON = (): string => {
    const bundle = {
      exportDate: new Date().toISOString(),
      schoolName: settings.schoolName,
      settings,
      students,
      halls,
      hallClassMaps,
      sittingPlans,
      attendanceRecords,
      activityLogs
    };
    return JSON.stringify(bundle, null, 2);
  };

  const importDataJSON = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.students && Array.isArray(data.students)) setStudents(data.students);
      if (data.halls && Array.isArray(data.halls)) setHalls(data.halls);
      if (data.hallClassMaps && Array.isArray(data.hallClassMaps)) setHallClassMaps(data.hallClassMaps);
      if (data.sittingPlans) setSittingPlans(data.sittingPlans);
      if (data.attendanceRecords && Array.isArray(data.attendanceRecords)) setAttendanceRecords(data.attendanceRecords);
      if (data.settings) setSettings(data.settings);
      logActivity('DATA_IMPORTED', '', '', 'Imported external backup JSON dataset.');
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Invalid JSON backup file structure.' };
    }
  };

  return (
    <SchoolContext.Provider
      value={{
        adminUser,
        currentUser: adminUser,
        login,
        logout,
        updateAdminCredentials,
        settings,
        saveSettings,
        updateSettings,
        resetAllData: resetToDefaults,
        students,
        getStudentsByClass,
        getStudentByRecordKey,
        getStudentByStudentId,
        checkDuplicates,
        addStudent,
        updateStudent,
        deleteStudent,
        searchStudents,
        promoteStudent,
        promoteClass,
        halls,
        saveHall,
        deleteHall,
        hallClassMaps,
        getHallClasses,
        setHallClasses,
        sittingPlans,
        generateSitting,
        getSittingPlan,
        clearSittingPlan,
        getRemainingStudentsForClass,
        getClassSeatingStatus,
        swapSeats,
        emptySeat,
        lockSitting,
        unlockSitting,
        attendanceRecords,
        generateAttendance,
        clearAttendanceForSubject,
        activityLogs,
        logActivity,
        resetToDefaults,
        exportDataJSON,
        importDataJSON
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};
