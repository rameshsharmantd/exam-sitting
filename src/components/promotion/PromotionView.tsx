import React, { useState } from 'react';
import { ArrowRightLeft, AlertCircle, CheckCircle2, Users, ArrowRight, Sparkles } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { DuplicateWarningModal } from '../common/DuplicateWarningModal';

export const PromotionView: React.FC = () => {
  const { settings, getStudentsByClass, promoteClass, promoteStudent, students } = useSchool();

  const [tab, setTab] = useState<'bulk' | 'individual'>('bulk');

  // Bulk state
  const [sourceClass, setSourceClass] = useState<string>('IXA');
  const [targetClass, setTargetClass] = useState<string>('XA');
  const [bulkMessage, setBulkMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);
  const [bulkDuplicateWarnings, setBulkDuplicateWarnings] = useState<string[]>([]);
  const [showBulkDuplicateModal, setShowBulkDuplicateModal] = useState(false);

  // Individual state
  const [indSourceClass, setIndSourceClass] = useState<string>('IXA');
  const [indStudentKey, setIndStudentKey] = useState<string>('');
  const [indTargetClass, setIndTargetClass] = useState<string>('XA');
  const [indMessage, setIndMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const sourceStudents = getStudentsByClass(sourceClass);
  const targetStudents = getStudentsByClass(targetClass);

  const indClassStudents = getStudentsByClass(indSourceClass);

  const handleRunBulkPromotion = (confirmed = false) => {
    setBulkMessage(null);

    if (sourceClass === targetClass) {
      setBulkMessage({ type: 'error', text: 'Source and Target classes cannot be the same.' });
      return;
    }

    if (sourceStudents.length === 0) {
      setBulkMessage({ type: 'error', text: `No students enrolled in Source Class ${sourceClass} to promote.` });
      return;
    }

    const res = promoteClass(sourceClass, targetClass, confirmed);

    if (res.requiresConfirmation && res.warnings) {
      setBulkDuplicateWarnings(res.warnings);
      setShowBulkDuplicateModal(true);
      return;
    }

    if (res.success) {
      setShowBulkDuplicateModal(false);
      setShowBulkConfirmModal(false);
      setBulkMessage({
        type: 'success',
        text: res.message || `${res.moved} students promoted from ${sourceClass} to ${targetClass} successfully!`
      });
    } else {
      setBulkMessage({
        type: 'error',
        text: res.message || 'Promotion failed.'
      });
    }
  };

  const handleRunIndividualPromotion = () => {
    setIndMessage(null);

    if (!indStudentKey) {
      setIndMessage({ type: 'error', text: 'Please select a student to promote.' });
      return;
    }

    if (indSourceClass === indTargetClass) {
      setIndMessage({ type: 'error', text: 'Target class must be different from current class.' });
      return;
    }

    const res = promoteStudent(indStudentKey, indTargetClass, true);
    if (res.success && res.student) {
      setIndMessage({
        type: 'success',
        text: `Student ${res.student.name} promoted to Class ${indTargetClass} with new Roll No ${res.student.rollNo} and ID ${res.student.studentId}!`
      });
      setIndStudentKey('');
    } else {
      setIndMessage({
        type: 'error',
        text: res.warnings?.[0] || 'Failed to promote student.'
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setTab('bulk')}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
            tab === 'bulk'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Bulk Class Promotion
        </button>
        <button
          onClick={() => setTab('individual')}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer ${
            tab === 'individual'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Individual Student Promotion
        </button>
      </div>

      {tab === 'bulk' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Bulk Class-to-Class Promotion Engine
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Promote an entire cohort of students to the next grade. Roll numbers and student IDs in the target class are automatically sequenced.
            </p>
          </div>

          {bulkMessage && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 ${
                bulkMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {bulkMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span>{bulkMessage.text}</span>
            </div>
          )}

          {/* Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Source Class (Promoting From)
              </label>
              <select
                value={sourceClass}
                onChange={e => setSourceClass(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-blue-600"
              >
                {settings.classes.map(cls => (
                  <option key={cls} value={cls}>
                    Class {cls} ({getStudentsByClass(cls).length} students)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Target Class (Promoting To)
              </label>
              <select
                value={targetClass}
                onChange={e => setTargetClass(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-blue-600"
              >
                {settings.classes.map(cls => (
                  <option key={cls} value={cls}>
                    Class {cls} ({getStudentsByClass(cls).length} current students)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Promotion Impact Preview</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-200/80 text-blue-900 text-[11px] font-bold">
                {sourceStudents.length} Students Pending Move
              </span>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="p-3 bg-white rounded-xl border border-blue-100 flex-1 text-center w-full">
                <div className="text-slate-500 font-medium">Source: Class {sourceClass}</div>
                <div className="text-lg font-black text-slate-900 mt-1">
                  {sourceStudents.length} students
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Will be cleared upon promotion</div>
              </div>

              <ArrowRight className="w-6 h-6 text-blue-500 hidden sm:block shrink-0" />

              <div className="p-3 bg-white rounded-xl border border-blue-100 flex-1 text-center w-full">
                <div className="text-slate-500 font-medium">Target: Class {targetClass}</div>
                <div className="text-lg font-black text-slate-900 mt-1">
                  {targetStudents.length + sourceStudents.length} students
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  ({targetStudents.length} current + {sourceStudents.length} promoted)
                </div>
              </div>
            </div>

            {sourceStudents.length > 0 && (
              <div className="mt-4 pt-3 border-t border-blue-100">
                <div className="text-[11px] font-bold text-slate-700 mb-2">
                  Students to be promoted ({sourceStudents.length}):
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                  {sourceStudents.map(s => (
                    <span
                      key={s.recordKey}
                      className="px-2 py-0.5 rounded-md bg-white border border-blue-200 text-slate-700 text-[11px]"
                    >
                      {s.rollNo}. {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowBulkConfirmModal(true)}
              disabled={sourceStudents.length === 0 || sourceClass === targetClass}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Promote All {sourceStudents.length} Students</span>
            </button>
          </div>
        </div>
      ) : (
        /* Individual Student Promotion Tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Individual Student Promotion / Transfer
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Promote or transfer a single student into a specific grade or section.
            </p>
          </div>

          {indMessage && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 ${
                indMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {indMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span>{indMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Current Class
              </label>
              <select
                value={indSourceClass}
                onChange={e => {
                  setIndSourceClass(e.target.value);
                  setIndStudentKey('');
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-blue-600"
              >
                {settings.classes.map(cls => (
                  <option key={cls} value={cls}>
                    Class {cls}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Select Student
              </label>
              <select
                value={indStudentKey}
                onChange={e => setIndStudentKey(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-blue-600"
              >
                <option value="">-- Choose Student --</option>
                {indClassStudents.map(s => (
                  <option key={s.recordKey} value={s.recordKey}>
                    Roll {s.rollNo} - {s.name} ({s.studentId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Target Class
              </label>
              <select
                value={indTargetClass}
                onChange={e => setIndTargetClass(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-blue-600"
              >
                {settings.classes.map(cls => (
                  <option key={cls} value={cls}>
                    Class {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRunIndividualPromotion}
              disabled={!indStudentKey || indSourceClass === indTargetClass}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Promote Selected Student</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Bulk Promotion */}
      {showBulkConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">
              Confirm Bulk Cohort Promotion
            </h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to promote <span className="font-bold text-slate-800">{sourceStudents.length} students</span> from Class <span className="font-bold text-blue-700">{sourceClass}</span> to Class <span className="font-bold text-emerald-700">{targetClass}</span>?
            </p>
            <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg mt-3 text-left">
              • Source class ({sourceClass}) records will be migrated.<br />
              • Target class ({targetClass}) will resequence all roll numbers from 01 upwards.<br />
              • Audit log entry will be permanently written.
            </p>

            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => setShowBulkConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRunBulkPromotion(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Yes, Promote All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate warning modal */}
      <DuplicateWarningModal
        isOpen={showBulkDuplicateModal}
        warnings={bulkDuplicateWarnings}
        onConfirm={() => handleRunBulkPromotion(true)}
        onCancel={() => setShowBulkDuplicateModal(false)}
        title="Duplicate Warnings in Cohort"
      />
    </div>
  );
};
