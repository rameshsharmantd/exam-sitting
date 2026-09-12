import React, { useState } from 'react';
import {
  Search,
  Plus,
  Download,
  Edit2,
  Trash2,
  FileText,
  Filter,
  UploadCloud,
  FileSpreadsheet,
  Printer,
  ChevronDown
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { Student, ActiveSection } from '../../types';
import { StudentEditModal } from './StudentEditModal';
import { StudentProfileModal } from './StudentProfileModal';
import { BulkUploadModal } from './BulkUploadModal';
import { ClassWisePrintModal } from './ClassWisePrintModal';
import { exportStudentsToExcel, exportStudentsToPDF } from '../../utils/studentExportUtils';

interface StudentsViewProps {
  onNavigate: (section: ActiveSection) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ onNavigate }) => {
  const { students, getStudentsByClass, deleteStudent, settings } = useSchool();

  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingProfileStudent, setViewingProfileStudent] = useState<Student | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<Student | null>(null);

  // New Modals & Menus
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [isClassPrintOpen, setIsClassPrintOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Filter students
  const classStudents = getStudentsByClass(selectedClass === 'ALL' ? undefined : selectedClass);
  const q = searchQuery.trim().toLowerCase();

  const filteredStudents = classStudents.filter(s => {
    if (!q) return true;
    return (
      s.studentId.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.fatherName.toLowerCase().includes(q) ||
      s.contact.includes(q) ||
      s.admissionNo.toLowerCase().includes(q) ||
      s.rollNo.includes(q) ||
      s.className.toLowerCase().includes(q)
    );
  });

  const handleDelete = (student: Student) => {
    setDeleteConfirmation(student);
  };

  const confirmDelete = () => {
    if (deleteConfirmation) {
      deleteStudent(deleteConfirmation.recordKey);
      setDeleteConfirmation(null);
    }
  };

  const handleExportExcel = () => {
    setIsExportMenuOpen(false);
    exportStudentsToExcel(filteredStudents, {
      className: selectedClass,
      session: settings.defaultSession,
      schoolSettings: settings
    });
  };

  const handleExportPDF = () => {
    setIsExportMenuOpen(false);
    exportStudentsToPDF(filteredStudents, {
      className: selectedClass,
      session: settings.defaultSession,
      schoolSettings: settings
    });
  };

  const handleExportCSV = () => {
    setIsExportMenuOpen(false);
    const headers = [
      'Roll No.',
      'Name of Students',
      "Father's Name",
      'Gender',
      'House',
      'Category',
      'Contact No.',
      'Admission No.',
      'Student ID',
      'Class',
      'Address',
      'Remarks',
      'Record Key'
    ];

    const rows = filteredStudents.map(s => [
      `"${s.rollNo}"`,
      `"${s.name}"`,
      `"${s.fatherName}"`,
      `"${s.gender}"`,
      `"${s.house}"`,
      `"${s.category}"`,
      `"${s.contact}"`,
      `"${s.admissionNo}"`,
      `"${s.studentId}"`,
      `"${s.className}"`,
      `"${s.address.replace(/"/g, '""')}"`,
      `"${s.remarks.replace(/"/g, '""')}"`,
      `"${s.recordKey}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Students_${selectedClass}_${settings.defaultSession}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Class selector */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 hover:bg-white focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="ALL">All Classes ({students.length} students)</option>
              {settings.classes.map(cls => (
                <option key={cls} value={cls}>
                  Class {cls} ({students.filter(s => s.className === cls).length})
                </option>
              ))}
            </select>
          </div>

          {/* Quick search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, roll..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Action buttons toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          {/* Class-wise Print Button */}
          <button
            onClick={() => setIsClassPrintOpen(true)}
            className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Print Class-wise Roll List"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print {selectedClass === 'ALL' ? 'Class-wise' : `Class ${selectedClass}`}</span>
          </button>

          {/* Export Dropdown (Excel, PDF, CSV) */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isExportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsExportMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white border border-slate-200 shadow-xl py-1 z-30 text-xs">
                  <button
                    onClick={handleExportExcel}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Export to Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-rose-600" />
                    <span>Export to PDF (.pdf)</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Export to CSV (.csv)</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Bulk Upload Button */}
          <button
            onClick={() => setIsBulkUploadOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Bulk Upload Students from Excel or CSV"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Bulk Upload</span>
          </button>

          {/* Add Single Student Button */}
          <button
            onClick={() => onNavigate('addStudent')}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Enrolled Students ({filteredStudents.length} records)
          </span>
          <span className="text-[11px] text-slate-500">
            Automatic Roll Number Sequence & ID Mapping Active
          </span>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No students found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No student matching "${searchQuery}" in ${selectedClass === 'ALL' ? 'any class' : `Class ${selectedClass}`}.`
                : `No students registered yet in Class ${selectedClass}.`}
            </p>
            <button
              onClick={() => onNavigate('addStudent')}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer"
            >
              Add First Student in this Class
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-14 text-center">Roll</th>
                  <th className="py-3 px-3">Student ID</th>
                  <th className="py-3 px-3">Class</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">Father's Name</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Admission No</th>
                  <th className="py-3 px-3">House</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(student => (
                  <tr
                    key={student.recordKey}
                    className="hover:bg-blue-50/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                      {student.rollNo}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                      {student.studentId}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-700 text-[11px]">
                        {student.className}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {student.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {student.fatherName || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {student.contact || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {student.admissionNo || '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      {student.house ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          {student.house}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingProfileStudent(student)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                          title="View Profile / Print Record"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingStudent(student)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                          title="Edit Student"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(student)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Delete Student"
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

      {/* Edit Student Modal */}
      <StudentEditModal
        student={editingStudent}
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
      />

      {/* Printable Profile Modal */}
      <StudentProfileModal
        student={viewingProfileStudent}
        isOpen={!!viewingProfileStudent}
        onClose={() => setViewingProfileStudent(null)}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-red-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Delete Student Record?</h4>
            <p className="text-xs text-slate-600 mt-2">
              Are you sure you want to delete <span className="font-bold text-slate-800">{deleteConfirmation.name}</span> ({deleteConfirmation.studentId}) from Class {deleteConfirmation.className}?
            </p>
            <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg mt-3 font-medium text-left">
              ⚠️ Roll numbers below this student in Class {deleteConfirmation.className} will be automatically resequenced!
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        defaultClass={selectedClass}
      />

      {/* Class-wise Printable Register Modal */}
      <ClassWisePrintModal
        isOpen={isClassPrintOpen}
        onClose={() => setIsClassPrintOpen(false)}
        selectedClass={selectedClass}
        students={filteredStudents}
        settings={settings}
      />
    </div>
  );
};
