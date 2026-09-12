import React, { useState } from 'react';
import { UserPlus, RotateCcw, CheckCircle, AlertCircle, Sparkles, UploadCloud } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { CONFIG } from '../../data/constants';
import { DuplicateWarningModal } from '../common/DuplicateWarningModal';
import { BulkUploadModal } from './BulkUploadModal';

export const AddStudentView: React.FC = () => {
  const { addStudent, settings, getStudentsByClass } = useSchool();

  const [className, setClassName] = useState<string>('XA');
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [gender, setGender] = useState('');
  const [house, setHouse] = useState('');
  const [category, setCategory] = useState('General');
  const [contact, setContact] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [address, setAddress] = useState('');
  const [remarks, setRemarks] = useState('');

  const [duplicateWarnings, setDuplicateWarnings] = useState<string[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute preview of next roll & student ID for selected class
  const classStudents = getStudentsByClass(className);
  const previewRoll = String(classStudents.length + 1).padStart(2, '0');
  const previewStudentId = `${className}${previewRoll}`;

  const handleClear = () => {
    setName('');
    setFatherName('');
    setGender('');
    setHouse('');
    setCategory('General');
    setContact('');
    setAdmissionNo('');
    setAddress('');
    setRemarks('');
    setErrorMessage(null);
  };

  const handleSubmit = (confirmed = false) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!className) {
      setErrorMessage('Please select a class / section.');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Student Name is required.');
      return;
    }

    const payload = {
      className,
      name: name.trim(),
      fatherName: fatherName.trim(),
      gender,
      house,
      category,
      contact: contact.trim(),
      admissionNo: admissionNo.trim(),
      address: address.trim(),
      remarks: remarks.trim()
    };

    const res = addStudent(payload, confirmed);

    if (res.requiresConfirmation && res.warnings) {
      setDuplicateWarnings(res.warnings);
      setShowDuplicateModal(true);
      return;
    }

    if (res.success && res.student) {
      setShowDuplicateModal(false);
      setSuccessMessage(
        `Student "${res.student.name}" successfully registered with Student ID ${res.student.studentId} and Roll No ${res.student.rollNo}.`
      );
      handleClear();
    } else {
      setErrorMessage(res.warnings?.[0] || 'Failed to add student record.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3 shadow-xs">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-slate-200 gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Student Registration Form
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter official student details according to school admission records
            </p>
          </div>

          {/* Real-time Roll & ID Preview and Bulk Upload option */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowBulkModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Bulk Upload via Excel / CSV</span>
            </button>

            <div className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <div className="text-xs">
                <span className="text-slate-500">Auto-assigned ID: </span>
                <span className="font-mono font-bold text-blue-700">{previewStudentId}</span>
                <span className="text-slate-400"> (Roll: {previewRoll})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form fields */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSubmit(false);
          }}
          className="mt-6 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Class */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Class / Section *
              </label>
              <select
                value={className}
                onChange={e => setClassName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-medium"
              >
                {settings.classes.map(cls => (
                  <option key={cls} value={cls}>
                    Class {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Student Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Name of Student *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full student name"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Father's Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Father's Name
              </label>
              <input
                type="text"
                value={fatherName}
                onChange={e => setFatherName(e.target.value)}
                placeholder="Father / Guardian name"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Gender
              </label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-medium"
              >
                <option value="">Select Gender</option>
                {CONFIG.GENDERS.map(g => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* House */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                House
              </label>
              <select
                value={house}
                onChange={e => setHouse(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-medium"
              >
                <option value="">Select House</option>
                {CONFIG.HOUSES.map(h => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 bg-white font-medium"
              >
                {CONFIG.CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Contact No. */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Contact No.
              </label>
              <input
                type="text"
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Admission No. */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Admission No.
              </label>
              <input
                type="text"
                value={admissionNo}
                onChange={e => setAdmissionNo(e.target.value)}
                placeholder="e.g. ADM-2026-105"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              Permanent / Residential Address
            </label>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              rows={2}
              placeholder="House no., street, locality, city"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 resize-none"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              General Remarks & Notes
            </label>
            <textarea
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              rows={2}
              placeholder="Special achievements, medical notes, or conduct remarks"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Form</span>
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Student</span>
            </button>
          </div>
        </form>
      </div>

      {/* Duplicate warning modal */}
      <DuplicateWarningModal
        isOpen={showDuplicateModal}
        warnings={duplicateWarnings}
        onConfirm={() => handleSubmit(true)}
        onCancel={() => setShowDuplicateModal(false)}
        title="Duplicate Student Detection"
      />

      {/* Bulk upload modal */}
      <BulkUploadModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        defaultClass={className}
      />
    </div>
  );
};
