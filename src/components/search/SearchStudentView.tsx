import React, { useState } from 'react';
import { Search, FileText, Edit2, Trash2 } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { Student } from '../../types';
import { StudentEditModal } from '../students/StudentEditModal';
import { StudentProfileModal } from '../students/StudentProfileModal';

export const SearchStudentView: React.FC = () => {
  const { searchStudents, deleteStudent } = useSchool();

  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<Student[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingProfileStudent, setViewingProfileStudent] = useState<Student | null>(null);

  const handleSearch = () => {
    if (!query.trim()) return;
    const found = searchStudents(query);
    setResults(found);
    setHasSearched(true);
  };

  const handleDelete = (student: Student) => {
    if (confirm(`Are you sure you want to delete ${student.name} (${student.studentId})? Roll numbers in Class ${student.className} will be resequenced.`)) {
      deleteStudent(student.recordKey);
      setResults(prev => prev.filter(s => s.recordKey !== student.recordKey));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Bar Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <h3 className="text-base font-bold text-slate-900">
          Universal Student Search
        </h3>
        <p className="text-xs text-slate-500 mt-0.5 mb-4">
          Instantly locate any student by Student ID, Full Name, Father's Name, Contact Number, Admission Number, Roll Number, or Section.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSearch();
              }}
              placeholder="Search by Student ID (e.g. XA01), Student Name, Father's Name, Phone, or Admission No..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              autoFocus
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>Search Database</span>
          </button>
        </div>

        {/* Quick hint suggestions */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-700">Quick tests:</span>
          {['XA01', 'Sharma', '9876543210', 'ADM-2021', 'Gandhi'].map(tag => (
            <button
              key={tag}
              onClick={() => {
                setQuery(tag);
                const found = searchStudents(tag);
                setResults(found);
                setHasSearched(true);
              }}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 cursor-pointer font-mono"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Search Results ({results.length} matched)
            </span>
            <span className="text-xs text-slate-500">
              Query: <span className="font-semibold text-slate-800">"{query}"</span>
            </span>
          </div>

          {results.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No student records matched your query "{query}". Please check spelling or try another term.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-3">Student ID</th>
                    <th className="py-2.5 px-3">Class</th>
                    <th className="py-2.5 px-3">Roll</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Father's Name</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3">Admission</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map(student => (
                    <tr key={student.recordKey} className="hover:bg-blue-50/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                        {student.studentId}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-700 text-[11px]">
                          {student.className}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {student.rollNo}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
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
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingProfileStudent(student)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                            title="Print Record"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingStudent(student)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(student)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                            title="Delete Record"
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
      )}

      {/* Edit Modal */}
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
    </div>
  );
};
