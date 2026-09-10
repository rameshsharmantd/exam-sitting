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
  Check
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { ExamTimeTableEntry, ActiveSection } from '../../types';
import { HeaderPrint } from '../common/HeaderPrint';
import {
  TIMETABLE_CLASSES,
  TIMETABLE_GROUPS,
  TimeTableGroupId,
  getDayNameWithHindi
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
    examNotes,
    updateExamNotes
  } = useSchool();

  const [exam, setExam] = useState<string>(settings.defaultExam);
  const [session, setSession] = useState<string>(settings.defaultSession);
  const [selectedGroup, setSelectedGroup] = useState<TimeTableGroupId>('ALL');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Print Modal State
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
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('en-US', { weekday: 'long' });
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
    const today = new Date().toISOString().split('T')[0];
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
    setFormData(prev => ({
      ...prev,
      date: newDate,
      day: getStandardDay(newDate)
    }));
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
      text: `Loaded exam schedule for ${entry.date} (${entry.day}) in editor. Edit subjects below and click "Save Exam Schedule".`
    });

    // Smooth scroll to editor
    if (editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleResetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    const initialSubs: Record<string, string> = {};
    TIMETABLE_CLASSES.forEach(cls => {
      initialSubs[cls] = '';
    });
    setFormData({
      id: undefined,
      date: today,
      day: getStandardDay(today),
      time: '09:00 AM - 12:00 PM',
      classSubjects: initialSubs
    });
    setIsEditing(false);
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
      day: formData.day || getStandardDay(formData.date),
      time: formData.time.trim() || '09:00 AM - 12:00 PM',
      classSubjects: formData.classSubjects
    };

    saveTimeTableEntry(entryToSave);
    setMessage({
      type: 'success',
      text: `Exam schedule for ${entryToSave.date} (${entryToSave.day}) successfully saved!`
    });

    // Keep form ready for next date or reset
    if (isEditing) {
      setIsEditing(false);
      handleResetForm();
    }
  };

  const handleDeleteEntry = (id: string, date: string) => {
    if (window.confirm(`Are you sure you want to remove exam schedule for ${date}?`)) {
      deleteTimeTableEntry(id);
      setMessage({
        type: 'success',
        text: `Exam schedule entry for ${date} removed.`
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

  const activeGroupClasses =
    selectedGroup === 'ALL'
      ? TIMETABLE_CLASSES
      : TIMETABLE_GROUPS[selectedGroup].classes;

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

        {/* Filter Controls Bar */}
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
          </div>

          {/* Group View Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto">
            <button
              onClick={() => setSelectedGroup('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedGroup === 'ALL'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Classes (NUR to X)
            </button>
            <button
              onClick={() => setSelectedGroup('PRE_PRIMARY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedGroup === 'PRE_PRIMARY'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              NUR, LKG, UKG (एक साथ)
            </button>
            <button
              onClick={() => setSelectedGroup('PRIMARY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedGroup === 'PRIMARY'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Class I से V (एक साथ)
            </button>
            <button
              onClick={() => setSelectedGroup('SECONDARY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedGroup === 'SECONDARY'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Class VI से X (एक साथ)
            </button>
          </div>
        </div>
      </div>

      {/* 1. EXAM DATE AUR CLASS WISE SUBJECT SET OR EDIT KARNE KA PANEL */}
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
                    ? `Edit Exam Date & Subjects (परीक्षा दिनांक व विषय संपादित करें)`
                    : `Set Exam Date & Class-Wise Subjects (परीक्षा दिनांक एवं कक्षावार विषय सेट करें)`}
                </h3>
                {isEditing && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black">
                    Editing: {formData.date}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Set examination date, timings, and class-wise subjects for Pre-Primary, Primary, and Secondary sections together.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                type="button"
                onClick={handleResetForm}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cancel / New Entry</span>
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSaveEntry} className="p-6 space-y-5">
          {/* Row 1: Date, Day, Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                📅 Exam Date (परीक्षा दिनांक) *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => handleDateChange(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                वार (Day of Week)
              </label>
              <input
                type="text"
                value={formData.day}
                onChange={e => setFormData(prev => ({ ...prev, day: e.target.value }))}
                placeholder="e.g. Monday"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 font-bold text-blue-900 focus:outline-none focus:border-blue-600"
              />
              {formData.date && (
                <span className="text-[10px] text-blue-600 font-semibold mt-1 block">
                  {getDayNameWithHindi(formData.date)}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ⏰ Exam Timing (परीक्षा समय)
              </label>
              <input
                type="text"
                value={formData.time}
                onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                placeholder="e.g. 09:00 AM - 12:00 PM"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Quick Fill Helpers */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-700 uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>⚡ Quick Preset Fill (एक क्लिक में पूरे वर्ग का विषय भरें):</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-bold">पूर्व-प्राथमिक (Pre-Primary):</span>
              {['English Written', 'English Rhymes', 'Hindi Written', 'Mathematics', 'Drawing & Colouring', 'GK & EVS'].map(sub => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => handleQuickFillGroup('PRE_PRIMARY', sub)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-[11px] font-bold text-slate-700 hover:text-blue-700 cursor-pointer shadow-2xs"
                >
                  + {sub}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-bold">प्राथमिक (Class I से V):</span>
              {['Hindi', 'English', 'Mathematics', 'EVS', 'Computer', 'Sanskrit', 'Drawing'].map(sub => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => handleQuickFillGroup('PRIMARY', sub)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-[11px] font-bold text-slate-700 hover:text-blue-700 cursor-pointer shadow-2xs"
                >
                  + {sub}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-bold">माध्यमिक (Class VI से X):</span>
              {['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer'].map(sub => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => handleQuickFillGroup('SECONDARY', sub)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-[11px] font-bold text-slate-700 hover:text-blue-700 cursor-pointer shadow-2xs"
                >
                  + {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Class Subjects Sections */}
          <div className="space-y-4">
            {/* 1. Pre-Primary */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                <h4 className="text-xs font-black text-blue-900 uppercase">
                  1. पूर्व-प्राथमिक वर्ग (Pre-Primary Section: NUR, LKG, UKG)
                </h4>
                <span className="text-[10px] font-bold text-slate-500">3 Classes</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TIMETABLE_GROUPS.PRE_PRIMARY.classes.map(cls => (
                  <div key={cls}>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      Class {cls}
                    </label>
                    <input
                      type="text"
                      list="common-subjects-list"
                      value={formData.classSubjects[cls] || ''}
                      onChange={e => handleSubjectChange(cls, e.target.value)}
                      placeholder="e.g. English Oral & Rhymes"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Primary */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                <h4 className="text-xs font-black text-blue-900 uppercase">
                  2. प्राथमिक वर्ग (Primary Section: Class I से V)
                </h4>
                <span className="text-[10px] font-bold text-slate-500">
                  Maps automatically to IA, IB, IIA, IIB, etc.
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {TIMETABLE_GROUPS.PRIMARY.classes.map(cls => (
                  <div key={cls}>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      Class {cls}
                    </label>
                    <input
                      type="text"
                      list="common-subjects-list"
                      value={formData.classSubjects[cls] || ''}
                      onChange={e => handleSubjectChange(cls, e.target.value)}
                      placeholder="Subject..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Secondary */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                <h4 className="text-xs font-black text-blue-900 uppercase">
                  3. माध्यमिक वर्ग (Middle & Secondary Section: Class VI से X)
                </h4>
                <span className="text-[10px] font-bold text-slate-500">
                  Maps automatically to VIA, VIB, XA, XB, etc.
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {TIMETABLE_GROUPS.SECONDARY.classes.map(cls => (
                  <div key={cls}>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      Class {cls}
                    </label>
                    <input
                      type="text"
                      list="common-subjects-list"
                      value={formData.classSubjects[cls] || ''}
                      onChange={e => handleSubjectChange(cls, e.target.value)}
                      placeholder="Subject..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            <datalist id="common-subjects-list">
              {CONFIG.COMMON_SUBJECTS.map(sub => (
                <option key={sub} value={sub} />
              ))}
              <option value="English Rhymes & Oral" />
              <option value="English Written" />
              <option value="Hindi Rhymes & Oral" />
              <option value="Hindi Written" />
              <option value="Drawing & Colouring" />
              <option value="General Knowledge & Conversation" />
            </datalist>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-slate-200 gap-3">
            <div className="text-xs text-slate-500">
              {isEditing ? (
                <span>
                  Modifying schedule for{' '}
                  <strong className="text-blue-700">{formData.date}</strong>. Changes will update attendance registers.
                </span>
              ) : (
                <span>
                  Click <strong>"Save Exam Schedule"</strong> to add this date to the official timetable.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
              >
                Reset Fields
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
              {TIMETABLE_GROUPS[selectedGroup].label} ({currentEntries.length} Exam Dates Scheduled)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Examination: <strong className="text-slate-800">{exam}</strong> | Session:{' '}
            <strong className="text-slate-800">{session}</strong>
          </span>
        </div>

        {currentEntries.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-sm text-slate-700">No examination dates scheduled yet.</p>
            <p className="text-slate-400 mt-1">
              Use the panel above to set dates and subjects for NUR to X.
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
                  {activeGroupClasses.map(cls => (
                    <th
                      key={cls}
                      className="py-3 px-3 border-r border-slate-200 text-center font-bold bg-blue-50/40 text-blue-950"
                    >
                      <div className="font-black text-xs">{cls}</div>
                      <div className="text-[9px] text-slate-500 font-normal">
                        {cls === 'NUR' || cls === 'LKG' || cls === 'UKG'
                          ? cls
                          : `${cls} (A/B)`}
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-3 w-28 text-center">Set / Edit</th>
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
                        {entry.date}
                      </div>
                      <div className="text-[10px] font-bold text-blue-700 uppercase">
                        {entry.day}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium text-[11px] border-r border-slate-100 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{entry.time}</span>
                      </div>
                    </td>
                    {activeGroupClasses.map(cls => {
                      const subject = entry.classSubjects[cls];
                      return (
                        <td
                          key={cls}
                          className="py-3 px-2.5 text-center border-r border-slate-100 text-[11px]"
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
                {entry.date}
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
