import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Search,
  ArrowRightLeft,
  Building2,
  Columns3,
  Grid3X3,
  FileCheck,
  Printer,
  History,
  Settings,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { ActiveSection } from '../../types';
import { CONFIG } from '../../data/constants';

interface SidebarProps {
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  studentCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  isOpen,
  onClose,
  onLogout,
  studentCount
}) => {
  const navItems: { id: ActiveSection; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'students', label: 'Students Directory', icon: <Users className="w-4 h-4" />, badge: studentCount },
    { id: 'addStudent', label: 'Add Student', icon: <UserPlus className="w-4 h-4" /> },
    { id: 'search', label: 'Global Search', icon: <Search className="w-4 h-4" /> },
    { id: 'promotion', label: 'Promotion', icon: <ArrowRightLeft className="w-4 h-4" /> },
    { id: 'halls', label: 'Hall Management', icon: <Building2 className="w-4 h-4" /> },
    { id: 'hallMap', label: 'Hall Class Map', icon: <Columns3 className="w-4 h-4" /> },
    { id: 'sitting', label: 'Sitting Arrangement', icon: <Grid3X3 className="w-4 h-4" /> },
    { id: 'attendance', label: 'Exam Attendance', icon: <FileCheck className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports / PDF', icon: <Printer className="w-4 h-4" /> },
    { id: 'activityLog', label: 'Audit Activity Log', icon: <History className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <>
      {/* Drawer overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-200 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm text-white leading-tight truncate">
                Manthan Valley
              </h1>
              <p className="text-[11px] text-blue-400 font-medium">St. Albert’s Sr. Sec. School</p>
              <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                Exam System v2.6
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
            title="Close Menu"
          >
            ✕
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map(item => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 truncate">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded-full font-semibold ${
                      isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer with logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="px-3 py-2 mb-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="text-[11px] text-slate-400">Current Session</div>
            <div className="text-xs font-semibold text-slate-200">
              {CONFIG.DEFAULT_EXAM} • {CONFIG.DEFAULT_SESSION}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>
    </>
  );
};
