import React, { useState, useMemo } from 'react';
import {
  FileCheck,
  Printer,
  Plus,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Calendar,
  Building2,
  BookOpen,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
  Users
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { CONFIG } from '../../data/constants';
import { HeaderPrint } from '../common/HeaderPrint';
import {
  normalizeClassForTimeTable,
  TIMETABLE_CLASSES,
  getDayNameWithHindi,
  formatDisplayDate
} from '../../utils/timetableUtils';

export const ExamAttendanceView: React.FC = () => {
  const {
    settings,
    halls,
    generateAttendance,
    attendanceRecords,
    clearAttendanceRecords,
    timeTableEntries,
    getSubjectForClassAndDate,
    subjectList
  } = useSchool();

  const [exam, setExam] = useState(settings.defaultExam);
  const [session, setSession] = useState(settings.defaultSession);
  const [hallId, setHallId] = useState<string>('ALL');

  // Time table dates available for selected exam & session
  const examDates = useMemo(() => {
    return timeTableEntries
      .filter(e => e.exam === exam && e.session === session)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [timeTableEntries, exam, session]);

  // Selected date from timetable (default to first scheduled date if available)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return examDates.length > 0 ? examDates[0].date : '';
  });

  const [subjectMode, setSubjectMode] = useState<'AUTO_TIMETABLE' | 'MANUAL'>('AUTO_TIMETABLE');
  const [manualSubject, setManualSubject] = useState<string>('Mathematics');

  // Filters for records view
  const [filterHall, setFilterHall] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('ALL');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [viewGrouping, setViewGrouping] = useState<'HALL_DATE' | 'FLAT'>('HALL_DATE');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printHallFilter, setPrintHallFilter] = useState<string>('ALL');
  const [printDateFilter, setPrintDateFilter] = useState<string>('ALL');

  // Find active timetable entry for selectedDate
  const activeDateEntry = useMemo(() => {
    return examDates.find(e => e.date === selectedDate);
  }, [examDates, selectedDate]);

  // Target hall object
  const currentTargetHall = useMemo(() => {
    return halls.find(h => h.hallId === hallId);
  }, [halls, hallId]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const subjectToUse = subjectMode === 'MANUAL' ? manualSubject.trim() : 'AUTO';
    const dateToUse = subjectMode === 'AUTO_TIMETABLE' ? selectedDate : undefined;

    if (subjectMode === 'MANUAL' && !subjectToUse) {
      setMessage({ type: 'error', text: 'Subject is required in manual mode.' });
      return;
    }

    if (subjectMode === 'AUTO_TIMETABLE' && !dateToUse) {
      setMessage({ type: 'error', text: 'Please select an Exam Date to auto-assign class-wise subjects from Time Table.' });
      return;
    }

    const res = generateAttendance(exam, session, hallId, subjectToUse, dateToUse);
    if (res.success) {
      const hallText = currentTargetHall ? currentTargetHall.hallName : 'All Halls';
      const dateText = dateToUse ? ` for Date ${dateToUse}` : '';
      setMessage({
        type: 'success',
        text: `Successfully generated ${res.generated} attendance records with class-wise subjects from Time Table (${hallText}${dateText})!`
      });
      if (dateToUse) setFilterDate(dateToUse);
      if (hallId !== 'ALL') setFilterHall(hallId);
    } else {
      setMessage({
        type: 'error',
        text: res.message || 'Failed to generate attendance. Ensure seating arrangement is generated first.'
      });
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear generated attendance records?')) {
      clearAttendanceRecords(exam, session);
      setMessage({ type: 'success', text: 'Attendance records cleared.' });
    }
  };

  // Distinct values for filters
  const subjectsRecorded = Array.from(new Set(attendanceRecords.map(r => r.subject)));
  const datesRecorded = Array.from(
    new Set(attendanceRecords.filter(r => Boolean(r.date)).map(r => r.date as string))
  ).sort();

  // Filtered records
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(r => {
      if (filterSubject !== 'ALL' && r.subject !== filterSubject) return false;
      if (filterDate !== 'ALL' && r.date !== filterDate) return false;
      if (filterHall !== 'ALL' && r.hallId !== filterHall && !r.hall.includes(filterHall)) return false;
      return true;
    });
  }, [attendanceRecords, filterSubject, filterDate, filterHall]);

  // Group records Hall-wise and Date-wise (User Requirement 3)
  interface GroupedHallDate {
    key: string;
    hallId: string;
    hallName: string;
    date: string;
    day?: string;
    classes: string[];
    records: typeof attendanceRecords;
  }

  const hallDateGroups = useMemo(() => {
    const map = new Map<string, GroupedHallDate>();

    filteredRecords.forEach(r => {
      const hId = r.hallId || r.hall;
      const dStr = r.date || 'Undated';
      const key = `${hId}__${dStr}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          hallId: hId,
          hallName: r.hall,
          date: dStr,
          day: r.day,
          classes: [],
          records: []
        });
      }

      const group = map.get(key)!;
      group.records.push(r);
      if (!group.classes.includes(r.className)) {
        group.classes.push(r.className);
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      const cmpDate = a.date.localeCompare(b.date);
      if (cmpDate !== 0) return cmpDate;
      return a.hallName.localeCompare(b.hallName);
    });
  }, [filteredRecords]);

  const handlePrintSpecificGroup = (group: GroupedHallDate) => {
    setPrintHallFilter(group.hallId);
    setPrintDateFilter(group.date);
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Generator Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FileCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Exam Attendance Register Generator (हॉल एवं दिनांकवार उपस्थिति पत्रक)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate hall-wise and date-wise attendance registers with auto-selected class subjects from the Exam Time Table.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {attendanceRecords.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setPrintHallFilter('ALL');
                    setPrintDateFilter('ALL');
                    setShowPrintModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Registers</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                  title="Clear Records"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {message && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
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

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Exam */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Examination *</label>
              <input
                type="text"
                required
                value={exam}
                onChange={e => setExam(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Session */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Academic Session *</label>
              <input
                type="text"
                required
                value={session}
                onChange={e => setSession(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Target Hall */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Examination Hall (परीक्षा कक्ष) *
              </label>
              <select
                value={hallId}
                onChange={e => setHallId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer"
              >
                <option value="ALL">All Examination Halls (सभी हॉल)</option>
                {halls.map(h => (
                  <option key={h.hallId} value={h.hallId}>
                    {h.hallName} ({h.hallId}) - Cap: {h.capacity}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subject Mapping Mode *
              </label>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSubjectMode('AUTO_TIMETABLE')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    subjectMode === 'AUTO_TIMETABLE'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⚡ By Time Table Date
                </button>
                <button
                  type="button"
                  onClick={() => setSubjectMode('MANUAL')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    subjectMode === 'MANUAL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Manual
                </button>
              </div>
            </div>
          </div>

          {/* Date Selection and Auto-Subject Details */}
          {subjectMode === 'AUTO_TIMETABLE' ? (
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-black text-blue-950 uppercase tracking-wide">
                    Select Exam Date (समय-सारिणी से परीक्षा दिनांक चुनें):
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-blue-300 bg-white font-bold text-xs text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs min-w-[280px]"
                  >
                    {examDates.length === 0 ? (
                      <option value="">No dates scheduled in Time Table</option>
                    ) : (
                      examDates.map(d => (
                        <option key={d.id} value={d.date}>
                          📅 {formatDisplayDate(d.date)} ({d.day}) • {d.time}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Live Preview of Class-Wise Subjects for this Date */}
              {activeDateEntry ? (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-blue-900">
                    <span>
                      Class-Wise Auto Subjects for <strong>{formatDisplayDate(activeDateEntry.date)} ({activeDateEntry.day})</strong>:
                    </span>
                    <span className="text-[10px] text-blue-700 font-semibold">
                      Time: {activeDateEntry.time}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-13 gap-1.5">
                    {TIMETABLE_CLASSES.map(cls => {
                      const sub = activeDateEntry.classSubjects[cls];
                      return (
                        <div
                          key={cls}
                          className="bg-white/95 border border-blue-200/80 rounded-lg px-2 py-1.5 text-center shadow-2xs"
                        >
                          <div className="text-[10px] font-black text-slate-700">
                            {cls}
                          </div>
                          <div className="text-[11px] font-bold text-blue-900 truncate" title={sub}>
                            {sub || '—'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-blue-800 mt-1">
                    ✓ Students from sections <strong>IA & IB</strong> will automatically receive Class <strong>I</strong> subject ({activeDateEntry.classSubjects['I'] || 'General'}). Likewise for all classes up to <strong>Class X</strong>.
                  </p>
                </div>
              ) : (
                <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  No timetable entry found for this date. Please schedule dates in the <strong>"Exam Time Table"</strong> section first.
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Single Subject Name (Manual Mode) *
              </label>
              <input
                type="text"
                list="subject-list"
                value={manualSubject}
                onChange={e => setManualSubject(e.target.value)}
                placeholder="e.g. Mathematics"
                className="w-full sm:w-80 px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold focus:outline-none focus:border-blue-600"
              />
              <datalist id="subject-list">
                {subjectList.map(sub => (
                  <option key={sub} value={sub} />
                ))}
              </datalist>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>
                Target Hall:{' '}
                <strong className="text-slate-800">
                  {currentTargetHall
                    ? `${currentTargetHall.hallName} (${currentTargetHall.hallId})`
                    : 'All Examination Halls'}
                </strong>
              </span>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>
                {subjectMode === 'AUTO_TIMETABLE'
                  ? 'Generate Attendance (Hall & Date Wise)'
                  : 'Generate Attendance Sheet'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Register Records Display */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Top Header with Prominent Hall Heading & Filters */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Examination Attendance Records ({filteredRecords.length} student entries)
              </h3>
            </div>
            {/* Prominent Hall Heading in top bar */}
            <div className="mt-1 flex items-center gap-2 text-xs font-bold text-blue-950">
              <Building2 className="w-3.5 h-3.5 text-blue-700" />
              <span>
                Selected Hall:{' '}
                <span className="text-slate-900 font-extrabold underline decoration-blue-500 underline-offset-2">
                  {filterHall === 'ALL'
                    ? 'ALL EXAMINATION HALLS (CONSOLIDATED)'
                    : halls.find(h => h.hallId === filterHall)?.hallName || filterHall}
                </span>
              </span>
            </div>
          </div>

          {/* Filter Bar & View Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Hall Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-bold">Hall:</span>
              <select
                value={filterHall}
                onChange={e => setFilterHall(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white font-bold text-slate-800 cursor-pointer"
              >
                <option value="ALL">All Halls</option>
                {halls.map(h => (
                  <option key={h.hallId} value={h.hallId}>
                    {h.hallName}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            {datesRecorded.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-bold">Date:</span>
                <select
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white font-bold text-slate-800 cursor-pointer"
                >
                  <option value="ALL">All Dates ({datesRecorded.length})</option>
                  {datesRecorded.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-200 p-0.5 rounded-lg border border-slate-300">
              <button
                onClick={() => setViewGrouping('HALL_DATE')}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-colors cursor-pointer ${
                  viewGrouping === 'HALL_DATE'
                    ? 'bg-white text-blue-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हॉल व दिनांकवार
              </button>
              <button
                onClick={() => setViewGrouping('FLAT')}
                className={`px-2.5 py-1 text-xs font-bold rounded transition-colors cursor-pointer ${
                  viewGrouping === 'FLAT'
                    ? 'bg-white text-blue-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                एकल सूची
              </button>
            </div>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <FileCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-sm text-slate-700">No attendance records found.</p>
            <p className="text-slate-400 mt-1">
              Select an exam, target hall, and date above, then click{' '}
              <strong>"Generate Attendance (Hall & Date Wise)"</strong>.
            </p>
          </div>
        ) : viewGrouping === 'HALL_DATE' ? (
          /* 3. HALL-WISE & DATE-WISE GROUPED VIEW (User Requirement 3) */
          <div className="p-6 space-y-6 bg-slate-50/50">
            {hallDateGroups.map(group => (
              <div
                key={group.key}
                className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* Prominent Hall & Date Heading Banner */}
                <div className="p-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-400" />
                      <h4 className="text-sm font-black uppercase tracking-wide">
                        HALL NAME: {group.hallName.toUpperCase()}
                      </h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-blue-200">
                      <div className="flex items-center gap-1 font-mono font-bold">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>दिनांक (Date): {formatDisplayDate(group.date)} {group.day ? `(${group.day})` : ''}</span>
                      </div>
                      <span>•</span>
                      <span>कक्षाएं (Classes): {group.classes.join(', ')}</span>
                      <span>•</span>
                      <span className="bg-blue-600/60 px-2 py-0.5 rounded text-[11px] font-bold text-white">
                        परीक्षार्थी: {group.records.length}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePrintSpecificGroup(group)}
                    className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print This Hall Sheet</span>
                  </button>
                </div>

                {/* Candidate Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[11px]">
                        <th className="py-2.5 px-3 w-12 text-center border-r border-slate-200">क्र.</th>
                        <th className="py-2.5 px-3 w-20 text-center border-r border-slate-200">सीट नं.</th>
                        <th className="py-2.5 px-3 w-20 text-center border-r border-slate-200">कक्षा</th>
                        <th className="py-2.5 px-3 w-16 text-center border-r border-slate-200">रोल नं.</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">परीक्षार्थी का नाम</th>
                        <th className="py-2.5 px-3 border-r border-slate-200">
                          परीक्षा विषय (From Time Table)
                        </th>
                        <th className="py-2.5 px-3 w-36 text-center">परीक्षार्थी हस्ताक्षर</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.records.map((rec, idx) => (
                        <tr key={`${rec.sNo}_${rec.seatNo}`} className="hover:bg-blue-50/30">
                          <td className="py-2.5 px-3 text-center font-bold text-slate-400 border-r border-slate-100">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700 text-center border-r border-slate-100">
                            {rec.seatNo}
                          </td>
                          <td className="py-2.5 px-3 text-center border-r border-slate-100">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 font-black text-[11px] text-slate-800 border border-slate-200">
                              {rec.className}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-black text-slate-900 text-center border-r border-slate-100">
                            {rec.rollNo}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-100">
                            {rec.studentName}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-blue-900 border-r border-slate-100">
                            <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200/60 font-semibold">
                              {rec.subject}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="h-6 border-b border-slate-300 mx-auto w-24"></div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Consolidated Flat Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[11px]">
                  <th className="py-2.5 px-3 w-12 text-center border-r border-slate-200">क्र.</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">हॉल का नाम (Hall Name)</th>
                  <th className="py-2.5 px-3 w-20 text-center border-r border-slate-200">सीट नं.</th>
                  <th className="py-2.5 px-3 w-20 text-center border-r border-slate-200">कक्षा</th>
                  <th className="py-2.5 px-3 w-16 text-center border-r border-slate-200">रोल नं.</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">परीक्षार्थी का नाम</th>
                  <th className="py-2.5 px-3 border-r border-slate-200">परीक्षा विषय</th>
                  <th className="py-2.5 px-3 w-24 text-center border-r border-slate-200">दिनांक</th>
                  <th className="py-2.5 px-3 w-36 text-center">परीक्षार्थी हस्ताक्षर</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((rec, idx) => (
                  <tr key={`${rec.sNo}_${rec.hall}_${rec.seatNo}`} className="hover:bg-blue-50/40">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-400 border-r border-slate-100">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{rec.hall}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 text-center border-r border-slate-100">
                      {rec.seatNo}
                    </td>
                    <td className="py-2.5 px-3 text-center border-r border-slate-100">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-black text-[11px] text-slate-800 border border-slate-200">
                        {rec.className}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-black text-slate-900 text-center border-r border-slate-100">
                      {rec.rollNo}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-100">
                      {rec.studentName}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-blue-900 border-r border-slate-100">
                      <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200/60 font-semibold">
                        {rec.subject}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600 border-r border-slate-100">
                      {rec.date || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="h-6 border-b border-slate-300 mx-auto w-24"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Sheet Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:hidden">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Invigilator Examination Attendance Register Print Preview
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {/* Print Hall Selector */}
                <div className="flex items-center gap-1 bg-slate-200 px-2 py-1 rounded-lg">
                  <span className="text-[11px] font-bold text-slate-600">Hall:</span>
                  <select
                    value={printHallFilter}
                    onChange={e => setPrintHallFilter(e.target.value)}
                    className="text-xs font-bold bg-white rounded px-2 py-0.5 border border-slate-300 text-slate-900 cursor-pointer"
                  >
                    <option value="ALL">All Halls (Separate Pages)</option>
                    {halls.map(h => (
                      <option key={h.hallId} value={h.hallId}>
                        {h.hallName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Print Date Selector */}
                {datesRecorded.length > 0 && (
                  <div className="flex items-center gap-1 bg-slate-200 px-2 py-1 rounded-lg">
                    <span className="text-[11px] font-bold text-slate-600">Date:</span>
                    <select
                      value={printDateFilter}
                      onChange={e => setPrintDateFilter(e.target.value)}
                      className="text-xs font-bold bg-white rounded px-2 py-0.5 border border-slate-300 text-slate-900 cursor-pointer"
                    >
                      <option value="ALL">All Scheduled Dates</option>
                      {datesRecorded.map(d => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="p-8 overflow-y-auto print:p-0 font-sans">
              <PrintableAttendancePages
                records={filteredRecords.filter(r => {
                  if (printHallFilter !== 'ALL' && r.hallId !== printHallFilter && !r.hall.includes(printHallFilter)) {
                    return false;
                  }
                  if (printDateFilter !== 'ALL' && r.date !== printDateFilter) {
                    return false;
                  }
                  return true;
                })}
                exam={exam}
                session={session}
                halls={halls}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface PrintableAttendancePagesProps {
  records: {
    sNo: number;
    hall: string;
    hallId?: string;
    seatNo: string;
    className: string;
    rollNo: string;
    studentName: string;
    subject: string;
    date?: string;
    day?: string;
  }[];
  exam: string;
  session: string;
  halls: { hallId: string; hallName: string; capacity: number }[];
}

const PrintableAttendancePages: React.FC<PrintableAttendancePagesProps> = ({
  records,
  exam,
  session,
  halls
}) => {
  // Group by Hall + Date for clean page breaks
  const hallGroups = useMemo(() => {
    const map = new Map<string, typeof records>();
    records.forEach(r => {
      const key = `${r.hallId || r.hall}__${r.date || 'ALL'}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(r);
    });
    return Array.from(map.entries());
  }, [records]);

  if (hallGroups.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        No attendance records match the selected print filter.
      </div>
    );
  }

  return (
    <div className="space-y-8 print:space-y-0">
      {hallGroups.map(([groupKey, groupRecords], gIdx) => {
        const first = groupRecords[0];
        const hallName = first?.hall || 'Examination Hall';
        const dateStr = first?.date;
        const dayStr = first?.day;

        return (
          <div
            key={groupKey}
            className={`space-y-4 print:space-y-3 ${
              gIdx > 0 ? 'print:break-before-page pt-6 print:pt-0' : ''
            }`}
          >
            {/* School Header */}
            <HeaderPrint
              title="EXAMINATION ATTENDANCE REGISTER (कक्षावार उपस्थिति पत्रक)"
              subtitle={`Academic Session: ${session} • Examination: ${exam}`}
              exam={exam}
              session={session}
            />

            {/* Prominent Hall Name Heading in Banner (User Requirement 2) */}
            <div className="border-2 border-black bg-slate-100 p-2.5 text-center">
              <div className="text-[10px] text-slate-700 font-extrabold uppercase tracking-widest">
                ▲ EXAMINATION ROOM / HALL LOCATION ▲
              </div>
              <div className="text-base sm:text-xl font-black text-black tracking-wide uppercase mt-0.5">
                HALL NAME: {hallName.toUpperCase()}
              </div>
              <div className="text-xs font-bold text-slate-800 flex items-center justify-center gap-4 mt-1 border-t border-slate-300 pt-1">
                {dateStr && (
                  <span>
                    दिनांक (Exam Date): <strong className="font-mono">{dateStr}</strong>{' '}
                    {dayStr ? `(${dayStr})` : ''}
                  </span>
                )}
                <span>
                  कुल परीक्षार्थी (Total Candidates): <strong>{groupRecords.length}</strong>
                </span>
                <span>
                  सत्र: <strong>{session}</strong>
                </span>
              </div>
            </div>

            {/* Table */}
            <table className="w-full text-left text-xs border-collapse border-2 border-black">
              <thead>
                <tr className="bg-slate-200 border-b-2 border-black text-black font-black uppercase text-[10px]">
                  <th className="py-2 px-1.5 border border-black w-8 text-center">क्र.</th>
                  <th className="py-2 px-1.5 border border-black w-14 text-center">सीट</th>
                  <th className="py-2 px-1.5 border border-black w-14 text-center">कक्षा</th>
                  <th className="py-2 px-1.5 border border-black w-12 text-center">रोल</th>
                  <th className="py-2 px-2 border border-black">परीक्षार्थी का नाम (Student Name)</th>
                  <th className="py-2 px-2 border border-black">विषय (Exam Subject)</th>
                  <th className="py-2 px-2 border border-black w-32 text-center">
                    परीक्षार्थी हस्ताक्षर (Signature)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {groupRecords.map((rec, idx) => (
                  <tr key={idx} className="border-b border-black">
                    <td className="py-1.5 px-1.5 border border-black text-center font-mono font-bold text-black text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-1.5 px-1.5 border border-black text-center font-mono font-black text-black text-xs">
                      {rec.seatNo}
                    </td>
                    <td className="py-1.5 px-1.5 border border-black text-center font-black text-black text-[11px]">
                      {rec.className}
                    </td>
                    <td className="py-1.5 px-1.5 border border-black text-center font-black text-black text-[11px]">
                      {rec.rollNo}
                    </td>
                    <td className="py-1.5 px-2 border border-black font-bold text-black text-[11px]">
                      {rec.studentName}
                    </td>
                    <td className="py-1.5 px-2 border border-black font-bold text-black text-[11px]">
                      {rec.subject}
                    </td>
                    <td className="py-1.5 px-2 border border-black text-center">
                      <div className="h-5 border-b border-slate-400 mx-auto w-24"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Signature Block */}
            <div className="mt-8 pt-3 flex justify-between text-center text-xs text-black">
              <div className="w-48 text-center">
                <div className="h-8"></div>
                <div className="border-t-2 border-black pt-1 font-bold">
                  कक्ष निरीक्षक हस्ताक्षर
                  <div className="text-[10px] text-slate-700 font-medium">
                    (Invigilator Signature)
                  </div>
                </div>
              </div>

              <div className="w-48 text-center">
                <div className="h-8"></div>
                <div className="border-t-2 border-black pt-1 font-bold">
                  हॉल अधीक्षक हस्ताक्षर
                  <div className="text-[10px] text-slate-700 font-medium">
                    (Hall Superintendent)
                  </div>
                </div>
              </div>

              <div className="w-48 text-center">
                <div className="h-8"></div>
                <div className="border-t-2 border-black pt-1 font-bold">
                  केंद्राधीक्षक मुहर
                  <div className="text-[10px] text-slate-700 font-medium">
                    (Centre Superintendent Stamp)
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
