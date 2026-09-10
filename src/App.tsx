/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { ActiveSection } from './types';

// Views
import { LoginView } from './components/auth/LoginView';
import { Sidebar } from './components/common/Sidebar';
import { TopNavbar } from './components/common/TopNavbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { StudentsView } from './components/students/StudentsView';
import { AddStudentView } from './components/students/AddStudentView';
import { SearchStudentView } from './components/search/SearchStudentView';
import { PromotionView } from './components/promotion/PromotionView';
import { HallManagementView } from './components/halls/HallManagementView';
import { HallClassMapView } from './components/halls/HallClassMapView';
import { SittingArrangementView } from './components/sitting/SittingArrangementView';
import { ExamAttendanceView } from './components/attendance/ExamAttendanceView';
import { ReportsView } from './components/reports/ReportsView';
import { ActivityLogView } from './components/activity/ActivityLogView';
import { SettingsView } from './components/settings/SettingsView';

const MainApp: React.FC = () => {
  const { currentUser, logout, students, settings, activityLogs } = useSchool();
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!currentUser) {
    return <LoginView />;
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardView onNavigate={(section) => setActiveSection(section)} />;
      case 'students':
        return <StudentsView onNavigate={(section) => setActiveSection(section)} />;
      case 'addStudent':
        return <AddStudentView />;
      case 'search':
        return <SearchStudentView />;
      case 'promotion':
        return <PromotionView />;
      case 'halls':
        return <HallManagementView />;
      case 'hallMap':
        return <HallClassMapView />;
      case 'sitting':
        return <SittingArrangementView />;
      case 'attendance':
        return <ExamAttendanceView />;
      case 'reports':
        return <ReportsView />;
      case 'activityLog':
        return <ActivityLogView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={(section) => setActiveSection(section)} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={(section) => {
          setActiveSection(section);
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={logout}
        studentCount={students.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <TopNavbar
          activeSection={activeSection}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          adminUser={currentUser}
          defaultExam={settings.defaultExam}
          defaultSession={settings.defaultSession}
          recentActivityCount={activityLogs.length}
          onViewActivity={() => setActiveSection('activityLog')}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderActiveSection()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <SchoolProvider>
      <MainApp />
    </SchoolProvider>
  );
}
