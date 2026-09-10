import React, { useState, useEffect } from 'react';
import {
  Grid3X3,
  Lock,
  Unlock,
  RefreshCw,
  Printer,
  Sparkles,
  ArrowRightLeft,
  XCircle,
  AlertCircle,
  CheckCircle2,
  DoorOpen,
  Eye,
  Layers,
  ArrowRight,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserCheck,
  AlertTriangle,
  Minus,
  Plus,
  Settings2,
  Sliders,
  Type
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { HeaderPrint } from '../common/HeaderPrint';

export const SittingArrangementView: React.FC = () => {
  const {
    settings,
    halls,
    saveHall,
    getSittingPlan,
    generateSitting,
    clearSittingPlan,
    swapSeats,
    emptySeat,
    lockSitting,
    unlockSitting,
    getHallClasses,
    getRemainingStudentsForClass,
    getClassSeatingStatus
  } = useSchool();

  const [exam, setExam] = useState(settings.defaultExam);
  const [session, setSession] = useState(settings.defaultSession);
  const [selectedHallId, setSelectedHallId] = useState<string>('');
  const [algorithm, setAlgorithm] = useState<'ROUND_ROBIN' | 'CLASS_WISE'>('ROUND_ROBIN');
  const [fillDirection, setFillDirection] = useState<'COLUMNS_FIRST' | 'ROWS_FIRST'>('COLUMNS_FIRST');

  // Dynamic Row & Column state requested by user
  const [customRows, setCustomRows] = useState<number>(5);
  const [customCols, setCustomCols] = useState<number>(8);
  const [fontSizeScale, setFontSizeScale] = useState<'large' | 'extra-large' | 'jumbo'>('extra-large');

  // Interactive seat swap selection
  const [selectedSeatForSwap, setSelectedSeatForSwap] = useState<string | null>(null);
  const [draggedSeatNo, setDraggedSeatNo] = useState<string | null>(null);

  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showOverflowList, setShowOverflowList] = useState(false);

  // Default hall selection
  useEffect(() => {
    if (halls.length > 0 && !selectedHallId) {
      setSelectedHallId(halls[0].hallId);
    }
  }, [halls, selectedHallId]);

  const currentHall = halls.find(h => h.hallId === selectedHallId);
  const currentPlan = selectedHallId ? getSittingPlan(exam, session, selectedHallId) : undefined;
  const currentHallIndex = halls.findIndex(h => h.hallId === selectedHallId);
  const nextHall = currentHallIndex >= 0 && currentHallIndex + 1 < halls.length ? halls[currentHallIndex + 1] : null;
  const prevHall = currentHallIndex > 0 ? halls[currentHallIndex - 1] : null;

  // Synchronize dynamic rows & columns when hall changes
  useEffect(() => {
    if (currentHall) {
      setCustomRows(currentHall.rows);
      setCustomCols(currentHall.columns);
    }
  }, [currentHall?.hallId, currentHall?.rows, currentHall?.columns]);

  // Assigned classes in current hall
  const currentAssignedClasses = selectedHallId ? getHallClasses(exam, session, selectedHallId) : [];

  // Remaining students in assigned classes for this hall
  const remainingStudentsInAssigned = currentAssignedClasses.flatMap(a =>
    getRemainingStudentsForClass(exam, session, a.className, selectedHallId)
  );

  const handleApplyDimensions = (newR?: number, newC?: number) => {
    if (!currentHall) return;
    const r = Math.max(1, Math.min(25, Number(newR ?? customRows) || 1));
    const c = Math.max(1, Math.min(25, Number(newC ?? customCols) || 1));
    setCustomRows(r);
    setCustomCols(c);

    saveHall({
      hallId: currentHall.hallId,
      hallName: currentHall.hallName,
      rows: r,
      columns: c,
      doorPosition: currentHall.doorPosition,
      windowPosition: currentHall.windowPosition,
      active: currentHall.active
    });

    const res = generateSitting(exam, session, selectedHallId, algorithm, fillDirection);
    if (res.success) {
      setMessage({
        type: 'success',
        text: `Dimensions set to ${r} Rows × ${c} Columns (${r * c} seats). Seating regenerated successfully!`
      });
    } else {
      setMessage({
        type: 'info',
        text: `Hall dimension updated to ${r} Rows × ${c} Columns (${r * c} seats).`
      });
    }
  };

  const handleGenerate = () => {
    setMessage(null);
    setSelectedSeatForSwap(null);

    if (!selectedHallId) {
      setMessage({ type: 'error', text: 'Please select an examination hall.' });
      return;
    }

    const res = generateSitting(exam, session, selectedHallId, algorithm, fillDirection);
    if (res.success) {
      setMessage({
        type: res.overflowCount && res.overflowCount > 0 ? 'info' : 'success',
        text: res.message || `Successfully arranged seats for ${res.students} students in ${currentHall?.hallName}.`
      });
    } else {
      setMessage({
        type: 'error',
        text: res.message || 'Failed to generate sitting arrangement.'
      });
    }
  };

  const handleClearPlan = () => {
    if (!selectedHallId || !currentPlan) return;
    if (window.confirm(`Are you sure you want to clear the seating plan for ${currentHall?.hallName}? Class assignments will remain intact.`)) {
      clearSittingPlan(exam, session, selectedHallId);
      setSelectedSeatForSwap(null);
      setMessage({ type: 'info', text: `Seating plan for ${currentHall?.hallName} has been cleared.` });
    }
  };

  const handleSeatClick = (seatNo: string, hasStudent: boolean) => {
    if (!currentPlan) return;
    if (currentPlan.locked) {
      setMessage({
        type: 'error',
        text: 'Sitting arrangement is locked. Click "Unlock Sitting" to enable swapping or editing.'
      });
      return;
    }

    if (!selectedSeatForSwap) {
      // First seat selected
      if (!hasStudent) {
        setMessage({ type: 'error', text: 'Select an occupied desk first, then click another desk to swap.' });
        return;
      }
      setSelectedSeatForSwap(seatNo);
      setMessage({
        type: 'success',
        text: `Desk ${seatNo} selected. Now click another desk to swap students!`
      });
    } else {
      // Second seat selected - perform swap!
      if (selectedSeatForSwap === seatNo) {
        setSelectedSeatForSwap(null);
        setMessage(null);
        return;
      }

      const res = swapSeats(exam, session, selectedHallId, selectedSeatForSwap, seatNo);
      if (res.success) {
        setMessage({
          type: 'success',
          text: `Swapped desks ${selectedSeatForSwap} ↔ ${seatNo} successfully!`
        });
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to swap seats.' });
      }
      setSelectedSeatForSwap(null);
    }
  };

  const handleEmptySeat = (seatNo: string) => {
    if (!currentPlan) return;
    if (currentPlan.locked) {
      setMessage({ type: 'error', text: 'Sitting plan is locked.' });
      return;
    }
    emptySeat(exam, session, selectedHallId, seatNo);
    if (selectedSeatForSwap === seatNo) setSelectedSeatForSwap(null);
    setMessage({ type: 'success', text: `Desk ${seatNo} marked as empty.` });
  };

  // Drag and Drop handlers
  const handleDragStart = (seatNo: string) => {
    if (currentPlan?.locked) return;
    setDraggedSeatNo(seatNo);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetSeatNo: string) => {
    if (!draggedSeatNo || draggedSeatNo === targetSeatNo || currentPlan?.locked) {
      setDraggedSeatNo(null);
      return;
    }

    swapSeats(exam, session, selectedHallId, draggedSeatNo, targetSeatNo);
    setMessage({
      type: 'success',
      text: `Swapped desks ${draggedSeatNo} ↔ ${targetSeatNo} via drag-and-drop!`
    });
    setDraggedSeatNo(null);
  };

  // Group seats by row for grid rendering
  const seatsByRow: Record<number, typeof currentPlan.seats> = {};
  if (currentPlan && currentHall) {
    for (let r = 1; r <= currentHall.rows; r++) {
      seatsByRow[r] = currentPlan.seats.filter(s => s.row === r).sort((a, b) => a.column - b.column);
    }
  }

  const occupiedSeatsCount = currentPlan ? currentPlan.seats.filter(s => s.studentName.trim() !== '').length : 0;
  const hasOverflow = currentPlan && typeof currentPlan.overflowCount === 'number' && currentPlan.overflowCount > 0;

  return (
    <div className="space-y-6">
      {/* Multi-Hall Pipeline Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Examination Hall Pipeline (Multi-Hall Sequence)</span>
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select halls sequentially. Students who exceed one hall will automatically roll over to subsequent halls.
            </p>
          </div>
          <div className="text-[11px] font-semibold text-slate-500">
            Hall {currentHallIndex + 1} of {halls.length}
          </div>
        </div>

        {/* Hall Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {halls.map((h, idx) => {
            const plan = getSittingPlan(exam, session, h.hallId);
            const isSelected = h.hallId === selectedHallId;
            const seated = plan ? plan.seats.filter(s => s.studentName.trim() !== '').length : 0;
            const overflow = plan?.overflowCount || 0;
            const isFilled = seated >= h.capacity;

            return (
              <button
                key={h.hallId}
                onClick={() => {
                  setSelectedHallId(h.hallId);
                  setMessage(null);
                  setSelectedSeatForSwap(null);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                    : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold font-mono">
                    #{idx + 1} {h.hallId}
                  </span>
                  {plan ? (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        isSelected
                          ? 'bg-blue-800 text-blue-100'
                          : isFilled
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {isFilled ? 'FILLED' : 'PARTIAL'}
                    </span>
                  ) : (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                        isSelected ? 'bg-blue-800 text-blue-200' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      PENDING
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  <div className="text-xs font-bold truncate">
                    {h.hallName}
                  </div>
                  <div className="flex items-center justify-between text-[10px] mt-1 opacity-90">
                    <span>
                      {plan ? `${seated} / ${h.capacity} seats` : `${h.capacity} capacity`}
                    </span>
                    {overflow > 0 && (
                      <span className={isSelected ? 'text-amber-200 font-bold' : 'text-amber-600 font-bold'}>
                        +{overflow} rollover
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Overflow Alert Banner if current hall generated overflow */}
      {hasOverflow && currentPlan && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-300 rounded-2xl p-4.5 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                  <span>Capacity Filled: {currentPlan.overflowCount} Students Queued for Next Hall</span>
                </h4>
                <p className="text-xs text-amber-900/90 mt-0.5 leading-relaxed">
                  All <strong>{currentHall?.capacity} desks</strong> in <strong>{currentHall?.hallName}</strong> are fully occupied from R1C1. The remaining <strong>{currentPlan.overflowCount} students</strong> will automatically be allocated to the next hall when you select these classes there.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowOverflowList(!showOverflowList)}
                className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100 flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <span>{showOverflowList ? 'Hide' : 'View'} Overflow List ({currentPlan.overflowCount})</span>
                {showOverflowList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {nextHall && (
                <button
                  onClick={() => {
                    setSelectedHallId(nextHall.hallId);
                    setMessage({
                      type: 'info',
                      text: `Switched to ${nextHall.hallName}. Assign the remaining classes and click 'Generate Sitting' to seat the rollover students starting from R1C1!`
                    });
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Proceed to {nextHall.hallName}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Expandable Rollover Student List */}
          {showOverflowList && (
            <div className="bg-white rounded-xl border border-amber-200 p-3 mt-2 overflow-hidden animate-in fade-in duration-150">
              <div className="text-[11px] font-bold text-slate-700 uppercase mb-2">
                Students Queued for Next Hall ({remainingStudentsInAssigned.length} students):
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                {remainingStudentsInAssigned.map((s, i) => (
                  <div key={s.recordKey} className="py-1.5 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 w-6 text-right">#{i + 1}</span>
                      <span className="font-bold text-slate-800">{s.name}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        Class {s.className}
                      </span>
                    </div>
                    <div className="font-mono text-slate-500">
                      Roll: <strong className="text-slate-800">{s.rollNo}</strong> | {s.studentId}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Configuration & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Sitting Plan: {currentHall?.hallName} ({currentHall?.hallId})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate seat allocations with automatic overflow from previous halls
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {currentPlan && (
              currentPlan.locked ? (
                <button
                  onClick={() => {
                    unlockSitting(exam, session, selectedHallId);
                    setMessage({ type: 'success', text: 'Sitting arrangement unlocked for modifications.' });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold hover:bg-amber-100 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Unlock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Unlock Sitting</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    lockSitting(exam, session, selectedHallId);
                    setSelectedSeatForSwap(null);
                    setMessage({ type: 'success', text: 'Sitting arrangement locked against accidental changes.' });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-300" />
                  <span>Lock Sitting</span>
                </button>
              )
            )}

            {currentPlan && !currentPlan.locked && (
              <button
                onClick={handleClearPlan}
                className="px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Clear this hall plan"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Plan</span>
              </button>
            )}

            {currentPlan && (
              <button
                onClick={() => setShowPrintModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Notice Board Sheet</span>
              </button>
            )}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Exam
            </label>
            <input
              type="text"
              value={exam}
              onChange={e => setExam(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Session
            </label>
            <input
              type="text"
              value={session}
              onChange={e => setSession(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Examination Hall
            </label>
            <select
              value={selectedHallId}
              onChange={e => setSelectedHallId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:outline-none focus:border-blue-600"
            >
              {halls.map(h => (
                <option key={h.hallId} value={h.hallId}>
                  {h.hallId} - {h.hallName} ({h.capacity} seats)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Algorithm Strategy
            </label>
            <select
              value={algorithm}
              onChange={e => setAlgorithm(e.target.value as 'ROUND_ROBIN' | 'CLASS_WISE')}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:border-blue-600"
            >
              <option value="ROUND_ROBIN">Round Robin (Interleave Sections)</option>
              <option value="CLASS_WISE">Class Wise (Sequential)</option>
            </select>
          </div>
        </div>

        {/* Assigned Classes Status in this hall */}
        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700">Assigned Classes to {currentHall?.hallId}:</span>
            {currentAssignedClasses.length > 0 ? (
              currentAssignedClasses.map(a => {
                const unseated = getRemainingStudentsForClass(exam, session, a.className, selectedHallId).length;
                return (
                  <span
                    key={a.className}
                    className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 border border-blue-200 font-bold text-[11px] flex items-center gap-1"
                  >
                    <span>{a.className}</span>
                    <span className="text-[10px] opacity-75">({unseated} to seat)</span>
                  </span>
                );
              })
            ) : (
              <span className="text-slate-400 italic">
                No classes assigned yet. Please assign in Hall Class Assignment first.
              </span>
            )}
          </div>

          <div className="text-slate-500 font-semibold text-[11px]">
            Eligible to Seat:{' '}
            <strong className="text-slate-900">{remainingStudentsInAssigned.length} students</strong>
          </div>
        </div>

        {/* Generate / Action row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            {selectedSeatForSwap ? (
              <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 font-bold animate-pulse">
                Desk {selectedSeatForSwap} chosen for swap. Click another desk now!
              </span>
            ) : (
              <span>
                Tip: Click any desk to select it, then click another desk to swap students immediately.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedSeatForSwap && (
              <button
                onClick={() => setSelectedSeatForSwap(null)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel Swap Selection
              </button>
            )}

            <button
              onClick={handleGenerate}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate / Re-run Sitting for {currentHall?.hallId}</span>
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : message.type === 'info'
                ? 'bg-blue-50 border border-blue-200 text-blue-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : message.type === 'info' ? (
              <Layers className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      {/* Grid Canvas Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        {/* Status header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-slate-900">
              {currentHall ? `${currentHall.hallId} - ${currentHall.hallName}` : 'Hall Grid'}
            </span>
            {currentPlan && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  currentPlan.locked
                    ? 'bg-slate-900 text-white'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {currentPlan.locked ? 'LOCKED' : 'EDITABLE'}
              </span>
            )}
          </div>

          {currentHall && (
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>
                Seated: <strong className="text-slate-800">{occupiedSeatsCount}</strong> / {currentHall.capacity} desks
              </span>
              <span>•</span>
              <span>
                Grid: <strong className="text-slate-800">{currentHall.rows} rows × {currentHall.columns} cols</strong>
              </span>
            </div>
          )}
        </div>

        {/* Custom Rows & Columns Controls */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Custom Rows & Columns (पंक्ति और कॉलम सेट करें)</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Change rows & columns to customize this hall layout
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Rows Stepper */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Rows (पंक्ति):</label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleApplyDimensions(customRows - 1, customCols)}
                  disabled={customRows <= 1}
                  className="w-8 h-8 rounded-l-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer disabled:opacity-40"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={customRows}
                  onChange={e => setCustomRows(Number(e.target.value))}
                  className="w-14 h-8 text-center text-xs font-bold border-y border-slate-300 bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleApplyDimensions(customRows + 1, customCols)}
                  disabled={customRows >= 25}
                  className="w-8 h-8 rounded-r-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Columns Stepper */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">Columns (कॉलम):</label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleApplyDimensions(customRows, customCols - 1)}
                  disabled={customCols <= 1}
                  className="w-8 h-8 rounded-l-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer disabled:opacity-40"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={customCols}
                  onChange={e => setCustomCols(Number(e.target.value))}
                  className="w-14 h-8 text-center text-xs font-bold border-y border-slate-300 bg-white"
                />
                <button
                  type="button"
                  onClick={() => handleApplyDimensions(customRows, customCols + 1)}
                  disabled={customCols >= 25}
                  className="w-8 h-8 rounded-r-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Apply Button */}
            <button
              type="button"
              onClick={() => handleApplyDimensions()}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Apply {customRows}R × {customCols}C ({customRows * customCols} Seats)</span>
            </button>
          </div>

          {/* Quick presets */}
          <div className="pt-2 border-t border-slate-200/70 flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Quick Presets:</span>
            {[
              { label: '5 × 8', r: 5, c: 8 },
              { label: '6 × 7', r: 6, c: 7 },
              { label: '7 × 8', r: 7, c: 8 },
              { label: '6 × 8', r: 6, c: 8 },
              { label: '4 × 8', r: 4, c: 8 },
              { label: '5 × 6', r: 5, c: 6 },
              { label: '6 × 6', r: 6, c: 6 },
              { label: '7 × 6', r: 7, c: 6 }
            ].map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApplyDimensions(p.r, p.c)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer border ${
                  customRows === p.r && customCols === p.c
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-slate-700 text-[11px] uppercase">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-100 border border-blue-400" />
              <span className="text-[11px]">Occupied Desk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-white border border-slate-300" />
              <span className="text-[11px]">Empty Desk</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 border border-red-200">DOOR</span>
              <span className="text-[11px]">Hall Entrance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-100 text-sky-700 border border-sky-200">WINDOW</span>
              <span className="text-[11px]">Window Edge</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 italic">
            Click any seat to select and click another seat to swap, or drag and drop.
          </div>
        </div>

        {/* The Matrix */}
        {!currentPlan ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No sitting plan generated yet for this examination hall. Click <strong>"Generate / Re-run Sitting for {currentHall?.hallId}"</strong> above to seat the students from R1C1.
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="inline-block min-w-max space-y-3 p-1">
              {/* Column Headers Row (Column-wise View) */}
              {currentHall && (
                <div className="flex items-center gap-3 pb-1 border-b border-slate-200">
                  <div className="w-14 text-right shrink-0 text-xs font-bold text-slate-400 font-mono">
                    {/* Spacer for Row labels */}
                  </div>

                  <div className="flex items-center gap-2.5">
                    {Array.from({ length: currentHall.columns }, (_, cIdx) => {
                      const colNum = cIdx + 1;
                      const colSeats = currentPlan.seats.filter(s => s.column === colNum);
                      const colClass =
                        colSeats.find(s => s.className?.trim() !== '')?.className ||
                        currentAssignedClasses[cIdx]?.className;

                      return (
                        <div
                          key={colNum}
                          className="w-36 py-1.5 px-2 text-center rounded-xl bg-slate-100 border border-slate-200 shadow-2xs"
                        >
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            Column {colNum}
                          </div>
                          <div className="text-xs font-black text-blue-900 truncate">
                            {colClass || `Col ${colNum}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rows (Row-wise View) */}
              {currentHall &&
                Array.from({ length: currentHall.rows }, (_, rIdx) => {
                  const rowNum = rIdx + 1;
                  const rowSeats = seatsByRow[rowNum] || [];

                  return (
                    <div key={rowNum} className="flex items-center gap-3">
                      <div className="w-14 text-right shrink-0 text-xs font-bold text-slate-500 font-mono">
                        Row {rowNum}
                      </div>

                      <div className="flex items-center gap-2.5">
                        {rowSeats.map(seat => {
                          const occupied = seat.studentName.trim() !== '';
                          const isSwapSelected = selectedSeatForSwap === seat.seatNo;
                          const isDoor = seat.doorWindow.includes('DOOR');
                          const isWindow = seat.doorWindow.includes('WINDOW');

                          return (
                            <div
                              key={seat.seatNo}
                              draggable={!currentPlan.locked && occupied}
                              onDragStart={() => handleDragStart(seat.seatNo)}
                              onDragOver={handleDragOver}
                              onDrop={() => handleDrop(seat.seatNo)}
                              onClick={() => handleSeatClick(seat.seatNo, occupied)}
                              className={`w-36 h-28 rounded-xl border-2 p-2 relative transition-all cursor-pointer select-none flex flex-col justify-between ${
                                isSwapSelected
                                  ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500 shadow-md scale-102'
                                  : occupied
                                  ? 'bg-blue-50/70 border-blue-200 hover:border-blue-400 hover:shadow-sm'
                                  : 'bg-white border-dashed border-slate-300 hover:border-slate-400'
                              } ${currentPlan.locked ? 'cursor-default' : ''}`}
                            >
                              {/* Top row: Seat No & Door/Window markers */}
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] font-bold text-slate-500">
                                  {seat.seatNo}
                                </span>

                                <div className="flex items-center gap-1">
                                  {isDoor && (
                                    <span className="px-1 py-0.2 rounded text-[8px] font-extrabold bg-red-100 text-red-700 border border-red-200">
                                      DOOR
                                    </span>
                                  )}
                                  {isWindow && (
                                    <span className="px-1 py-0.2 rounded text-[8px] font-extrabold bg-sky-100 text-sky-700 border border-sky-200">
                                      WIN
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Student Info or Empty */}
                              {occupied ? (
                                <div className="min-w-0 my-1">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-blue-900 truncate">
                                      {seat.className}
                                    </span>
                                    <span className="font-mono text-slate-600 font-semibold text-[10px]">
                                      R: {seat.rollNo}
                                    </span>
                                  </div>
                                  <div className="text-xs font-bold text-slate-900 leading-tight truncate mt-0.5">
                                    {seat.studentName}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-400 truncate">
                                    {seat.studentId}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-3 text-[11px] font-semibold text-slate-400">
                                  VACANT DESK
                                </div>
                              )}

                              {/* Bottom bar actions */}
                              <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[10px]">
                                <span className="text-[9px] text-slate-400">
                                  {occupied ? 'Click to swap' : 'Empty'}
                                </span>

                                {occupied && !currentPlan.locked && (
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleEmptySeat(seat.seatNo);
                                    }}
                                    className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                                    title="Empty seat"
                                  >
                                    <XCircle className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Notice Board Printable Modal */}
      {showPrintModal && currentPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal header bar */}
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Grid3X3 className="w-4 h-4 text-blue-600" />
                  Notice Board Seating Chart (Row & Column Wise)
                </span>

                {/* Font Size Selector for Notice Board */}
                <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-300">
                  <span className="text-xs font-bold text-slate-600">Roll No Size (फॉन्ट):</span>
                  <div className="flex items-center bg-white rounded-lg border border-slate-300 p-0.5">
                    <button
                      type="button"
                      onClick={() => setFontSizeScale('large')}
                      className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer ${
                        fontSizeScale === 'large'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Large
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSizeScale('extra-large')}
                      className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer ${
                        fontSizeScale === 'extra-large'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      XL (बड़ा)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSizeScale('jumbo')}
                      className={`px-2.5 py-1 text-xs font-bold rounded cursor-pointer ${
                        fontSizeScale === 'jumbo'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Jumbo
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Notice Board Chart</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Notice Board Body */}
            <div className="p-8 overflow-y-auto print:p-0">
              <style>{`
                @media print {
                  @page { size: landscape; margin: 8mm; }
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              `}</style>

              <HeaderPrint
                title={`EXAMINATION SEATING CHART (NOTICE BOARD COPY)`}
                subtitle={`${currentHall?.hallName ? `ROOM / HALL: ${currentHall.hallName} • ` : ''}Exam: ${currentPlan.exam} | Session: ${currentPlan.session} | Total Seated: ${occupiedSeatsCount}`}
                exam={currentPlan.exam}
                session={currentPlan.session}
              />

              {/* Hall Info Bar */}
              <div className="my-3 py-2 px-4 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-between text-xs font-bold text-slate-800 uppercase">
                <span>Room / Hall: <strong className="text-blue-900 text-sm">{currentHall?.hallName} ({currentPlan.hallId})</strong></span>
                <span>Arrangement: {currentHall?.rows} Rows × {currentHall?.columns} Columns</span>
                <span>Seated: {occupiedSeatsCount} / {currentPlan.seats.length} Desks</span>
              </div>

              {/* Front of Room marker */}
              <div className="mb-3 py-1.5 text-center bg-slate-200 text-slate-800 text-xs font-black uppercase tracking-widest border border-slate-300 rounded">
                ▲ BLACKBOARD / TEACHER'S DESK / FRONT OF EXAMINATION ROOM ▲
              </div>

              {/* ROW & COLUMN WISE NOTICE BOARD TABLE (LARGE FONT CLASS & ROLL NO) */}
              <div className="overflow-x-auto my-3">
                <table className="w-full border-collapse border-2 border-black text-center">
                  <thead>
                    <tr className="bg-slate-200 border-b-2 border-black">
                      <th className="border-2 border-black p-2 text-xs font-black text-black uppercase w-20 bg-slate-300">
                        Row \ Col
                      </th>
                      {Array.from({ length: currentHall?.columns || 0 }, (_, cIdx) => {
                        const colNum = cIdx + 1;
                        const colSeats = currentPlan.seats.filter(s => s.column === colNum);
                        const colClass =
                          colSeats.find(s => s.className?.trim() !== '')?.className ||
                          currentAssignedClasses[cIdx]?.className;

                        return (
                          <th
                            key={colNum}
                            className="border-2 border-black py-2 px-3 text-center bg-slate-100"
                          >
                            <div className="text-[10px] font-bold text-slate-600 uppercase">
                              Col {colNum}
                            </div>
                            <div className="text-xs sm:text-sm font-black text-blue-900 uppercase truncate">
                              {colClass || `Column ${colNum}`}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: currentHall?.rows || 0 }, (_, rIdx) => {
                      const rowNum = rIdx + 1;
                      const rowSeats = seatsByRow[rowNum] || [];

                      return (
                        <tr key={rowNum} className="border-b-2 border-black">
                          {/* Row Header */}
                          <td className="border-2 border-black p-2 text-xs font-black text-black bg-slate-100 whitespace-nowrap">
                            Row {rowNum}
                          </td>

                          {/* Column Desks */}
                          {Array.from({ length: currentHall?.columns || 0 }, (_, cIdx) => {
                            const colNum = cIdx + 1;
                            const seat = rowSeats.find(s => s.column === colNum);
                            const occupied = seat && seat.studentName.trim() !== '';
                            const isDoor = seat && seat.doorWindow.includes('DOOR');
                            const isWindow = seat && seat.doorWindow.includes('WINDOW');

                            const rollFontSize =
                              fontSizeScale === 'jumbo'
                                ? 'text-4xl'
                                : fontSizeScale === 'extra-large'
                                ? 'text-3xl'
                                : 'text-2xl';

                            const classFontSize =
                              fontSizeScale === 'jumbo'
                                ? 'text-base'
                                : fontSizeScale === 'extra-large'
                                ? 'text-sm'
                                : 'text-xs';

                            return (
                              <td
                                key={colNum}
                                className="border-2 border-black p-2 align-middle bg-white min-w-[105px] h-24"
                              >
                                {seat ? (
                                  occupied ? (
                                    <div className="flex flex-col items-center justify-center h-full">
                                      {/* Seat coordinate and Door/Window indicator */}
                                      <div className="w-full flex items-center justify-between text-[9px] font-mono font-bold text-slate-400 mb-0.5">
                                        <span>{seat.seatNo}</span>
                                        <div className="flex items-center gap-0.5">
                                          {isDoor && <span className="text-red-700 bg-red-100 px-1 rounded font-extrabold text-[8px]">DOOR</span>}
                                          {isWindow && <span className="text-sky-700 bg-sky-100 px-1 rounded font-extrabold text-[8px]">WIN</span>}
                                        </div>
                                      </div>

                                      {/* SIRF CLASS (BOLD UPPERCASE) */}
                                      <div className={`font-black text-blue-900 uppercase tracking-wide leading-tight ${classFontSize}`}>
                                        {seat.className}
                                      </div>

                                      {/* SIRF ROLL NUMBER (LARGE FONT) */}
                                      <div className="mt-0.5 flex items-baseline justify-center gap-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                          ROLL
                                        </span>
                                        <span className={`font-black text-black font-mono tracking-tight leading-none ${rollFontSize}`}>
                                          {seat.rollNo}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                      <span className="text-[9px] font-mono">{seat.seatNo}</span>
                                      <span className="text-xs font-bold mt-1">— VACANT —</span>
                                    </div>
                                  )
                                ) : (
                                  <span className="text-slate-300 text-xs">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Instructions and Signatures */}
              <div className="mt-4 pt-3 border-t border-slate-300 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-2">
                <div>
                  <strong>Notice to Students:</strong> Candidates must take their seats strictly according to their Class and Roll Number as indicated on this chart.
                </div>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span>[DOOR] = Door Side</span>
                  <span>[WIN] = Window Side</span>
                </div>
              </div>

              <div className="mt-12 flex justify-between text-center text-xs text-slate-800">
                <div className="w-56 border-t-2 border-black pt-1 font-bold">
                  Hall Superintendent / Invigilator
                </div>
                <div className="w-56 border-t-2 border-black pt-1 font-bold">
                  Exam Controller / Center Superintendent
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
