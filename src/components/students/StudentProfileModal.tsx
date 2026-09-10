import React from 'react';
import { X, Printer, User, Phone, MapPin, Award, BookOpen } from 'lucide-react';
import { Student } from '../../types';
import { HeaderPrint } from '../common/HeaderPrint';

interface StudentProfileModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  isOpen,
  onClose
}) => {
  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
        {/* Modal bar */}
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
            Official Student Record
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Body (Printable) */}
        <div className="p-8 overflow-y-auto print:p-0">
          <HeaderPrint
            title="Individual Student Profile & Record Card"
            subtitle={`Record ID: ${student.recordKey}`}
          />

          {/* Student Profile Card Layout */}
          <div className="border border-slate-300 rounded-xl p-5 mb-5 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-20 h-24 rounded-lg bg-slate-200 border-2 border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0">
                  <User className="w-10 h-10" />
                  <span className="text-[9px] uppercase font-bold mt-1 text-slate-400">Photo</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">
                    {student.name}
                  </h3>
                  <div className="mt-1 text-xs text-slate-600 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      Father: {student.fatherName || 'N/A'}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-blue-800">
                      Class: {student.className}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-800">
                      Roll No: {student.rollNo}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold text-xs">
                      ID: {student.studentId}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-xs font-medium">
                      Adm: {student.admissionNo || 'N/A'}
                    </span>
                    {student.house && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-medium">
                        House: {student.house}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs text-slate-500">Gender</div>
                <div className="text-xs font-bold text-slate-800">{student.gender || 'Not specified'}</div>
                <div className="text-xs text-slate-500 mt-2">Category</div>
                <div className="text-xs font-bold text-slate-800">{student.category || 'General'}</div>
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-xs text-left">
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-slate-50">
                  <td className="px-4 py-2.5 font-bold text-slate-700 w-1/3 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Emergency Contact</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-900">{student.contact || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Residential Address</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-900">{student.address || 'Not on record'}</td>
                </tr>
                <tr className="bg-slate-50">
                  <td className="px-4 py-2.5 font-bold text-slate-700 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    <span>House / Activity Group</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-900">{student.house || 'None'}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-bold text-slate-700 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    <span>Academic & Behavior Remarks</span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-900">{student.remarks || 'Regular student, no negative remarks recorded.'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Official Signatures */}
          <div className="mt-12 pt-4 border-t border-dashed border-slate-300 flex justify-between text-center text-xs text-slate-600">
            <div className="w-40 border-t border-slate-700 pt-1 font-semibold">
              Class Teacher Signature
            </div>
            <div className="w-40 border-t border-slate-700 pt-1 font-semibold">
              Examination In-Charge
            </div>
            <div className="w-40 border-t border-slate-700 pt-1 font-semibold">
              Principal / Headmaster
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
