import { ExamTimeTableEntry } from '../types';
import { CONFIG } from '../data/constants';

export const TIMETABLE_CLASSES = [
  'NUR',
  'LKG',
  'UKG',
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X'
] as const;

export type TimeTableClass = typeof TIMETABLE_CLASSES[number];

export type TimeTableGroupId = 'PRE_PRIMARY' | 'PRIMARY' | 'SECONDARY' | 'ALL';

export interface TimeTableGroup {
  id: TimeTableGroupId;
  label: string;
  hindiLabel: string;
  classes: string[];
}

export const TIMETABLE_GROUPS: Record<TimeTableGroupId, TimeTableGroup> = {
  PRE_PRIMARY: {
    id: 'PRE_PRIMARY',
    label: 'Pre-Primary (NUR, LKG, UKG)',
    hindiLabel: 'नर्सरी, LKG, UKG (एक साथ)',
    classes: ['NUR', 'LKG', 'UKG']
  },
  PRIMARY: {
    id: 'PRIMARY',
    label: 'Primary (Class I to V)',
    hindiLabel: 'कक्षा I से V (एक साथ)',
    classes: ['I', 'II', 'III', 'IV', 'V']
  },
  SECONDARY: {
    id: 'SECONDARY',
    label: 'Middle & Secondary (Class VI to X)',
    hindiLabel: 'कक्षा VI से X (एक साथ)',
    classes: ['VI', 'VII', 'VIII', 'IX', 'X']
  },
  ALL: {
    id: 'ALL',
    label: 'All Classes (NUR to X)',
    hindiLabel: 'सभी कक्षाएँ (NUR से X)',
    classes: [...TIMETABLE_CLASSES]
  }
};

/**
 * Normalizes section-wise student class (e.g. IA, IB, IIA, IXA, XA, 1st, 1-A)
 * into standard examination timetable class (I, II, IX, X, NUR, LKG, UKG)
 */
export function normalizeClassForTimeTable(className: string): string {
  if (!className) return '';
  let clean = className.trim().toUpperCase().replace(/[\s\-_]/g, '');
  // Remove prefixes like CLASS, STD, GRADE, SEC
  clean = clean.replace(/^(CLASS|STD|GRADE|SEC)/, '');

  if (clean.startsWith('NUR')) return 'NUR';
  if (clean.startsWith('LKG') || clean.startsWith('KG1')) return 'LKG';
  if (clean.startsWith('UKG') || clean.startsWith('KG2')) return 'UKG';

  // Roman numerals check (ordered from longest to shortest to prevent prefix collision)
  if (clean.startsWith('VIII')) return 'VIII';
  if (clean.startsWith('VII')) return 'VII';
  if (clean.startsWith('VI')) return 'VI';
  if (clean.startsWith('IV')) return 'IV';
  if (clean.startsWith('IX')) return 'IX';
  if (clean.startsWith('III')) return 'III';
  if (clean.startsWith('II')) return 'II';
  if (clean.startsWith('I') && !clean.startsWith('IX')) return 'I';
  if (clean.startsWith('X')) return 'X';
  if (clean.startsWith('V')) return 'V';

  // Digits check (e.g. 10A -> X, 9A -> IX, 1A -> I)
  if (clean.startsWith('10')) return 'X';
  if (clean.startsWith('9')) return 'IX';
  if (clean.startsWith('8')) return 'VIII';
  if (clean.startsWith('7')) return 'VII';
  if (clean.startsWith('6')) return 'VI';
  if (clean.startsWith('5')) return 'V';
  if (clean.startsWith('4')) return 'IV';
  if (clean.startsWith('3')) return 'III';
  if (clean.startsWith('2')) return 'II';
  if (clean.startsWith('1')) return 'I';

  return clean;
}

export function getDayNameWithHindi(dateString: string): string {
  if (!dateString) return '';
  try {
    // Handle DD-MM-YYYY or YYYY-MM-DD
    let parseable = dateString;
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      const [dd, mm, yyyy] = dateString.split('-');
      parseable = `${yyyy}-${mm}-${dd}`;
    }
    const d = new Date(parseable + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    const dayIndex = d.getDay();
    const days = [
      { en: 'Sunday', hi: 'रविवार' },
      { en: 'Monday', hi: 'सोमवार' },
      { en: 'Tuesday', hi: 'मंगलवार' },
      { en: 'Wednesday', hi: 'बुधवार' },
      { en: 'Thursday', hi: 'गुरुवार' },
      { en: 'Friday', hi: 'शुक्रवार' },
      { en: 'Saturday', hi: 'शनिवार' }
    ];
    return `${days[dayIndex].en} (${days[dayIndex].hi})`;
  } catch {
    return '';
  }
}

export function formatDisplayDate(dateString: string): string {
  if (!dateString) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [yyyy, mm, dd] = dateString.split('-');
    return `${dd}-${mm}-${yyyy}`;
  }
  return dateString;
}

export const DEFAULT_EXAM_NOTES: string[] = [
  'सभी परीक्षार्थी परीक्षा प्रारंभ होने से 15 मिनट पूर्व अपने निर्धारित परीक्षा कक्ष में अनिवार्य रूप से उपस्थित हों।',
  'प्रत्येक विद्यार्थी के पास अपना प्रवेश पत्र (Admit Card) व आवश्यक स्टेशनरी (पेन, पेंसिल, इरेज़र आदि) होना अनिवार्य है।',
  'परीक्षा कक्ष में मोबाइल फोन, स्मार्ट वॉच, डिजिटल गैजेट अथवा किसी भी प्रकार की अनुचित सामग्री लाना पूर्णतः वर्जित है।',
  'परीक्षा समय: प्रातः 09:00 बजे से दोपहर 12:00 बजे तक (प्रवेश: 08:45 AM)।',
  'अनुपस्थित रहने पर पुनर्परीक्षा का कोई प्रावधान नहीं होगा।'
];

