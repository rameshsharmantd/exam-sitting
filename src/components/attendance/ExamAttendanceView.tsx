import React, { useState } from 'react';
import { FileCheck, Printer, Plus, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { CONFIG } from '../../data/constants';
import { HeaderPrint } from '../common/HeaderPrint';

export const ExamAttendanceView: React.FC = () => {
  const { settings, halls, generateAttendance, attendanceRecords, clearAttendanceForSubject } = useSchool();

  const [exam, setExam] = useState(settings.defaultExam);
  const [session, setSession] = useState(settings.defaultSession);
  const [hallId, setHallId] = useState<string>('ALL');
  const [subject, setSubject] = useState('Mathematics');

  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!subject.trim()) {
      setMessage({ type: 'error', text: 'Subject is required to generate attendance records.' });
      return;
    }

    const res = generateAttendance(exam, session, hallId, subject.trim());
    if (res.success) {
      setMessage({
        type: 'success',
        text: `Successfully generated ${res.generated} attendance records for ${subject.trim()} (${exam} - ${session})!`
      });
      setFilterSubject(subject.trim());
    } else {
      setMessage({
        type: 'error',
        text: res.message || 'Failed to generate attendance. Ensure sitting arrangement is generated first.'
      });
    }
  };

  // Distinct subjects in records
  const subjectsRecorded = Array.from(new Set(attendanceRecords.map(r => r.subject)));

  // Filter records
  const filteredRecords = attendanceRecords.filter(r => {
    if (filterSubject !== 'ALL' && r.subject !== filterSubject) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Exam Attendance Sheet Generator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pull assigned student desks from the Sitting Arrangement and create printable invigilator attendance registers.
            </p>
          </div>

          {filteredRecords.length > 0 && (
            <button
              onClick={() => setShowPrintModal(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Attendance Sheet</span>
            </button>
          )}
        </div>

        {message && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
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

        <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Examination
            </label>
            <input
              type="text"
              value={exam}
              onChange={e => setExam(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Academic Session
            </label>
            <input
              type="text"
              value={session}
              onChange={e => setSession(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Target Hall
            </label>
            <select
              value={hallId}
              onChange={e => setHallId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:outline-none focus:border-blue-600"
            >
              <option value="ALL">ALL EXAMINATION HALLS</option>
              {halls.map(h => (
                <option key={h.hallId} value={h.hallId}>
                  {h.hallId} - {h.hallName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              list="subject-list"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Mathematics"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold focus:outline-none focus:border-blue-600"
            />
            <datalist id="subject-list">
              {CONFIG.COMMON_SUBJECTS.map(sub => (
                <option key={sub} value={sub} />
              ))}
            </datalist>
          </div>

          <div className="sm:col-span-2 md:col-span-4 flex items-center justify-between pt-2">
            <p className="text-[11px] text-slate-400">
              Note: Historical attendance sheets are preserved. New generation runs append records safely.
            </p>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Attendance Sheet</span>
            </button>
          </div>
        </form>
      </div>

      {/* Register Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              Generated Attendance Records ({filteredRecords.length} entries)
            </span>
          </div>

          {subjectsRecorded.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Filter Subject:</span>
              <select
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-700"
              >
                <option value="ALL">All Subjects ({attendanceRecords.length})</option>
                {subjectsRecorded.map(sub => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No attendance records generated yet. Select an exam, session, and subject above, then click <strong>"Generate Attendance Sheet"</strong>.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3 w-12 text-center">S.No</th>
                  <th className="py-2.5 px-3">Hall</th>
                  <th className="py-2.5 px-3">Seat</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3">Roll</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3 w-36 text-center">Student Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map(rec => (
                  <tr key={`${rec.sNo}_${rec.hall}_${rec.seatNo}`} className="hover:bg-blue-50/40">
                    <td className="py-2 px-3 text-center font-bold text-slate-400">
                      {rec.sNo}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {rec.hall}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-blue-700">
                      {rec.seatNo}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold text-[10px] text-slate-700">
                        {rec.className}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-800">
                      {rec.rollNo}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-900">
                      {rec.studentName}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-700">
                      {rec.subject}
                    </td>
                    <td className="py-2 px-3 text-center border-l border-slate-100">
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
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
              <span className="text-xs font-bold text-slate-700 uppercase">
                Invigilator Examination Attendance Register
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
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

            <div className="p-8 overflow-y-auto print:p-0">
              <HeaderPrint
                title={`EXAMINATION ATTENDANCE REGISTER - ${filterSubject !== 'ALL' ? filterSubject : 'CONSOLIDATED'}`}
                subtitle={`Academic Session: ${session} | Examination: ${exam}`}
                exam={exam}
                session={session}
              />

              <div className="mb-4 text-xs font-semibold text-slate-700 flex justify-between border-b pb-2">
                <span>Subject: {filterSubject !== 'ALL' ? filterSubject : 'All Subjects'}</span>
                <span>Hall: {hallId}</span>
                <span>Total Candidates: {filteredRecords.length}</span>
              </div>

              <table className="w-full text-left text-xs border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 text-slate-900 font-bold uppercase text-[10px]">
                    <th className="py-2 px-2 border border-slate-300 w-10 text-center">S.No</th>
                    <th className="py-2 px-2 border border-slate-300">Hall</th>
                    <th className="py-2 px-2 border border-slate-300 w-14 text-center">Seat No</th>
                    <th className="py-2 px-2 border border-slate-300 w-14 text-center">Class</th>
                    <th className="py-2 px-2 border border-slate-300 w-12 text-center">Roll</th>
                    <th className="py-2 px-2 border border-slate-300">Student Name</th>
                    <th className="py-2 px-2 border border-slate-300">Subject</th>
                    <th className="py-2 px-2 border border-slate-300 w-32 text-center">Signature of Candidate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRecords.map((rec, idx) => (
                    <tr key={idx} className="border-b border-slate-300">
                      <td className="py-2 px-2 border border-slate-300 text-center font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 font-medium">
                        {rec.hall}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 text-center font-mono font-bold">
                        {rec.seatNo}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 text-center font-bold">
                        {rec.className}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 text-center font-bold">
                        {rec.rollNo}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 font-bold">
                        {rec.studentName}
                      </td>
                      <td className="py-2 px-2 border border-slate-300">
                        {rec.subject}
                      </td>
                      <td className="py-2 px-2 border border-slate-300 text-center">
                        <div className="h-5 border-b border-slate-400 mx-auto w-24"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-12 flex justify-between text-center text-xs text-slate-600">
                <div className="w-48 border-t border-slate-800 pt-1 font-semibold">
                  Invigilator Signature
                </div>
                <div className="w-48 border-t border-slate-800 pt-1 font-semibold">
                  Hall Superintendent Signature
                </div>
                <div className="w-48 border-t border-slate-800 pt-1 font-semibold">
                  Centre Superintendent Stamp
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
