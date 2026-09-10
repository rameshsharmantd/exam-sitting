import React, { useState } from 'react';
import {
  Printer,
  FileText,
  Users,
  Building2,
  Grid3X3,
  FileCheck,
  Eye,
  Download
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { HeaderPrint } from '../common/HeaderPrint';

export const ReportsView: React.FC = () => {
  const {
    settings,
    students,
    halls,
    sittingPlans,
    attendanceRecords,
    getStudentsByClass
  } = useSchool();

  const [activeReport, setActiveReport] = useState<
    'studentList' | 'individualStudent' | 'hallList' | 'sittingPlan' | 'attendanceSheet' | 'schoolSummary'
  >('studentList');

  // Filters for reports
  const [selectedClass, setSelectedClass] = useState<string>('XA');
  const [selectedStudentKey, setSelectedStudentKey] = useState<string>('');
  const [selectedHallId, setSelectedHallId] = useState<string>('HALL-101');
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');

  const handlePrint = () => {
    window.print();
  };

  const classStudents = getStudentsByClass(selectedClass === 'ALL' ? undefined : selectedClass);
  const targetStudent = students.find(s => s.recordKey === selectedStudentKey) || students[0];
  const targetSitting = getSittingPlan(settings.defaultExam, settings.defaultSession, selectedHallId);

  // Helper from context
  function getSittingPlan(exam: string, session: string, hallId: string) {
    const key = `${exam}_${session}_${hallId}`;
    return sittingPlans[key];
  }

  const reportsNav = [
    { id: 'studentList', label: '1. Class Student List', icon: <Users className="w-4 h-4" /> },
    { id: 'individualStudent', label: '2. Student Record Card', icon: <FileText className="w-4 h-4" /> },
    { id: 'hallList', label: '3. Examination Halls Master', icon: <Building2 className="w-4 h-4" /> },
    { id: 'sittingPlan', label: '4. Seating Plan (Notice Board)', icon: <Grid3X3 className="w-4 h-4" /> },
    { id: 'attendanceSheet', label: '5. Exam Attendance Register', icon: <FileCheck className="w-4 h-4" /> },
    { id: 'schoolSummary', label: '6. School Enrollment Summary', icon: <FileText className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* Report Selection Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 print:hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Official School Reports & PDF Generator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate standardized, print-ready documents formatted with institutional letterheads
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Current Report / PDF</span>
          </button>
        </div>

        {/* Report Tabs */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {reportsNav.map(item => {
            const isActive = activeReport === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveReport(item.id as any)}
                className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer flex flex-col gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-blue-600'}>{item.icon}</span>
                <span className="leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Filters depending on report */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs">
          {activeReport === 'studentList' && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Select Class:</span>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
              >
                <option value="ALL">All Classes Combined</option>
                {settings.classes.map(cls => (
                  <option key={cls} value={cls}>
                    Class {cls}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeReport === 'individualStudent' && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Select Student:</span>
              <select
                value={selectedStudentKey || (students[0]?.recordKey ?? '')}
                onChange={e => setSelectedStudentKey(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
              >
                {students.map(s => (
                  <option key={s.recordKey} value={s.recordKey}>
                    {s.studentId} - {s.name} (Class {s.className}, Roll {s.rollNo})
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeReport === 'sittingPlan' && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Select Examination Hall:</span>
              <select
                value={selectedHallId}
                onChange={e => setSelectedHallId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
              >
                {halls.map(h => (
                  <option key={h.hallId} value={h.hallId}>
                    {h.hallId} - {h.hallName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeReport === 'attendanceSheet' && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Subject:</span>
              <input
                type="text"
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="px-3 py-1 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 w-44"
              />
            </div>
          )}
        </div>
      </div>

      {/* Report Preview Document Paper Container */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-8 sm:p-12 max-w-5xl mx-auto print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none">
        {/* REPORT 1: Student List */}
        {activeReport === 'studentList' && (
          <div>
            <HeaderPrint
              title={`OFFICIAL STUDENT DIRECTORY - ${selectedClass === 'ALL' ? 'ALL CLASSES' : `CLASS ${selectedClass}`}`}
              subtitle={`Total Enrolled Candidates: ${classStudents.length}`}
            />

            <table className="w-full text-left text-xs border-collapse border border-slate-400 mt-4">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2 px-2 border border-slate-300 text-center w-12">Roll</th>
                  <th className="py-2 px-2 border border-slate-300 w-20">Student ID</th>
                  <th className="py-2 px-2 border border-slate-300 w-16 text-center">Class</th>
                  <th className="py-2 px-2 border border-slate-300">Name of Student</th>
                  <th className="py-2 px-2 border border-slate-300">Father's Name</th>
                  <th className="py-2 px-2 border border-slate-300">Contact</th>
                  <th className="py-2 px-2 border border-slate-300">Admission No</th>
                  <th className="py-2 px-2 border border-slate-300">House</th>
                </tr>
              </thead>
              <tbody>
                {classStudents.map(s => (
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
                    <td className="py-1.5 px-2 border border-slate-300 font-bold">
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
              </tbody>
            </table>

            <div className="mt-12 flex justify-between text-center text-xs text-slate-600">
              <div className="w-48 border-t border-slate-800 pt-1 font-semibold">
                Class Incharge Signature
              </div>
              <div className="w-48 border-t border-slate-800 pt-1 font-semibold">
                Principal Signature
              </div>
            </div>
          </div>
        )}

        {/* REPORT 2: Individual Student Biodata Card */}
        {activeReport === 'individualStudent' && targetStudent && (
          <div>
            <HeaderPrint
              title="INDIVIDUAL STUDENT BIO-DATA & RECORD SHEET"
              subtitle={`Permanent Record Key: ${targetStudent.recordKey}`}
            />

            <div className="border-2 border-slate-400 p-6 rounded-xl my-6 bg-slate-50/50">
              <div className="flex justify-between items-start gap-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {targetStudent.name}
                  </h3>
                  <div className="text-xs text-slate-600 mt-1 space-x-3">
                    <span className="font-bold text-slate-800">
                      Father's Name: {targetStudent.fatherName || 'N/A'}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-blue-800">
                      Class: {targetStudent.className}
                    </span>
                    <span>•</span>
                    <span className="font-bold text-slate-800">
                      Roll Number: {targetStudent.rollNo}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <span className="px-2.5 py-1 rounded bg-blue-100 text-blue-900 font-mono font-bold text-xs">
                      ID: {targetStudent.studentId}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-slate-200 text-slate-800 font-medium text-xs">
                      Admission: {targetStudent.admissionNo}
                    </span>
                    <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-medium text-xs">
                      House: {targetStudent.house || 'General'}
                    </span>
                  </div>
                </div>

                <div className="w-24 h-28 border-2 border-dashed border-slate-400 rounded-lg flex flex-col items-center justify-center text-[10px] text-slate-400 uppercase font-bold shrink-0">
                  Affix Passport Photo
                </div>
              </div>

              <div className="mt-6 border-t border-slate-300 pt-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-600">Gender:</span> {targetStudent.gender || 'Not specified'}
                </div>
                <div>
                  <span className="font-bold text-slate-600">Category:</span> {targetStudent.category || 'General'}
                </div>
                <div>
                  <span className="font-bold text-slate-600">Contact Number:</span> {targetStudent.contact || 'N/A'}
                </div>
                <div>
                  <span className="font-bold text-slate-600">Permanent Address:</span> {targetStudent.address || 'N/A'}
                </div>
                <div className="col-span-2">
                  <span className="font-bold text-slate-600">Remarks / Teacher Notes:</span> {targetStudent.remarks || 'Regular student in good standing.'}
                </div>
              </div>
            </div>

            <div className="mt-16 flex justify-between text-center text-xs text-slate-600">
              <div className="w-48 border-t border-slate-800 pt-1 font-semibold">
                Student / Guardian Signature
              </div>
              <div className="w-48 border-t border-slate-800 pt-1 font-semibold">
                Class Teacher
              </div>
              <div className="w-48 border-t border-slate-800 pt-1 font-semibold">
                Principal Seal & Stamp
              </div>
            </div>
          </div>
        )}

        {/* REPORT 3: Hall Master List */}
        {activeReport === 'hallList' && (
          <div>
            <HeaderPrint
              title="EXAMINATION HALL INFRASTRUCTURE MASTER REGISTER"
              subtitle={`Total Examination Venues: ${halls.length} | Total School Desk Capacity: ${halls.reduce((a, b) => a + b.capacity, 0)}`}
            />

            <table className="w-full text-left text-xs border-collapse border border-slate-400 mt-4">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3 border border-slate-300">Hall ID</th>
                  <th className="py-2.5 px-3 border border-slate-300">Hall Name</th>
                  <th className="py-2.5 px-3 border border-slate-300 text-center">Rows</th>
                  <th className="py-2.5 px-3 border border-slate-300 text-center">Columns</th>
                  <th className="py-2.5 px-3 border border-slate-300 text-center">Capacity</th>
                  <th className="py-2.5 px-3 border border-slate-300">Door Position</th>
                  <th className="py-2.5 px-3 border border-slate-300">Window Position</th>
                  <th className="py-2.5 px-3 border border-slate-300 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {halls.map(h => (
                  <tr key={h.hallId} className="border-b border-slate-300">
                    <td className="py-2 px-3 border border-slate-300 font-mono font-bold">
                      {h.hallId}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 font-bold">
                      {h.hallName}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 text-center">
                      {h.rows}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 text-center">
                      {h.columns}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 text-center font-bold">
                      {h.capacity}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 font-mono">
                      {h.doorPosition || 'None'}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 font-mono">
                      {h.windowPosition || 'None'}
                    </td>
                    <td className="py-2 px-3 border border-slate-300 text-center font-bold">
                      {h.active ? 'ACTIVE' : 'INACTIVE'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-12 flex justify-between text-center text-xs text-slate-600">
              <div className="w-48 border-t border-slate-800 pt-1 font-semibold">
                Estate Officer
              </div>
              <div className="w-48 border-t border-slate-800 pt-1 font-semibold">
                Examination Convenor
              </div>
            </div>
          </div>
        )}

        {/* REPORT 4: Seating Plan */}
        {activeReport === 'sittingPlan' && (
          <div>
            <HeaderPrint
              title={`EXAMINATION SEATING ARRANGEMENT - HALL ${selectedHallId}`}
              subtitle={`Examination: ${settings.defaultExam} | Academic Session: ${settings.defaultSession}`}
            />

            {!targetSitting ? (
              <div className="p-8 text-center text-xs text-slate-500 border border-slate-300 rounded-xl my-4">
                No sitting arrangement generated yet for Hall {selectedHallId}. Please go to Sitting Arrangement Planner to seat students.
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-3 border-b pb-2">
                  <span>Venue: {targetSitting.hallName}</span>
                  <span>Algorithm: {targetSitting.algorithm}</span>
                  <span>Total Seated: {targetSitting.seats.filter(s => s.studentName.trim() !== '').length} candidates</span>
                </div>

                <table className="w-full text-left text-xs border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-2 px-3 border border-slate-300 text-center w-14">Seat</th>
                      <th className="py-2 px-3 border border-slate-300 w-16">Class</th>
                      <th className="py-2 px-3 border border-slate-300 text-center w-12">Roll</th>
                      <th className="py-2 px-3 border border-slate-300">Student Name</th>
                      <th className="py-2 px-3 border border-slate-300">Student ID</th>
                      <th className="py-2 px-3 border border-slate-300">Marker Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targetSitting.seats
                      .filter(s => s.studentName.trim() !== '')
                      .map(s => (
                        <tr key={s.seatNo} className="border-b border-slate-300">
                          <td className="py-1.5 px-3 border border-slate-300 font-mono font-bold text-center">
                            {s.seatNo}
                          </td>
                          <td className="py-1.5 px-3 border border-slate-300 font-bold">
                            {s.className}
                          </td>
                          <td className="py-1.5 px-3 border border-slate-300 text-center font-bold">
                            {s.rollNo}
                          </td>
                          <td className="py-1.5 px-3 border border-slate-300 font-bold">
                            {s.studentName}
                          </td>
                          <td className="py-1.5 px-3 border border-slate-300 font-mono">
                            {s.studentId}
                          </td>
                          <td className="py-1.5 px-3 border border-slate-300 text-slate-600">
                            {s.doorWindow || 'Standard Seat'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-12 flex justify-between text-center text-xs text-slate-600">
              <div className="w-48 border-t border-slate-800 pt-1 font-semibold">
                Hall Invigilator
              </div>
              <div className="w-48 border-t border-slate-800 pt-1 font-semibold">
                Chief Superintendent
              </div>
            </div>
          </div>
        )}

        {/* REPORT 5: Attendance Sheet */}
        {activeReport === 'attendanceSheet' && (
          <div>
            <HeaderPrint
              title={`EXAMINATION CANDIDATE ATTENDANCE REGISTER - ${selectedSubject.toUpperCase()}`}
              subtitle={`Examination: ${settings.defaultExam} | Academic Session: ${settings.defaultSession}`}
            />

            <table className="w-full text-left text-xs border-collapse border border-slate-400 mt-4">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-2 px-2 border border-slate-300 text-center w-10">S.No</th>
                  <th className="py-2 px-2 border border-slate-300">Exam Hall</th>
                  <th className="py-2 px-2 border border-slate-300 text-center w-14">Seat</th>
                  <th className="py-2 px-2 border border-slate-300 text-center w-14">Class</th>
                  <th className="py-2 px-2 border border-slate-300 text-center w-12">Roll</th>
                  <th className="py-2 px-2 border border-slate-300">Student Name</th>
                  <th className="py-2 px-2 border border-slate-300">Subject</th>
                  <th className="py-2 px-2 border border-slate-300 w-32 text-center">Candidate Signature</th>
                </tr>
              </thead>
              <tbody>
                {(attendanceRecords.length > 0
                  ? attendanceRecords.filter(r => r.subject.toLowerCase() === selectedSubject.toLowerCase())
                  : []
                ).map((r, i) => (
                  <tr key={i} className="border-b border-slate-300">
                    <td className="py-2 px-2 border border-slate-300 text-center font-mono">
                      {i + 1}
                    </td>
                    <td className="py-2 px-2 border border-slate-300 font-medium">
                      {r.hall}
                    </td>
                    <td className="py-2 px-2 border border-slate-300 text-center font-mono font-bold">
                      {r.seatNo}
                    </td>
                    <td className="py-2 px-2 border border-slate-300 text-center font-bold">
                      {r.className}
                    </td>
                    <td className="py-2 px-2 border border-slate-300 text-center font-bold">
                      {r.rollNo}
                    </td>
                    <td className="py-2 px-2 border border-slate-300 font-bold">
                      {r.studentName}
                    </td>
                    <td className="py-2 px-2 border border-slate-300">
                      {r.subject}
                    </td>
                    <td className="py-2 px-2 border border-slate-300 text-center">
                      <div className="h-5 border-b border-slate-400 mx-auto w-24"></div>
                    </td>
                  </tr>
                ))}
                {attendanceRecords.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-6 text-slate-500">
                      No attendance sheets generated for this subject yet. Go to Exam Attendance to generate records.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="mt-12 flex justify-between text-center text-xs text-slate-600">
              <div className="w-48 border-t border-slate-800 pt-1 font-semibold">
                Invigilator Signature
              </div>
              <div className="w-48 border-t border-slate-800 pt-1 font-semibold">
                Superintendent Stamp
              </div>
            </div>
          </div>
        )}

        {/* REPORT 6: School Summary Report */}
        {activeReport === 'schoolSummary' && (
          <div>
            <HeaderPrint
              title="COMPREHENSIVE SCHOOL ENROLLMENT & SECTION BREAKDOWN"
              subtitle={`Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
            />

            <div className="mt-4 border border-slate-400 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-4 border border-slate-300 w-24">Grade / Section</th>
                    <th className="py-2.5 px-4 border border-slate-300">Section Description</th>
                    <th className="py-2.5 px-4 border border-slate-300 text-center w-36">Total Students</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {settings.classes.map(cls => {
                    const count = getStudentsByClass(cls).length;
                    return (
                      <tr key={cls} className="border-b border-slate-300">
                        <td className="py-2 px-4 border border-slate-300 font-bold">
                          Class {cls}
                        </td>
                        <td className="py-2 px-4 border border-slate-300 text-slate-600">
                          Senior Secondary English Medium Section
                        </td>
                        <td className="py-2 px-4 border border-slate-300 text-center font-bold text-slate-900">
                          {count}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-800 text-sm">
                    <td className="py-3 px-4 border border-slate-300" colSpan={2}>
                      TOTAL CONSOLIDATED STUDENT STRENGTH
                    </td>
                    <td className="py-3 px-4 border border-slate-300 text-center font-black text-blue-900">
                      {students.length}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-12 flex justify-between text-center text-xs text-slate-600">
              <div className="w-48 border-t border-slate-800 pt-1 font-semibold">
                Prepared by Registrar
              </div>
              <div className="w-48 border-t border-slate-800 pt-1 font-semibold">
                Verified by Principal
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
