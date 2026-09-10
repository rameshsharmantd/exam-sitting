import React from 'react';
import { Menu, ShieldCheck, Calendar, Bell } from 'lucide-react';
import { ActiveSection } from '../../types';

interface TopNavbarProps {
  activeSection: ActiveSection;
  onOpenSidebar: () => void;
  adminUser: string;
  defaultExam: string;
  defaultSession: string;
  recentActivityCount?: number;
  onViewActivity?: () => void;
}

const SECTION_TITLES: Record<ActiveSection, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'School Dashboard',
    subtitle: 'Real-time student registry, class enrollments & examination overview'
  },
  students: {
    title: 'Students Directory',
    subtitle: 'Comprehensive student records, roll numbers, details and actions'
  },
  addStudent: {
    title: 'Add New Student',
    subtitle: 'Register new student with automated roll number and duplicate validation'
  },
  search: {
    title: 'Global Student Search',
    subtitle: 'Instant multi-field search across all classes, admission numbers and contacts'
  },
  promotion: {
    title: 'Student & Class Promotion',
    subtitle: 'Bulk class promotion engine with roll number resequencing and duplicate check'
  },
  halls: {
    title: 'Hall Management',
    subtitle: 'Configure examination halls, desk matrix (rows × columns) and door/window markers'
  },
  hallMap: {
    title: 'Hall Class Assignment',
    subtitle: 'Map examination halls to multiple classes with live capacity checking'
  },
  sitting: {
    title: 'Exam Sitting Arrangement',
    subtitle: 'Round-robin & class-wise desk allocation with drag-and-drop seat swapping'
  },
  attendance: {
    title: 'Exam Attendance Register',
    subtitle: 'Generate printable exam attendance sheets with seat numbers and signature fields'
  },
  reports: {
    title: 'Official Reports & Print / PDF',
    subtitle: 'Print-ready student records, hall allocations, seating plans and class summaries'
  },
  activityLog: {
    title: 'Audit & Activity Log',
    subtitle: 'Comprehensive audit trail of all student, hall, and sitting arrangement updates'
  },
  settings: {
    title: 'System Settings',
    subtitle: 'Configure school default session, examination labels, and admin credentials'
  }
};

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeSection,
  onOpenSidebar,
  adminUser,
  defaultExam,
  defaultSession,
  recentActivityCount = 0,
  onViewActivity
}) => {
  const meta = SECTION_TITLES[activeSection] || {
    title: 'School Management',
    subtitle: 'Manthan Valley St. Albert’s Sr. Sec. School'
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile trigger & Page titles */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 cursor-pointer shadow-2xs transition-colors"
            title="Toggle Navigation Menu"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {meta.title}
            </h2>
            <p className="text-xs text-slate-500 hidden sm:block truncate">
              {meta.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Badges & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Exam / Session pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>{defaultExam}</span>
            <span className="text-blue-300">•</span>
            <span>{defaultSession}</span>
          </div>

          {/* Activity shortcut */}
          {onViewActivity && (
            <button
              onClick={onViewActivity}
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              title="Recent Activities"
            >
              <Bell className="w-4 h-4" />
              {recentActivityCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600"></span>
              )}
            </button>
          )}

          {/* Admin badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {adminUser.substring(0, 1).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-none">
                {adminUser}
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-0.5 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />
                <span>Authorized Admin</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
