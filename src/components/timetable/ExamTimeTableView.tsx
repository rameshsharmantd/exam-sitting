import React, { useState, useRef } from 'react';
import {
  Calendar,
  Clock,
  Printer,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Info,
  BookOpen,
  Sparkles,
  Save,
  RotateCcw,
  Check,
  Settings2,
  X,
  ChevronDown,
  Tag,
  ListFilter
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { ExamTimeTableEntry, ActiveSection } from '../../types';
import { HeaderPrint } from '../common/HeaderPrint';
import {
  TIMETABLE_CLASSES,
  TIMETABLE_GROUPS,
  TimeTableGroupId,
  getDayNameWithHindi,
  formatDisplayDate,
  INITIAL_TIMETABLE_ENTRIES
} from '../../utils/timetableUtils';
import { CONFIG } from '../../data/constants';

interface ExamTimeTableViewProps {
  onNavigate?: (section: ActiveSection) => void;
}

export const ExamTimeTableView: React.FC<ExamTimeTableViewProps> = ({ onNavigate }) => {
  const {
    settings,
    timeTableEntries,
    saveTimeTableEntry,
    deleteTimeTableEntry,
    resetTimeTableToDefault,
    examNotes,
    updateExamNotes,
    subjectList,
    addSubject,
    editSubject,
    deleteSubject,
    resetSubjectList
  } = useSchool();

  const [exam, setExam] = useState<string>(settings.defaultExam);
  const [session, setSession] = useState<string>(settings.defaultSession);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Subject Management State (विषय जोड़ें और संपादित करें)
  const [isSubjectManagerOpen, setIsSubjectManagerOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingSubjectOldName, setEditingSubjectOldName] = useState<string | null>(null);
  const [editingSubjectNewName, setEditingSubjectNewName] = useState('');
  const [subjectFeedback, setSubjectFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Print Modal State (Groups are exclusively for print)
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printGroup, setPrintGroup] = useState<TimeTableGroupId>('ALL');
  const [editingNotes, setEditingNotes] = useState<string[]>([...examNotes]);
  const [newNoteInput, setNewNoteInput] = useState('');
  const [isEditingNotesInPrint, setIsEditingNotesInPrint] = useState(false);

  // Editor Panel Ref for scrolling
  const editorRef = useRef<HTMLDivElement>(null);

  // Filter timetable for active exam & session
  const currentEntries = timeTableEntries
    .filter(e => e.exam === exam && e.session === session)
    .sort((a, b) => a.date.localeCompare(b.date));

  function getStandardDay(dateStr: string): string {
    if (!dateStr) return '';
    try {
      let parseable = dateStr;
      if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
        const [dd, mm, yyyy] = dateStr.split('-');
        parseable = `${yyyy}-${mm}-${dd}`;
      }
      const parts = parseable.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
      }
    } catch {
      // ignore
    }
    return '';
  }

  // Active form data for setting / editing date & class subjects
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<{
    id?: string;
    date: string;
    day: string;
    time: string;
    classSubjects: Record<string, string>;
  }>(() => {
    // Default to first entry if available, or today
    const first = currentEntries[0];
    if (first) {
      const initialSubs: Record<string, string> = {};
      TIMETABLE_CLASSES.forEach(cls => {
        initialSubs[cls] = first.classSubjects[cls] || '';
      });
      return {
        id: first.id,
        date: first.date,
        day: first.day || getStandardDay(first.date),
        time: first.time || '09:00 AM - 12:00 PM',
        classSubjects: initialSubs
      };
    }
    const today = '2025-09-19';
    const initialSubs: Record<string, string> = {};
    TIMETABLE_CLASSES.forEach(cls => {
      initialSubs[cls] = '';
    });
    return {
      date: today,
      day: getStandardDay(today),
      time: '09:00 AM - 12:00 PM',
      classSubjects: initialSubs
    };
  });

  const handleDateChange = (newDate: string) => {
    const existing = currentEntries.find(e => e.date === newDate);
    const day = getStandardDay(newDate);
    if (existing) {
      const fullSubs: Record<string, string> = {};
      TIMETABLE_CLASSES.forEach(cls => {
        fullSubs[cls] = existing.classSubjects[cls] || '';
      });
      setFormData({
        id: existing.id,
        date: existing.date,
        day: existing.day || day,
        time: existing.time || '09:00 AM - 12:00 PM',
        classSubjects: fullSubs
      });
      setIsEditing(true);
    } else {
      setFormData(prev => ({
        ...prev,
        id: undefined,
        date: newDate,
        day: day
      }));
      setIsEditing(false);
    }
  };

  const handleSubjectChange = (cls: string, val: string) => {
    setFormData(prev => ({
      ...prev,
      classSubjects: {
        ...prev.classSubjects,
        [cls]: val
      }
    }));
  };

  const handleQuickFillAll = (subject: string) => {
    setFormData(prev => {
      const nextSubs = { ...prev.classSubjects };
      TIMETABLE_CLASSES.forEach(cls => {
        nextSubs[cls] = subject;
      });
      return { ...prev, classSubjects: nextSubs };
    });
  };

  const handleQuickFillGroup = (groupId: TimeTableGroupId, subject: string) => {
    const targetClasses = TIMETABLE_GROUPS[groupId].classes;
    setFormData(prev => {
      const nextSubs = { ...prev.classSubjects };
      targetClasses.forEach(cls => {
        nextSubs[cls] = subject;
      });
      return { ...prev, classSubjects: nextSubs };
    });
  };

  const handleStartEdit = (entry: ExamTimeTableEntry) => {
    const fullSubs: Record<string, string> = {};
    TIMETABLE_CLASSES.forEach(cls => {
      fullSubs[cls] = entry.classSubjects[cls] || '';
    });

    setFormData({
      id: entry.id,
      date: entry.date,
      day: entry.day || getStandardDay(entry.date),
      time: entry.time || '09:00 AM - 12:00 PM',
      classSubjects: fullSubs
    });
    setIsEditing(true);
    setMessage({
      type: 'success',
      text: `Loaded exam schedule for ${formatDisplayDate(entry.date)} (${entry.day}) in editor. Edit subjects below and click "Save Exam Schedule".`
    });

    // Smooth scroll to editor
    if (editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleResetForm = (newDateStr?: string) => {
    const dateToUse = newDateStr || new Date().toISOString().split('T')[0];
    const initialSubs: Record<string, string> = {};
    TIMETABLE_CLASSES.forEach(cls => {
      initialSubs[cls] = '';
    });
    setFormData({
      id: undefined,
      date: dateToUse,
      day: getStandardDay(dateToUse),
      time: '09:00 AM - 12:00 PM',
      classSubjects: initialSubs
    });
    setIsEditing(false);
  };

  const handleLoadOfficialSchedule = () => {
    resetTimeTableToDefault();
    setMessage({
      type: 'success',
      text: 'Official Examination Schedule (19-09-2025 to 25-09-2025) successfully loaded for all classes (NUR to X)!'
    });
    if (INITIAL_TIMETABLE_ENTRIES.length > 0) {
      handleStartEdit(INITIAL_TIMETABLE_ENTRIES[0]);
    }
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date) {
      setMessage({ type: 'error', text: 'Exam date is required.' });
      return;
    }

    const entryToSave: ExamTimeTableEntry = {
      id: formData.id || `tt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      exam,
      session,
      date: formData.date,
      day: (formData.day || getStandardDay(formData.date)).toUpperCase(),
      time: formData.time.trim() || '09:00 AM - 12:00 PM',
      classSubjects: formData.classSubjects
    };

    saveTimeTableEntry(entryToSave);
    setMessage({
      type: 'success',
      text: `Exam schedule for ${formatDisplayDate(entryToSave.date)} (${entryToSave.day}) successfully saved!`
    });

    setIsEditing(false);
  };

  const handleDeleteEntry = (id: string, date: string) => {
    if (window.confirm(`Are you sure you want to remove exam schedule for ${formatDisplayDate(date)}?`)) {
      deleteTimeTableEntry(id);
      setMessage({
        type: 'success',
        text: `Exam schedule entry for ${formatDisplayDate(date)} removed.`
      });
      if (formData.id === id) {
        handleResetForm();
      }
    }
  };

  // Notes management
  const handleAddNote = () => {
    if (newNoteInput.trim()) {
      const updated = [...editingNotes, newNoteInput.trim()];
      setEditingNotes(updated);
      updateExamNotes(updated);
      setNewNoteInput('');
    }
  };

  const handleRemoveNote = (idx: number) => {
    const updated = editingNotes.filter((_, i) => i !== idx);
    setEditingNotes(updated);
    updateExamNotes(updated);
  };

  // Subject Management Handlers
  const handleAddNewSubject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubjectName.trim()) return;
    const res = addSubject(newSubjectName);
    if (res.success) {
      setSubjectFeedback({
        type: 'success',
        text: `विषय "${newSubjectName.trim().toUpperCase()}" सफलतापूर्वक जोड़ा गया!`
      });
      setNewSubjectName('');
      setTimeout(() => setSubjectFeedback(null), 3500);
    } else {
      setSubjectFeedback({
        type: 'error',
        text: res.message || 'विषय जोड़ने में त्रुटि हुई।'
      });
    }
  };

  const handleSaveEditSubject = (oldName: string) => {
    if (!editingSubjectNewName.trim()) return;
    const res = editSubject(oldName, editingSubjectNewName);
    if (res.success) {
      // Also update local formData if it used this subject
      setFormData(prev => {
        let changed = false;
        const newSubs = { ...prev.classSubjects };
        Object.keys(newSubs).forEach(cls => {
          if (newSubs[cls] === oldName) {
            newSubs[cls] = editingSubjectNewName.trim().toUpperCase();
            changed = true;
          }
        });
        return changed ? { ...prev, classSubjects: newSubs } : prev;
      });
      setSubjectFeedback({
        type: 'success',
        text: `विषय "${oldName}" बदलकर "${editingSubjectNewName.trim().toUpperCase()}" कर दिया गया!`
      });
      setEditingSubjectOldName(null);
      setEditingSubjectNewName('');
      setTimeout(() => setSubjectFeedback(null), 3500);
    } else {
      setSubjectFeedback({
        type: 'error',
        text: res.message || 'विषय संपादित करने में त्रुटि हुई।'
      });
    }
  };

  const handleDeleteSubject = (name: string) => {
    if (window.confirm(`क्या आप विषय "${name}" को विषय सूची से हटाना चाहते हैं?`)) {
      deleteSubject(name);
      setSubjectFeedback({
        type: 'success',
        text: `विषय "${name}" हटा दिया गया।`
      });
      setTimeout(() => setSubjectFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Calendar className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Official Examination Time Table (परीक्षा समय-सारिणी)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-Primary (NUR, LKG, UKG), Primary (Class I - V), and Middle/Secondary (Class VI - X)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setEditingNotes([...examNotes]);
                setShowPrintModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Official Print / PDF Time Table</span>
            </button>

            {onNavigate && (
              <button
                onClick={() => onNavigate('attendance')}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Go to Exam Attendance Generator"
              >
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Attendance Registers</span>
              </button>
            )}
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Exam:</span>
              <input
                type="text"
                value={exam}
                onChange={e => setExam(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-blue-600 w-36"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Session:</span>
              <input
                type="text"
                value={session}
                onChange={e => setSession(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-blue-600 w-28"
              />
            </div>

            <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
              समस्त कक्षाएँ (NUR से X तक क्रमवार)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleLoadOfficialSchedule}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              title="Load 19-09-2025 to 25-09-2025 official exam timetable"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>19 से 25 सितम्बर सारिणी लोड करें</span>
            </button>

            <button
              type="button"
              onClick={() => handleResetForm()}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ नई परीक्षा तिथि</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. EXAM DATE, DAY, CLASS & SUBJECT SET/EDIT PANEL */}
      <div
        ref={editorRef}
        className="bg-white rounded-2xl border-2 border-blue-200 shadow-xs overflow-hidden"
      >
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-600 text-white">
              {isEditing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  {isEditing
                    ? `परीक्षा दिनांक, वार एवं विषय संपादित करें (Edit Schedule)`
                    : `परीक्षा दिनांक, वार एवं कक्षावार विषय सेट करें (Set Schedule)`}
                </h3>
                {isEditing && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black">
                    संपादित: {formatDisplayDate(formData.date)} ({formData.day})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                क्रम: 1. दिनांक चुनें → 2. वार (Day) → 3. कक्षावार विषय (NUR से X तक क्रमवार)। (ग्रुप केवल प्रिंट के लिए हैं)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                type="button"
                onClick={() => handleResetForm()}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>रद्द करें / नई प्रविष्टि</span>
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveEntry} className="p-6 space-y-6">
          {/* STEP 1: PAHLE DATE SELECT, USKE SATH DAY */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                  1
                </span>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
                  पहले दिनांक व वार चुनें (Step 1: Select Exam Date & Day):
                </h4>
              </div>

              {formData.date && (
                <div className="px-3 py-1 rounded-xl bg-blue-100/90 border border-blue-300 text-blue-900 text-xs font-black flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-blue-700" />
                  <span>
                    दिनांक: {formatDisplayDate(formData.date)} ({formData.day || getStandardDay(formData.date)})
                  </span>
                  <span className="text-slate-600 font-semibold">
                    [{getDayNameWithHindi(formData.date).split(' ')[1] || ''}]
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Date Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  📅 परीक्षा दिनांक (Exam Date) *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => handleDateChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-black text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                />
                <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                  फॉर्मेट: <strong>{formatDisplayDate(formData.date)}</strong>
                </span>
              </div>

              {/* Day Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  वार (Day of Week)
                </label>
                <input
                  type="text"
                  value={formData.day}
                  onChange={e => setFormData(prev => ({ ...prev, day: e.target.value.toUpperCase() }))}
                  placeholder="e.g. FRIDAY"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-slate-50 font-black text-blue-900 uppercase focus:outline-none focus:border-blue-600 shadow-2xs"
                />
                {formData.date && (
                  <span className="text-[10px] text-blue-700 font-bold mt-1 block">
                    {getDayNameWithHindi(formData.date)}
                  </span>
                )}
              </div>

              {/* Timing */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ⏰ परीक्षा समय (Exam Timing)
                </label>
                <input
                  type="text"
                  value={formData.time}
                  onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  placeholder="e.g. 09:00 AM - 12:00 PM"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
                />
                <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                  समय अंतराल (e.g. 09:00 AM - 12:00 PM)
                </span>
              </div>
            </div>

            {/* Quick Date Select Chips */}
            <div className="pt-2.5 border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold text-slate-600">
                  त्वरित दिनांक चयन (Click Date to Load):
                </span>
                {currentEntries.map(entry => {
                  const isSelected = formData.date === entry.date;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => handleStartEdit(entry)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400 hover:text-blue-700 shadow-2xs'
                      }`}
                    >
                      <Calendar className="w-3 h-3" />
                      <span>{formatDisplayDate(entry.date)}</span>
                      <span className={isSelected ? 'text-blue-200 text-[10px]' : 'text-slate-400 text-[10px]'}>
                        ({entry.day})
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => handleResetForm()}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50 flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ नई दिनांक जोड़ें</span>
                </button>
              </div>
            </div>
          </div>

          {/* STEP 2: USKE BAD CLASS FIR SUBJECT (NUR SE X TAK) - स्वतंत्र चयन व संपादन */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <span>कक्षा फिर विषय दर्ज करें (Step 2: Class-Wise Subjects - NUR से X तक):</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                      स्वतंत्र चयन व संपादन
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    प्रत्येक कक्षा के लिए स्वतंत्र रूप से विषय चुनें या लिखें • क्रम: NUR → LKG → UKG → I → ... → X
                  </p>
                </div>
              </div>

              {/* Subject Manager Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectManagerOpen(prev => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    isSubjectManagerOpen
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                  }`}
                  title="नया विषय जोड़ें या मौजूद विषय संपादित करें"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>विषय जोड़ें / एडिट करें ({subjectList.length})</span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${isSubjectManagerOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* EXPANDABLE SUBJECT MANAGER PANEL (विषय सूची संपादन एवं नया विषय जोड़ने का पैनल) */}
            {isSubjectManagerOpen && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/90 to-indigo-50/70 border border-blue-200 shadow-xs space-y-3 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-black text-blue-950 uppercase tracking-wide">
                      विषय सूची प्रबंधन (Subject Manager: Add, Edit, Delete):
                    </span>
                    <span className="text-[11px] font-semibold text-blue-700">
                      कुल {subjectList.length} विषय
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('क्या आप विषय सूची को डिफ़ॉल्ट विषयों पर रीसेट करना चाहते हैं?')) {
                          resetSubjectList();
                        }
                      }}
                      className="text-[11px] font-bold text-slate-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                      title="Reset to default subject list"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>डिफ़ॉल्ट रीसेट करें</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSubjectManagerOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white/80 cursor-pointer"
                      title="बंद करें"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Feedback Toast */}
                {subjectFeedback && (
                  <div
                    className={`p-2.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
                      subjectFeedback.type === 'success'
                        ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-300'
                        : 'bg-red-100/90 text-red-900 border border-red-300'
                    }`}
                  >
                    {subjectFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{subjectFeedback.text}</span>
                  </div>
                )}

                {/* Add New Subject Input Row */}
                <form onSubmit={handleAddNewSubject} className="flex gap-2">
                  <input
                    type="text"
                    value={newSubjectName}
                    onChange={e => setNewSubjectName(e.target.value.toUpperCase())}
                    placeholder="नया विषय नाम लिखें (e.g. MORAL SCIENCE, GENERAL KNOWLEDGE, ART & CRAFT)..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-blue-300 bg-white font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ विषय जोड़ें (Add Subject)</span>
                  </button>
                </form>

                {/* List of Managed Subjects with Edit & Delete */}
                <div className="space-y-1 pt-1">
                  <div className="text-[11px] font-bold text-slate-600">
                    उपलब्ध विषय (क्लिक करके एडिट या डिलीट करें):
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1 bg-white/70 rounded-xl border border-blue-200/60">
                    {subjectList.map(sub => {
                      const isEditingThis = editingSubjectOldName === sub;
                      if (isEditingThis) {
                        return (
                          <div
                            key={sub}
                            className="flex items-center gap-1 p-1 bg-amber-50 border border-amber-300 rounded-lg shadow-2xs"
                          >
                            <input
                              type="text"
                              value={editingSubjectNewName}
                              onChange={e => setEditingSubjectNewName(e.target.value.toUpperCase())}
                              autoFocus
                              className="px-2 py-0.5 text-xs font-bold rounded border border-amber-400 bg-white text-slate-900 uppercase focus:outline-none w-36"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditSubject(sub)}
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                              title="सहेजें (Save)"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSubjectOldName(null);
                                setEditingSubjectNewName('');
                              }}
                              className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                              title="रद्द करें"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={sub}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-300 shadow-2xs group text-xs"
                        >
                          <span className="font-bold text-slate-800 text-[11px]">{sub}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSubjectOldName(sub);
                              setEditingSubjectNewName(sub);
                            }}
                            className="text-slate-400 hover:text-blue-700 p-0.5 cursor-pointer"
                            title={`विषय "${sub}" संपादित करें (Edit)`}
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(sub)}
                            className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                            title={`विषय "${sub}" हटाएं (Delete)`}
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Fill Preset Subject Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-500">त्वरित विषय बटन:</span>
              {subjectList.slice(0, 10).map(sub => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => handleQuickFillAll(sub)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 text-[10px] font-bold border border-slate-200 cursor-pointer transition-colors"
                  title={`Click to fill ${sub} across all classes`}
                >
                  + {sub}
                </button>
              ))}
              {subjectList.length > 10 && (
                <button
                  type="button"
                  onClick={() => setIsSubjectManagerOpen(true)}
                  className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 cursor-pointer"
                >
                  +{subjectList.length - 10} और...
                </button>
              )}
            </div>

            {/* TABULAR ROW VIEW (Row Format - NUR to X with Dropdown + Free Input) */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <span>पंक्तिवार विषय प्रविष्टि (Table Row Input - स्वतंत्र रूप से विषय चुनें या टाइप करें):</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  ड्रॉपडाउन से कोई भी विषय चुनें या नीचे स्वतंत्र रूप से लिखें
                </span>
              </div>

              <div className="overflow-x-auto pb-2 border border-slate-200 rounded-xl bg-slate-50">
                <table className="w-full text-xs border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="bg-slate-800 text-white">
                      <th className="py-2.5 px-3 text-left font-black text-[11px] border-r border-slate-700 w-36 shrink-0">
                        दिनांक व वार
                      </th>
                      {TIMETABLE_CLASSES.map(cls => (
                        <th
                          key={cls}
                          className="py-2 px-2 text-center font-black text-xs border-r border-slate-700 bg-slate-750"
                        >
                          <div>{cls}</div>
                          <div className="text-[9px] font-normal text-slate-300">
                            {cls === 'NUR' || cls === 'LKG' || cls === 'UKG' ? cls : `Class ${cls}`}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="py-3 px-3 border-r border-slate-200 font-bold text-slate-900 bg-blue-50/40">
                        <div className="font-mono text-xs font-black text-blue-950">
                          {formatDisplayDate(formData.date)}
                        </div>
                        <div className="text-[10px] font-extrabold text-blue-700 uppercase">
                          ({formData.day || getStandardDay(formData.date)})
                        </div>
                      </td>
                      {TIMETABLE_CLASSES.map((cls, idx) => {
                        const currentVal = formData.classSubjects[cls] || '';
                        return (
                          <td key={cls} className="py-2 px-1.5 border-r border-slate-200 align-top">
                            {/* Dropdown to independently select ANY subject */}
                            <select
                              value={subjectList.includes(currentVal) ? currentVal : ''}
                              onChange={e => {
                                if (e.target.value === '__ADD__') {
                                  setIsSubjectManagerOpen(true);
                                } else if (e.target.value) {
                                  handleSubjectChange(cls, e.target.value);
                                }
                              }}
                              className="w-full text-[10px] font-bold py-1 px-1 rounded-md border border-slate-300 bg-slate-50 hover:bg-white text-slate-800 cursor-pointer focus:outline-none focus:border-blue-600 mb-1"
                              title={`कक्षा ${cls} के लिए स्वतंत्र विषय चुनें`}
                            >
                              <option value="">-- विषय चुनें --</option>
                              {subjectList.map(sub => (
                                <option key={sub} value={sub}>
                                  {sub}
                                </option>
                              ))}
                              <option value="__ADD__">✏️ + नया विषय जोड़ें...</option>
                            </select>

                            {/* Free-form text input with Clear Button */}
                            <div className="relative">
                              <input
                                type="text"
                                list="common-subjects-list"
                                value={currentVal}
                                onChange={e => handleSubjectChange(cls, e.target.value.toUpperCase())}
                                placeholder="या स्वतंत्र लिखें"
                                tabIndex={idx + 1}
                                className="w-full px-1.5 py-1 text-[11px] font-bold text-center rounded-lg border border-slate-300 bg-white text-slate-900 uppercase focus:outline-none focus:border-blue-600 focus:bg-amber-50/60 shadow-2xs pr-5"
                              />
                              {currentVal && (
                                <button
                                  type="button"
                                  onClick={() => handleSubjectChange(cls, '')}
                                  className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 text-[10px] cursor-pointer"
                                  title="खाली करें"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEQUENTIAL 13-CLASS CARDS (NUR TO X) WITH INDEPENDENT SELECTION & EDIT */}
            <div className="pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide">
                  कक्षावार विस्तृत कार्ड्स (13 Classes: NUR to X - स्वतंत्र विषय चयन):
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  पूर्व-प्राथमिक (NUR-UKG) | प्राथमिक (I-V) | माध्यमिक (VI-X)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 xl:grid-cols-13 gap-2.5">
                {TIMETABLE_CLASSES.map((cls, idx) => {
                  const isPrePrimary = cls === 'NUR' || cls === 'LKG' || cls === 'UKG';
                  const isSecondary = ['VI', 'VII', 'VIII', 'IX', 'X'].includes(cls);
                  const currentVal = formData.classSubjects[cls] || '';

                  return (
                    <div
                      key={cls}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isPrePrimary
                          ? 'bg-amber-50/40 border-amber-200'
                          : isSecondary
                          ? 'bg-blue-50/40 border-blue-200'
                          : 'bg-emerald-50/40 border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-black text-xs text-slate-900">
                          {cls === 'NUR' || cls === 'LKG' || cls === 'UKG' ? cls : `कक्षा ${cls}`}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">#{idx + 1}</span>
                      </div>

                      {/* Dropdown selector for this class */}
                      <select
                        value={subjectList.includes(currentVal) ? currentVal : ''}
                        onChange={e => {
                          if (e.target.value === '__ADD__') {
                            setIsSubjectManagerOpen(true);
                          } else if (e.target.value) {
                            handleSubjectChange(cls, e.target.value);
                          }
                        }}
                        className="w-full text-[10px] font-bold py-1 px-1 rounded-md border border-slate-300 bg-white text-slate-800 cursor-pointer focus:outline-none focus:border-blue-600 mb-1"
                      >
                        <option value="">-- विषय चुनें --</option>
                        {subjectList.map(sub => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                        <option value="__ADD__">✏️ + नया विषय...</option>
                      </select>

                      {/* Free-form text input */}
                      <div className="relative">
                        <input
                          type="text"
                          list="common-subjects-list"
                          value={currentVal}
                          onChange={e => handleSubjectChange(cls, e.target.value.toUpperCase())}
                          placeholder="या स्वतंत्र लिखें"
                          className="w-full px-2 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-900 uppercase focus:outline-none focus:border-blue-600 shadow-2xs pr-5"
                        />
                        {currentVal && (
                          <button
                            type="button"
                            onClick={() => handleSubjectChange(cls, '')}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 text-xs cursor-pointer"
                            title="हटाएं"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DYNAMIC DATALIST POPULATED WITH CURRENT SUBJECTS */}
            <datalist id="common-subjects-list">
              {subjectList.map(sub => (
                <option key={sub} value={sub} />
              ))}
            </datalist>
          </div>

          {/* FORM FOOTER / SAVE BUTTON */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-slate-200 gap-3">
            <div className="text-xs text-slate-600">
              दिनांक: <strong className="text-blue-700">{formatDisplayDate(formData.date)}</strong>{' '}
              ({formData.day || getStandardDay(formData.date)}) | समय: <strong>{formData.time}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleResetForm()}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
              >
                खाली करें (Reset)
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>
                  {isEditing ? 'Update Exam Schedule (अपडेट करें)' : 'Save Exam Schedule (सुरक्षित करें)'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Main Consolidated Time Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
              मास्टर परीक्षा समय-सारिणी: NUR से X तक ({currentEntries.length} Exam Dates Scheduled)
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Examination: <strong className="text-slate-800">{exam}</strong> | Session:{' '}
              <strong className="text-slate-800">{session}</strong>
            </span>
            <button
              onClick={() => {
                setEditingNotes([...examNotes]);
                setShowPrintModal(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिंट करें (Group-wise Print)</span>
            </button>
          </div>
        </div>

        {currentEntries.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-sm text-slate-700">No examination dates scheduled yet.</p>
            <p className="text-slate-400 mt-1">
              Use the panel above to set dates and subjects for NUR to X, or click "19 से 25 सितम्बर सारिणी लोड करें".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-extrabold uppercase text-[11px]">
                  <th className="py-3 px-3 w-12 text-center border-r border-slate-200">क्र.</th>
                  <th className="py-3 px-3 w-36 border-r border-slate-200">Date & Day</th>
                  <th className="py-3 px-3 w-28 border-r border-slate-200">Timing</th>
                  {TIMETABLE_CLASSES.map(cls => (
                    <th
                      key={cls}
                      className="py-3 px-2 border-r border-slate-200 text-center font-bold bg-blue-50/40 text-blue-950"
                    >
                      <div className="font-black text-xs">{cls}</div>
                      <div className="text-[9px] text-slate-500 font-normal">
                        {cls === 'NUR' || cls === 'LKG' || cls === 'UKG'
                          ? cls
                          : `${cls} (A/B)`}
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-3 w-28 text-center">एक्शन</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentEntries.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${
                      formData.id === entry.id ? 'bg-blue-50/60 font-medium' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="py-3 px-3 text-center font-bold text-slate-400 border-r border-slate-100">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 border-r border-slate-100">
                      <div className="font-black text-slate-900 text-xs font-mono">
                        {formatDisplayDate(entry.date)}
                      </div>
                      <div className="text-[10px] font-bold text-blue-700 uppercase">
                        ({entry.day})
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium text-[11px] border-r border-slate-100 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{entry.time}</span>
                      </div>
                    </td>
                    {TIMETABLE_CLASSES.map(cls => {
                      const subject = entry.classSubjects[cls];
                      return (
                        <td
                          key={cls}
                          className="py-3 px-2 text-center border-r border-slate-100 text-[11px]"
                        >
                          {subject ? (
                            <span className="inline-block px-2 py-1 rounded-lg bg-blue-50 text-blue-900 font-bold border border-blue-200/60 shadow-2xs">
                              {subject}
                            </span>
                          ) : (
                            <span className="text-slate-300 font-medium">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(entry)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 cursor-pointer border border-blue-200"
                          title="Edit this Exam Date & Subjects"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>एडिट</span>
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id, entry.date)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Delete Exam Date"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Important Notes Section (निर्देश लिखने का स्पेस) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Exam Instructions & Notes for Notice Board Print (महत्वपूर्ण परीक्षा निर्देश)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Appears at the bottom of the printed time table
          </span>
        </div>

        <div className="space-y-2">
          {editingNotes.map((note, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
            >
              <span className="font-bold text-blue-600">{idx + 1}.</span>
              <span className="flex-1 font-medium">{note}</span>
              <button
                onClick={() => handleRemoveNote(idx)}
                className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                title="Remove Note"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <input
            type="text"
            value={newNoteInput}
            onChange={e => setNewNoteInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddNote();
              }
            }}
            placeholder="Add new exam instruction line (e.g. सभी विद्यार्थी अपने साथ प्रवेश पत्र लाएं)..."
            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-blue-600"
          />
          <button
            onClick={handleAddNote}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Note</span>
          </button>
        </div>
      </div>

      {/* 2. OFFICIAL TIME TABLE PRINT / PDF MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Print Top Bar */}
            <div className="px-6 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Exam Time Table Print Preview (A4 Notice Board Layout)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* 4 Grouped Print Options */}
                <div className="flex items-center gap-1 bg-slate-200 p-1 rounded-xl">
                  <button
                    onClick={() => setPrintGroup('PRE_PRIMARY')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      printGroup === 'PRE_PRIMARY'
                        ? 'bg-white text-blue-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    NUR, LKG, UKG (एक साथ)
                  </button>
                  <button
                    onClick={() => setPrintGroup('PRIMARY')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      printGroup === 'PRIMARY'
                        ? 'bg-white text-blue-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Class I से V (एक साथ)
                  </button>
                  <button
                    onClick={() => setPrintGroup('SECONDARY')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      printGroup === 'SECONDARY'
                        ? 'bg-white text-blue-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Class VI से X (एक साथ)
                  </button>
                  <button
                    onClick={() => setPrintGroup('ALL')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      printGroup === 'ALL'
                        ? 'bg-white text-blue-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Classes (NUR to X)
                  </button>
                </div>

                <button
                  onClick={() => setIsEditingNotesInPrint(prev => !prev)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isEditingNotesInPrint ? 'Done Editing Notes' : 'Edit Notes (निर्देश बदलें)'}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>

                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* In-Modal Notes Editor Bar if Toggled */}
            {isEditingNotesInPrint && (
              <div className="p-4 bg-amber-50/70 border-b border-amber-200 print:hidden space-y-2">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-2">
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editable Notes Section (निचे निर्देश लिखने का स्पेस):</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {editingNotes.map((n, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600">{i + 1}.</span>
                      <input
                        type="text"
                        value={n}
                        onChange={e => {
                          const updated = [...editingNotes];
                          updated[i] = e.target.value;
                          setEditingNotes(updated);
                          updateExamNotes(updated);
                        }}
                        className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-amber-300 bg-white font-medium"
                      />
                      <button
                        onClick={() => handleRemoveNote(i)}
                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newNoteInput}
                    onChange={e => setNewNoteInput(e.target.value)}
                    placeholder="Add new guideline..."
                    className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-amber-300 bg-white"
                  />
                  <button
                    onClick={handleAddNote}
                    className="px-3 py-1 bg-amber-800 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>
            )}

            {/* Printable Content Body */}
            <div className="p-8 overflow-y-auto print:p-0 font-sans print:m-0 bg-white">
              <PrintableGroupSheet
                groupKey={printGroup}
                exam={exam}
                session={session}
                entries={currentEntries}
                notes={editingNotes}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface PrintableGroupSheetProps {
  groupKey: TimeTableGroupId;
  exam: string;
  session: string;
  entries: ExamTimeTableEntry[];
  notes: string[];
}

const PrintableGroupSheet: React.FC<PrintableGroupSheetProps> = ({
  groupKey,
  exam,
  session,
  entries,
  notes
}) => {
  const targetClasses: string[] =
    groupKey === 'ALL'
      ? [...TIMETABLE_CLASSES]
      : TIMETABLE_GROUPS[groupKey].classes;

  const groupTitle =
    groupKey === 'PRE_PRIMARY'
      ? 'EXAMINATION TIME TABLE - PRE-PRIMARY SECTION (नर्सरी, LKG, UKG एक साथ)'
      : groupKey === 'PRIMARY'
      ? 'EXAMINATION TIME TABLE - PRIMARY SECTION (कक्षा I से V एक साथ)'
      : groupKey === 'SECONDARY'
      ? 'EXAMINATION TIME TABLE - MIDDLE & SECONDARY SECTION (कक्षा VI से X एक साथ)'
      : 'CONSOLIDATED EXAMINATION TIME TABLE (कक्षा NUR से X तक)';

  const hindiSubTitle =
    groupKey === 'PRE_PRIMARY'
      ? 'वार्षिक / आवधिक परीक्षा समय-सारिणी: पूर्व प्राथमिक (नर्सरी, LKG, UKG एक साथ)'
      : groupKey === 'PRIMARY'
      ? 'वार्षिक / आवधिक परीक्षा समय-सारिणी: प्राथमिक वर्ग (कक्षा I से V एक साथ)'
      : groupKey === 'SECONDARY'
      ? 'वार्षिक / आवधिक परीक्षा समय-सारिणी: माध्यमिक वर्ग (कक्षा VI से X तक एक साथ)'
      : 'सम्पूर्ण परीक्षा समय-सारिणी (नर्सरी से कक्षा 10वीं तक)';

  return (
    <div className="space-y-6 print:space-y-4 max-w-4xl mx-auto border border-slate-300 p-6 print:border-none print:p-2 rounded-xl">
      {/* Header Print */}
      <HeaderPrint
        title={groupTitle}
        subtitle={`${hindiSubTitle} • Academic Session: ${session} | Examination: ${exam}`}
        exam={exam}
        session={session}
      />

      {/* Group Badge Bar */}
      <div className="flex items-center justify-between border-y-2 border-black py-1.5 px-2 text-xs font-bold uppercase tracking-wider bg-slate-100">
        <span>लक्ष्य वर्ग (Target Section): {hindiSubTitle}</span>
        <span>प्रवेश: 08:45 AM | परीक्षा समय: 09:00 AM - 12:00 PM</span>
      </div>

      {/* Main Table */}
      <table className="w-full text-left text-xs border-collapse border-2 border-black">
        <thead>
          <tr className="bg-slate-200 border-b-2 border-black text-black font-black uppercase text-[11px]">
            <th className="py-2.5 px-2 border border-black w-10 text-center">क्र.</th>
            <th className="py-2.5 px-2 border border-black w-28 text-center">दिनांक (Date)</th>
            <th className="py-2.5 px-2 border border-black w-24 text-center">वार (Day)</th>
            <th className="py-2.5 px-2 border border-black w-24 text-center">समय (Time)</th>
            {targetClasses.map(cls => (
              <th
                key={cls}
                className="py-2.5 px-2 border border-black text-center font-black bg-slate-100"
              >
                <div className="text-xs">{cls}</div>
                <div className="text-[9px] text-slate-700 font-bold">
                  {cls === 'NUR' || cls === 'LKG' || cls === 'UKG'
                    ? 'Class'
                    : `Class ${cls}`}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-black">
          {entries.map((entry, idx) => (
            <tr key={entry.id} className="border-b border-black">
              <td className="py-2.5 px-2 border border-black text-center font-bold text-black font-mono">
                {idx + 1}
              </td>
              <td className="py-2.5 px-2 border border-black text-center font-black text-black font-mono">
                {formatDisplayDate(entry.date)}
              </td>
              <td className="py-2.5 px-2 border border-black text-center font-bold text-black">
                {entry.day}
              </td>
              <td className="py-2.5 px-2 border border-black text-center text-[10px] font-semibold text-black">
                {entry.time}
              </td>
              {targetClasses.map(cls => {
                const sub = entry.classSubjects[cls];
                return (
                  <td
                    key={cls}
                    className="py-2.5 px-2 border border-black text-center font-bold text-black text-[11px]"
                  >
                    {sub ? <span>{sub}</span> : <span className="text-slate-400">—</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Editable Notes / Instructions Section (निचे निर्देश लिखने का स्पेस) */}
      <div className="mt-6 border border-black rounded-lg p-3.5 space-y-1.5 bg-slate-50/50">
        <div className="font-bold text-xs text-black uppercase tracking-wide border-b border-black/40 pb-1 flex items-center justify-between">
          <span>महत्वपूर्ण परीक्षा निर्देश (Important Examination Notes & Guidelines):</span>
          <span className="text-[10px] text-slate-600 font-normal">आवश्यक सूचना</span>
        </div>
        <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-900 font-medium pt-1">
          {notes.map((note, i) => (
            <li key={i} className="leading-relaxed">
              {note}
            </li>
          ))}
        </ol>
      </div>

      {/* Official Signatures Section:
          परीक्षा विभाग / Examination Department, केंद्राधीक्षक / Centre Superintendent, and प्रधानाचार्य / Principal (हस्ताक्षर व मुहर) */}
      <div className="mt-14 pt-4 flex items-end justify-between text-center text-xs text-black">
        <div className="w-56 text-center">
          <div className="h-10"></div>
          <div className="border-t-2 border-black pt-1.5 font-bold uppercase tracking-wide">
            परीक्षा विभाग
            <div className="text-[10px] text-slate-700 font-semibold normal-case">
              Examination Department (हस्ताक्षर)
            </div>
          </div>
        </div>

        <div className="w-56 text-center">
          <div className="h-10"></div>
          <div className="border-t-2 border-black pt-1.5 font-bold uppercase tracking-wide">
            केंद्राधीक्षक
            <div className="text-[10px] text-slate-700 font-semibold normal-case">
              Centre Superintendent (हस्ताक्षर)
            </div>
          </div>
        </div>

        <div className="w-56 text-center">
          <div className="h-10"></div>
          <div className="border-t-2 border-black pt-1.5 font-bold uppercase tracking-wide">
            प्रधानाचार्य
            <div className="text-[10px] text-slate-700 font-semibold normal-case">
              Principal (हस्ताक्षर व मुहर)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
