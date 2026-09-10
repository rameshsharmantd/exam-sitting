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
    const d = new Date(dateString + 'T00:00:00');
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
    date: '2026-03-16',
    day: 'Monday',
    time: '09:00 AM - 12:00 PM',
    classSubjects: {
      NUR: 'English Rhymes & Oral',
      LKG: 'English Written',
      UKG: 'English Written',
      I: 'Hindi',
      II: 'Hindi',
      III: 'Hindi',
      IV: 'Hindi',
      V: 'Hindi',
      VI: 'English',
      VII: 'English',
      VIII: 'English',
      IX: 'Social Science',
      X: 'Mathematics'
    }
  },
  {
    id: 'tt-entry-02',
    exam: CONFIG.DEFAULT_EXAM,
    session: CONFIG.DEFAULT_SESSION,
    date: '2026-03-18',
    day: 'Wednesday',
    time: '09:00 AM - 12:00 PM',
    classSubjects: {
      NUR: 'Hindi Rhymes & Oral',
      LKG: 'Hindi Written',
      UKG: 'Hindi Written',
      I: 'English',
      II: 'English',
      III: 'English',
      IV: 'English',
      V: 'English',
      VI: 'Mathematics',
      VII: 'Mathematics',
      VIII: 'Mathematics',
      IX: 'Science',
      X: 'Social Science'
    }
  },
  {
    id: 'tt-entry-03',
    exam: CONFIG.DEFAULT_EXAM,
    session: CONFIG.DEFAULT_SESSION,
    date: '2026-03-20',
    day: 'Friday',
    time: '09:00 AM - 12:00 PM',
    classSubjects: {
      NUR: 'Number Work & Oral',
      LKG: 'Mathematics',
      UKG: 'Mathematics',
      I: 'Mathematics',
      II: 'Mathematics',
      III: 'Mathematics',
      IV: 'Mathematics',
      V: 'Mathematics',
      VI: 'Science',
      VII: 'Science',
      VIII: 'Science',
      IX: 'Mathematics',
      X: 'Science'
    }
  },
  {
    id: 'tt-entry-04',
    exam: CONFIG.DEFAULT_EXAM,
    session: CONFIG.DEFAULT_SESSION,
    date: '2026-03-23',
    day: 'Monday',
    time: '09:00 AM - 12:00 PM',
    classSubjects: {
      NUR: 'Drawing & Colouring',
      LKG: 'Drawing & Colouring',
      UKG: 'Drawing & EVS',
      I: 'EVS / Drawing',
      II: 'EVS / Drawing',
      III: 'Environmental Studies',
      IV: 'Environmental Studies',
      V: 'Environmental Studies',
      VI: 'Social Science',
      VII: 'Social Science',
      VIII: 'Social Science',
      IX: 'Hindi Course-A',
      X: 'English Language'
    }
  },
  {
    id: 'tt-entry-05',
    exam: CONFIG.DEFAULT_EXAM,
    session: CONFIG.DEFAULT_SESSION,
    date: '2026-03-25',
    day: 'Wednesday',
    time: '09:00 AM - 12:00 PM',
    classSubjects: {
      NUR: 'General Knowledge & Conversation',
      LKG: 'General Knowledge',
      UKG: 'General Knowledge',
      I: 'Computer / GK',
      II: 'Computer / GK',
      III: 'Computer Applications',
      IV: 'Computer Applications',
      V: 'Computer Applications',
      VI: 'Sanskrit / Hindi',
      VII: 'Sanskrit / Hindi',
      VIII: 'Sanskrit / Hindi',
      IX: 'English Language',
      X: 'Hindi Course-A'
    }
  }
];
