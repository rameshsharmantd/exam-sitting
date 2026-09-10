import React, { useState } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { Student } from '../../types';
import { useSchool } from '../../context/SchoolContext';
import { CONFIG } from '../../data/constants';
import { DuplicateWarningModal } from '../common/DuplicateWarningModal';

interface StudentEditModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentEditModal: React.FC<StudentEditModalProps> = ({ student, isOpen, onClose }) => {
  const { updateStudent, settings } = useSchool();

  const [formData, setFormData] = useState<Student | null>(student);
  const [duplicateWarnings, setDuplicateWarnings] = useState<string[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setFormData(student);
    setError(null);
  }, [student]);

  if (!isOpen || !formData) return null;

  const handleChange = (field: keyof Student, value: string) => {
    setFormData(prev => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSave = (forceConfirmed = false) => {
    if (!formData) return;
    setError(null);

    if (!formData.name.trim()) {
      setError('Student Name is required.');
      return;
    }

    const res = updateStudent(formData, forceConfirmed);
    if (res.requiresConfirmation && res.warnings) {
      setDuplicateWarnings(res.warnings);
      setShowDuplicateModal(true);
      return;
    }

    if (res.success) {
      setShowDuplicateModal(false);
      onClose();
    } else {
      setError(res.warnings?.[0] || 'Failed to update student.');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Edit Student Details: {formData.name}
              </h3>
              <p className="text-xs text-slate-500">
                Student ID: <span className="font-mono font-bold text-slate-700">{formData.studentId}</span> • Class: {formData.className} • Roll: {formData.rollNo}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form body */}
          <div className="p-6 overflow-y-auto space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Class / Section *
                </label>
                <select
                  value={formData.className}
                  onChange={e => handleChange('className', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                >
                  {settings.classes.map(cls => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400">
                  Note: Changing class moves the student and automatically resequences roll numbers.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Father's Name
                </label>
                <input
                  type="text"
                  value={formData.fatherName}
                  onChange={e => handleChange('fatherName', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={e => handleChange('gender', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                >
                  <option value="">Select Gender</option>
                  {CONFIG.GENDERS.map(g => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  House
                </label>
                <select
                  value={formData.house}
                  onChange={e => handleChange('house', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                >
                  <option value="">Select House</option>
                  {CONFIG.HOUSES.map(h => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={e => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
                >
                  <option value="">Select Category</option>
                  {CONFIG.CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact No.
                </label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={e => handleChange('contact', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Admission No.
                </label>
                <input
                  type="text"
                  value={formData.admissionNo}
                  onChange={e => handleChange('admissionNo', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Residential Address
              </label>
              <textarea
                value={formData.address}
                onChange={e => handleChange('address', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Remarks
              </label>
              <textarea
                value={formData.remarks}
                onChange={e => handleChange('remarks', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(false)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Student</span>
            </button>
          </div>
        </div>
      </div>

      <DuplicateWarningModal
        isOpen={showDuplicateModal}
        warnings={duplicateWarnings}
        onConfirm={() => handleSave(true)}
        onCancel={() => setShowDuplicateModal(false)}
      />
    </>
  );
};