export const INITIAL_TIMETABLE_ENTRIES: ExamTimeTableEntry[] = [
  {
    id: 'tt-entry-01',
    exam: CONFIG.DEFAULT_EXAM,
    session: CONFIG.DEFAULT_SESSION,
    date: '2025-09-19',
    day: 'FRIDAY',
    time: '09:00 AM - 12:00 PM',
    classSubjects: {
      NUR: 'ENGLISH ORAL & RHYMES',
      LKG: 'ENGLISH WRITTEN',
      UKG: 'ENGLISH WRITTEN',
      I: 'ENGLISH',
      II: 'ENGLISH',
      III: 'ENGLISH',
      IV: 'ENGLISH',
      V: 'ENGLISH',
      VI: 'ENGLISH',
      VII: 'SCIENCE',
      VIII: 'SCIENCE',
      IX: 'SOCIAL SCIENCE',
      X: 'MATH'
    }
  },
  {
    id: 'tt-entry-02',
    exam: CONFIG.DEFAULT_EXAM,
    session: CONFIG.DEFAULT_SESSION,
    date: '2025-09-20',
    day: 'SATURDAY',
    time: '09:00 AM - 12:00 PM',
    classSubjects: {
      NUR: 'HINDI ORAL & RHYMES',
      LKG: 'HINDI WRITTEN',
      UKG: 'HINDI WRITTEN',
      I: 'HINDI',
      II: 'HINDI',
      III: 'HINDI',
      IV: 'HINDI',
      V: 'HINDI',
      VI: 'SCIENCE',
      VII: 'ENGLISH',
      VIII: 'ENGLISH',
      IX: 'ENGLISH',
      X: 'HINDI'
    }
  },
  {
    id: 'tt-entry-03',
    exam: CONFIG.DEFAULT_EXAM,
    session: CONFIG.DEFAULT_SESSION,
    date: '2025-09-22',
    day: 'MONDAY',
    time: '09:00 AM - 12:00 PM',
    classSubjects: {
      NUR: 'MATH ORAL',
      LKG: 'MATHEMATICS',
      UKG: 'MATHEMATICS',
      I: 'MATH',
      II: 'MATH',
      III: 'MATH',
      IV: 'MATH',
      V: 'MATH',
      VI: 'SOCIAL SCIENCE',
      VII: 'MATH',
      VIII: 'MATH',
      IX: 'MATH',
      X: 'SCIENCE'
    }
  },
  {
    id: 'tt-entry-04',
    exam: CONFIG.DEFAULT_EXAM,
    session: CONFIG.DEFAULT_SESSION,
    date: '2025-09-23',
    day: 'TUESDAY',
    time: '09:00 AM - 12:00 PM',
    classSubjects: {
      NUR: 'DRAWING & COLOURING',
      LKG: 'DRAWING & COLOURING',
      UKG: 'DRAWING & EVS',
      I: 'EVS',
      II: 'EVS',
      III: 'EVS',
      IV: 'EVS',
      V: 'EVS',
      VI: 'HINDI',
      VII: 'HINDI',
      VIII: 'HINDI',
      IX: 'HINDI',
      X: 'ENGLISH'
    }
  },
  {
    id: 'tt-entry-05',
    exam: CONFIG.DEFAULT_EXAM,
    session: CONFIG.DEFAULT_SESSION,
    date: '2025-09-24',
    day: 'WEDNESDAY',
    time: '09:00 AM - 12:00 PM',
    classSubjects: {
      NUR: 'CONVERSATION & GK',
      LKG: 'GK & ORAL',
      UKG: 'GK & CONVERSATION',
      I: 'COMPUTER',
      II: 'COMPUTER',
      III: 'SOCIAL SCIENCE',
      IV: 'SOCIAL SCIENCE',
      V: 'SOCIAL SCIENCE',
      VI: 'MATH',
      VII: 'SOCIAL SCIENCE',
      VIII: 'SOCIAL SCIENCE',
      IX: 'SCIENCE',
      X: 'SOCIAL SCIENCE'
    }
  },
  {
    id: 'tt-entry-06',
    exam: CONFIG.DEFAULT_EXAM,
    session: CONFIG.DEFAULT_SESSION,
    date: '2025-09-25',
    day: 'THURSDAY',
    time: '09:00 AM - 12:00 PM',
    classSubjects: {
      NUR: 'ACTIVITY',
      LKG: 'ACTIVITY',
      UKG: 'ACTIVITY',
      I: 'DRAWING',
      II: 'DRAWING',
      III: 'COMPUTER',
      IV: 'COMPUTER',
      V: 'COMPUTER',
      VI: 'COMPUTER',
      VII: 'COMPUTER',
      VIII: 'COMPUTER',
      IX: 'COMPUTER',
      X: 'COMPUTER'
    }
  }
];

export const DEFAULT_TIMETABLE_SUBJECTS: string[] = [
  'ENGLISH',
  'HINDI',
  'MATH',
  'SCIENCE',
  'SOCIAL SCIENCE',
  'COMPUTER',
  'SANSKRIT',
  'EVS',
  'DRAWING',
  'GENERAL KNOWLEDGE',
  'ENGLISH WRITTEN',
  'ENGLISH ORAL & RHYMES',
  'HINDI WRITTEN',
  'HINDI ORAL & RHYMES',
  'MATH ORAL',
  'CONVERSATION & GK',
  'GK & ORAL',
  'GK & CONVERSATION',
  'MORAL SCIENCE',
  'PHYSICAL EDUCATION',
  'ART & CRAFT',
  'ACTIVITY',
  'URDU'
];
