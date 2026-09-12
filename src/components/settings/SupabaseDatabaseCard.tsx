import React, { useState } from 'react';
import {
  Database,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  UploadCloud,
  DownloadCloud,
  Copy,
  Check,
  Table,
  Code,
  Layers,
  Eye,
  EyeOff,
  Settings2,
  RotateCcw
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { SUPABASE_SQL_SCHEMA } from '../../services/supabaseSchema';
import {
  getCurrentSupabaseConfig,
  DEFAULT_SUPABASE_CONFIG,
  normalizeSupabaseConfig,
  normalizeSupabaseUrl,
  clearStoredSupabaseConfig,
  SupabaseConfig
} from '../../services/supabaseClient';

export const SupabaseDatabaseCard: React.FC = () => {
  const {
    students,
    halls,
    hallClassMaps,
    sittingPlans,
    attendanceRecords,
    timeTableEntries,
    supabaseConnected,
    isSyncing,
    syncStatusMessage,
    syncError,
    lastSyncedAt,
    pushToSupabase,
    syncFromSupabase,
    testConnection,
    updateSupabaseConfig
  } = useSchool();

  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Form for custom credentials
  const [configForm, setConfigForm] = useState<SupabaseConfig>(getCurrentSupabaseConfig());

  // Modal states for safety
  const [showPushModal, setShowPushModal] = useState(false);
  const [showPullModal, setShowPullModal] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleProjectIdChange = (val: string) => {
    const cleanId = val.trim();
    // Auto-update URL if URL is either empty or follows standard supabase pattern
    const isStandardUrl = !configForm.url || configForm.url.includes('.supabase.co');
    setConfigForm(prev => ({
      ...prev,
      projectId: cleanId,
      url: isStandardUrl && cleanId ? `https://${cleanId}.supabase.co` : prev.url
    }));
  };

  const handleUrlBlur = () => {
    if (configForm.url) {
      setConfigForm(prev => ({
        ...prev,
        url: normalizeSupabaseUrl(prev.url, prev.projectId)
      }));
    }
  };

  const handleResetToDefaults = async () => {
    clearStoredSupabaseConfig();
    setConfigForm(DEFAULT_SUPABASE_CONFIG);
    await updateSupabaseConfig(DEFAULT_SUPABASE_CONFIG);
    setShowConfigForm(false);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const safe = normalizeSupabaseConfig(configForm);
    setConfigForm(safe);
    await updateSupabaseConfig(safe);
    setShowConfigForm(false);
  };

  const currentConfig = getCurrentSupabaseConfig();
  const dashboardUrl = `https://supabase.com/dashboard/project/${currentConfig.projectId}`;
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${currentConfig.projectId}/sql/new`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Supabase Cloud Database</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                  supabaseConnected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    supabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {supabaseConnected ? 'Connected' : 'Connecting / Checking'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Production PostgreSQL database powered by Supabase. All records persist to your cloud instance.
            </p>
          </div>
        </div>

        {/* Action button to test / edit */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => testConnection()}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Test connection to Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>
          <button
            type="button"
            onClick={() => setShowConfigForm(!showConfigForm)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Credentials</span>
          </button>
        </div>
      </div>

      {/* Sync Status / Error Banner */}
      {(syncStatusMessage || syncError) && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between gap-3 ${
            syncError
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncError ? (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{syncError || syncStatusMessage}</span>
          </div>
          {isSyncing && <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />}
        </div>
      )}

      {/* Credentials Form (Collapsed by default) */}
      {showConfigForm && (
        <form onSubmit={handleSaveConfig} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Supabase Connection Credentials
            </h4>
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Default Project</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Project ID</label>
              <input
                type="text"
                value={configForm.projectId}
                onChange={(e) => handleProjectIdChange(e.target.value)}
                placeholder="e.g. pkshcgdjjgijjkhijghf"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-mono bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Project URL</label>
              <input
                type="text"
                value={configForm.url}
                onChange={(e) => setConfigForm({ ...configForm, url: e.target.value })}
                onBlur={handleUrlBlur}
                placeholder="https://your-project.supabase.co"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-mono bg-white"
                required
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Must begin with https://</p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                API Anon / Publishable Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={configForm.anonKey}
                  onChange={(e) => setConfigForm({ ...configForm, anonKey: e.target.value.trim() })}
                  className="w-full px-2.5 py-1.5 pr-10 text-xs rounded-lg border border-slate-300 font-mono bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowConfigForm(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
            >
              Save Credentials
            </button>
          </div>
        </form>
      )}

      {/* Supabase Instance Info Panel */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Project:</span>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {currentConfig.projectId}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-mono text-slate-600">{currentConfig.url}</span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>Publishable Key:</span>
              <code className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                {currentConfig.anonKey.substring(0, 16)}...
              </code>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <span>Supabase Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={sqlEditorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Code className="w-3.5 h-3.5 text-emerald-600" />
              <span>SQL Editor</span>
              <ExternalLink className="w-3 h-3 text-emerald-600" />
            </a>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-2 flex items-center justify-between">
          <span>
            Last Synced:{' '}
            {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Not yet synced this session'}
          </span>
          <span className="text-emerald-700 font-medium">Auto-ready for Netlify deployment</span>
        </div>
      </div>

      {/* Database Synchronization Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setShowPushModal(true)}
          disabled={isSyncing}
          className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-950 flex items-start gap-3 text-left transition-colors cursor-pointer group"
        >
          <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0 group-hover:scale-105 transition-transform shadow-xs">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-950">Push to Supabase (Save All Data)</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">
              Writes all {students.length} students, {halls.length} halls, seating plans, timetable, and settings to Supabase.
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setShowPullModal(true)}
          disabled={isSyncing}
          className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-950 flex items-start gap-3 text-left transition-colors cursor-pointer group"
        >
          <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0 group-hover:scale-105 transition-transform shadow-xs">
            <DownloadCloud className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-blue-950">Pull from Supabase (Sync In)</div>
            <div className="text-[11px] text-blue-700 mt-0.5">
              Refreshes the application with the latest records stored in your Supabase project.
            </div>
          </div>
        </button>
      </div>

      {/* SQL Schema & Table Structure Helper */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Table className="w-4 h-4 text-emerald-600" />
            <span>Database Tables in Supabase</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySql}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied SQL!' : 'Copy SQL Schema'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSqlModal(!showSqlModal)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              {showSqlModal ? 'Hide Schema' : 'View Schema'}
            </button>
          </div>
        </div>

        {/* 9 Tables Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { name: 'students', desc: 'Roll no, class, bio-data' },
            { name: 'halls', desc: 'Exam hall capacities & grid' },
            { name: 'hall_class_maps', desc: 'Hall-to-class links' },
            { name: 'sitting_plans', desc: 'Seat allocations matrix' },
            { name: 'attendance_records', desc: 'Exam attendance' },
            { name: 'timetable_entries', desc: 'Schedule & dates' },
            { name: 'system_settings', desc: 'Institutional config' },
            { name: 'activity_logs', desc: 'Administrative audit' },
            { name: 'school_app_state', desc: 'Realtime cloud store' }
          ].map((t) => (
            <div
              key={t.name}
              className="px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
            >
              <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">{t.name}</span>
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">{t.desc}</div>
            </div>
          ))}
        </div>

        {/* Expandable SQL Code preview */}
        {showSqlModal && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>PostgreSQL DDL with Row Level Security (RLS) enabled</span>
              <button
                type="button"
                onClick={handleCopySql}
                className="text-emerald-700 hover:text-emerald-900 font-bold"
              >
                {copiedSql ? 'Copied to Clipboard!' : 'Copy Entire SQL'}
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-56 leading-relaxed border border-slate-800">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        )}
      </div>

      {/* Netlify Deployment Notice */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs space-y-2 border border-slate-800">
        <div className="flex items-center gap-2 font-bold text-white">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Netlify Deployment Configuration</span>
        </div>
        <p className="text-slate-300 leading-relaxed text-[11px]">
          The application is fully integrated with Supabase. When deployed to Netlify, provide these build environment variables in your Netlify site dashboard:
        </p>
        <div className="font-mono text-[11px] bg-slate-950 p-2.5 rounded-lg text-emerald-300 border border-slate-800 space-y-1">
          <div>VITE_SUPABASE_URL = {currentConfig.url}</div>
          <div>VITE_SUPABASE_ANON_KEY = {currentConfig.anonKey}</div>
        </div>
      </div>

      {/* Safety Confirmation Modals */}
      <ConfirmationModal
        isOpen={showPushModal}
        title="Push All School Records to Supabase?"
        message="This action will write all current student records, examination halls, sitting plans, timetable, attendance, and settings into your Supabase project."
        details={[
          `${students.length} Student records`,
          `${halls.length} Examination Halls`,
          `${hallClassMaps.length} Hall-Class assignments`,
          `${timeTableEntries.length} Timetable entries`,
          `${attendanceRecords.length} Attendance records`
        ]}
        confirmText="Yes, Push to Supabase"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isSyncing}
        onConfirm={async () => {
          await pushToSupabase();
          setShowPushModal(false);
        }}
        onCancel={() => setShowPushModal(false)}
      />

      <ConfirmationModal
        isOpen={showPullModal}
        title="Pull Records from Supabase?"
        message="This will fetch all latest records from your Supabase cloud database and update the app's current dataset."
        details={[
          'Students, halls, and seating arrangements will be updated from Supabase',
          'Ensure any local changes have been pushed before pulling to avoid overwriting'
        ]}
        confirmText="Yes, Pull from Supabase"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isSyncing}
        onConfirm={async () => {
          await syncFromSupabase();
          setShowPullModal(false);
        }}
        onCancel={() => setShowPullModal(false)}
      />
    </div>
  );
};
