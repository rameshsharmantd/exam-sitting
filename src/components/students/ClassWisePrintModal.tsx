import React from 'react';
import { Printer, X } from 'lucide-react';
import { Student, SystemSettings } from '../../types';

interface ClassWisePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: string;
  students: Student[];
  settings: SystemSettings;
}

export const ClassWisePrintModal: React.FC<ClassWisePrintModalProps> = ({
  isOpen,
  onClose,
  selectedClass,
  students,
  settings
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const title =
    selectedClass === 'ALL'
      ? 'OFFICIAL CONSOLIDATED STUDENT DIRECTORY'
      : `OFFICIAL CLASS ROLL LIST - CLASS ${selectedClass}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden">
        {/* Modal Controls (hidden on print) */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Print Class-wise Student List ({selectedClass === 'ALL' ? 'All Classes' : `Class ${selectedClass}`})
            </h3>
            <p className="text-xs text-slate-500">
              {students.length} students enrolled • Formatted with official school header for printing or PDF export
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-12 print:p-0 print:m-0 print:overflow-visible">
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
            <div className="text-xl font-bold tracking-tight text-slate-900 uppercase">
              {settings.schoolName || "ST. ALBERT'S SR. SEC. SCHOOL"}
            </div>
            <div className="text-xs text-slate-600 font-medium">
              {settings.subtitle || 'Manthan Valley • Senior Secondary English Medium Co-Educational Institution'}
            </div>
            <div className="text-[11px] text-slate-500">
              {settings.affiliation || 'Affiliated to CBSE, New Delhi'}
            </div>
            <div className="mt-2 inline-block px-3 py-1 rounded bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-800">
              Academic Session: {settings.defaultSession} &nbsp;|&nbsp; Examination: {settings.defaultExam}
            </div>
            <h2 className="text-base font-bold uppercase mt-2 text-slate-900 tracking-wider">
              {title}
            </h2>
            <p className="text-xs text-slate-600">
              Total Candidates: {students.length} &nbsp;•&nbsp; Date Generated:{' '}
              {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>

          {/* Table */}
          <table className="w-full text-left text-xs border-collapse border border-slate-400 mt-4">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2 px-2 border border-slate-300 text-center w-12">Roll</th>
                <th className="py-2 px-2 border border-slate-300 w-24">Student ID</th>
                <th className="py-2 px-2 border border-slate-300 w-16 text-center">Class</th>
                <th className="py-2 px-2 border border-slate-300">Name of Student</th>
                <th className="py-2 px-2 border border-slate-300">Father's Name</th>
                <th className="py-2 px-2 border border-slate-300">Contact</th>
                <th className="py-2 px-2 border border-slate-300">Admission No</th>
                <th className="py-2 px-2 border border-slate-300">House</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.recordKey} className="border-b border-slate-300">
                  <td className="py-1.5 px-2 border border-slate-300 text-center font-bold">
                    {s.rollNo}
                  </td>
                  <td className="py-1.5 px-2 border border-slate-300 font-mono font-bold">
                    {s.studentId}
                  </td>
                  <td className="py-1.5 px-2 border border-slate-300 text-center font-semibold">
                    {s.className}
                  </td>
                  <td className="py-1.5 px-2 border border-slate-300 font-bold text-slate-900">
                    {s.name}
                  </td>
                  <td className="py-1.5 px-2 border border-slate-300">
                    {s.fatherName || '—'}
                  </td>
                  <td className="py-1.5 px-2 border border-slate-300 font-mono">
                    {s.contact || '—'}
                  </td>
                  <td className="py-1.5 px-2 border border-slate-300">
                    {s.admissionNo || '—'}
                  </td>
                  <td className="py-1.5 px-2 border border-slate-300">
                    {s.house || '—'}
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                    No students found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Institutional Signatures */}
          <div className="mt-14 flex justify-between text-center text-xs text-slate-600 print:mt-16">
            <div className="w-48 border-t border-slate-800 pt-1 font-semibold">
              Class Teacher Signature
            </div>
            <div className="w-48 border-t border-slate-800 pt-1 font-semibold">
              Exam Cell Incharge
            </div>
            <div className="w-48 border-t border-slate-800 pt-1 font-semibold">
              Principal Signature & Seal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
