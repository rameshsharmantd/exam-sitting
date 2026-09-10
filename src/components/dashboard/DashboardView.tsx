import React from 'react';
import {
  Users,
  Building2,
  Calendar,
  Grid3X3,
  UserPlus,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { ActiveSection } from '../../types';

interface DashboardViewProps {
  onNavigate: (section: ActiveSection) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { students, halls, sittingPlans, settings, activityLogs } = useSchool();

  const totalStudents = students.length;
  const activeHalls = halls.filter(h => h.active);
  const totalCapacity = activeHalls.reduce((acc, h) => acc + h.capacity, 0);
  const generatedPlansCount = Object.keys(sittingPlans).length;

  // Class counts
  const classCounts: Record<string, number> = {};
  settings.classes.forEach(cls => {
    classCounts[cls] = students.filter(s => s.className === cls).length;
  });

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Total Enrolled
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
            {totalStudents}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <span>Across 23 standard sections</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Exam Halls
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
            {activeHalls.length}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">
            Total desk capacity: <span className="font-bold text-slate-700">{totalCapacity}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Sitting Plans
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Grid3X3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
            {generatedPlansCount}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">
            Active exam arrangements
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Active Session
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-lg font-black text-slate-900 tracking-tight truncate">
            {settings.defaultExam}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">
            Academic Year {settings.defaultSession}
          </p>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold">Exam Preparation Shortcuts</h3>
            <p className="text-xs text-blue-100 mt-0.5">
              Rapidly manage student enrolments, exam halls, and desk allocations
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('timetable')}
              className="px-3.5 py-2 rounded-xl bg-white text-blue-900 text-xs font-bold hover:bg-blue-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Exam Time Table</span>
            </button>
            <button
              onClick={() => onNavigate('addStudent')}
              className="px-3.5 py-2 rounded-xl bg-blue-600/60 hover:bg-blue-600 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 border border-blue-400/30"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Student</span>
            </button>
            <button
              onClick={() => onNavigate('hallMap')}
              className="px-3.5 py-2 rounded-xl bg-blue-600/60 hover:bg-blue-600 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 border border-blue-400/30"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Map Halls</span>
            </button>
            <button
              onClick={() => onNavigate('sitting')}
              className="px-3.5 py-2 rounded-xl bg-blue-600/60 hover:bg-blue-600 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 border border-blue-400/30"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Plan Seating</span>
            </button>
            <button
              onClick={() => onNavigate('reports')}
              className="px-3.5 py-2 rounded-xl bg-blue-600/60 hover:bg-blue-600 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 border border-blue-400/30"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Print Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Class Wise Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Class-wise Student Enrollment</h3>
            <p className="text-xs text-slate-500">
              Distribution of students across Nursery to Class X sections
            </p>
          </div>
          <button
            onClick={() => onNavigate('students')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {settings.classes.map(cls => {
            const count = classCounts[cls] || 0;
            return (
              <div
                key={cls}
                onClick={() => onNavigate('students')}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-200 transition-colors cursor-pointer text-center group"
              >
                <div className="text-xs font-bold text-slate-700 group-hover:text-blue-700">
                  {cls}
                </div>
                <div className="mt-1 text-lg font-black text-slate-900 group-hover:text-blue-600">
                  {count}
                </div>
                <div className="text-[10px] text-slate-400">students</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activities & Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent logs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Audit Activity Stream</h3>
            <button
              onClick={() => onNavigate('activityLog')}
              className="text-xs text-blue-600 hover:underline cursor-pointer"
            >
              Full Log
            </button>
          </div>
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {activityLogs.slice(0, 6).map(log => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-start gap-2.5"
              >
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px]">{log.action}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5 text-[11px] leading-tight truncate">
                    {log.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Examination Halls Overview */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">Configured Examination Halls</h3>
            <button
              onClick={() => onNavigate('halls')}
              className="text-xs text-blue-600 hover:underline cursor-pointer"
            >
              Manage Halls
            </button>
          </div>
          <div className="space-y-2.5">
            {halls.map(hall => (
              <div
                key={hall.hallId}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{hall.hallName}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Hall ID: <span className="font-mono text-slate-700">{hall.hallId}</span> • Grid: {hall.rows}×{hall.columns}
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                    {hall.capacity} seats
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {hall.active ? 'Active' : 'Disabled'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
