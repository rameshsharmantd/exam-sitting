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
  Type,
  Edit2
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { HeaderPrint } from '../common/HeaderPrint';
import { SittingSeat, Student, Hall, SittingArrangement } from '../../types';

export const SittingArrangementView: React.FC = () => {
  const {
    settings,
    halls,
    students,
    saveHall,
    getSittingPlan,
    generateSitting,
    clearSittingPlan,
    swapSeats,
    emptySeat,
    updateColumnClass,
    updateSeatDetails,
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
  const [fontSizeScale, setFontSizeScale] = useState<'compact' | 'normal' | 'large' | 'extra-large' | 'jumbo'>('normal');

  // Interactive seat swap selection
  const [selectedSeatForSwap, setSelectedSeatForSwap] = useState<string | null>(null);
  const [draggedSeatNo, setDraggedSeatNo] = useState<string | null>(null);

  // Editable Column & Relative desks state
  const [editingColumn, setEditingColumn] = useState<{
    colNum: number;
    currentClass: string;
    customClassName: string;
    targetScope: 'SINGLE' | 'ALTERNATING' | 'ALL';
    mode: 'FILL_STUDENTS' | 'KEEP_ROLLS';
  } | null>(null);

  // Editable Seat details state (with auto-generated name & student ID)
  const [editingSeat, setEditingSeat] = useState<{
    seatNo: string;
    className: string;
    rollNo: string;
    studentName: string;
    studentId?: string;
  } | null>(null);

  // Door and Window configuration (editable at head)
  const [doorSide, setDoorSide] = useState<'LEFT' | 'RIGHT'>('LEFT');
  const [windowSide, setWindowSide] = useState<'LEFT' | 'RIGHT'>('RIGHT');
  const [doorLabel, setDoorLabel] = useState<string>('MAIN DOOR (प्रवेश द्वार)');
  const [windowLabel, setWindowLabel] = useState<string>('WINDOW (खिड़की)');
  const [showDoorWindowModal, setShowDoorWindowModal] = useState<boolean>(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showOverflowList, setShowOverflowList] = useState(false);

  // Notice Board Print Mode (2 Halls in 1 A4 Page आधा-आधा or Single Hall)
  const [printLayoutMode, setPrintLayoutMode] = useState<'TWO_HALLS' | 'SINGLE_HALL' | 'ALL_HALLS_PAIRED'>('TWO_HALLS');
  const [secondHallId, setSecondHallId] = useState<string>('');

  // Default hall selection & second hall pairing
  useEffect(() => {
    if (halls.length > 0) {
      if (!selectedHallId) {
        setSelectedHallId(halls[0].hallId);
      }
      if (!secondHallId || secondHallId === selectedHallId) {
        const other = halls.find(h => h.hallId !== (selectedHallId || halls[0].hallId));
        if (other) {
          setSecondHallId(other.hallId);
        } else {
          setSecondHallId(halls[0].hallId);
        }
      }
    }
  }, [halls, selectedHallId, secondHallId]);

  const currentHall = halls.find(h => h.hallId === selectedHallId);
  const currentPlan = selectedHallId ? getSittingPlan(exam, session, selectedHallId) : undefined;
  const currentHallIndex = halls.findIndex(h => h.hallId === selectedHallId);
  const nextHall = currentHallIndex >= 0 && currentHallIndex + 1 < halls.length ? halls[currentHallIndex + 1] : null;
  const prevHall = currentHallIndex > 0 ? halls[currentHallIndex - 1] : null;

  // Synchronize dynamic rows & columns and door/window when hall changes
  useEffect(() => {
    if (currentHall) {
      setCustomRows(currentHall.rows);
      setCustomCols(currentHall.columns);

      const dPos = (currentHall.doorPosition || '').toUpperCase();
      if (dPos.includes(`C${currentHall.columns}`) || dPos.includes('RIGHT')) {
        setDoorSide('RIGHT');
        setWindowSide('LEFT');
      } else {
        setDoorSide('LEFT');
        setWindowSide('RIGHT');
      }
    }
  }, [currentHall?.hallId, currentHall?.rows, currentHall?.columns, currentHall?.doorPosition, currentHall?.windowPosition]);

  // Assigned classes in current hall
  const currentAssignedClasses = selectedHallId ? getHallClasses(exam, session, selectedHallId) : [];

  // Split calculation (e.g. 6 cols -> 3+3; 8 cols -> 4+4)
  const totalCols = currentHall?.columns || 0;
  const shouldSplit = totalCols >= 4;
  const splitCol = Math.ceil(totalCols / 2);

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

  const handleColumnClassChange = (
    colNum: number,
    newClassName: string,
    scope: 'SINGLE' | 'ALTERNATING' | 'ALL' = 'SINGLE',
    mode: 'FILL_STUDENTS' | 'KEEP_ROLLS' = 'FILL_STUDENTS'
  ) => {
    if (!currentPlan || !currentHall) return;
    if (currentPlan.locked) {
      setMessage({
        type: 'error',
        text: 'Sitting arrangement is locked. Please unlock it to edit column classes.'
      });
      return;
    }

    const cleanClass = newClassName.trim().toUpperCase();
    if (!cleanClass) return;

    let targetCols: number[] = [];
    if (scope === 'SINGLE') {
      targetCols = [colNum];
    } else if (scope === 'ALTERNATING') {
      const isEven = colNum % 2 === 0;
      for (let c = 1; c <= currentHall.columns; c++) {
        if ((c % 2 === 0) === isEven) {
          targetCols.push(c);
        }
      }
    } else if (scope === 'ALL') {
      for (let c = 1; c <= currentHall.columns; c++) {
        targetCols.push(c);
      }
    }

    let updatedCount = 0;
    targetCols.forEach(c => {
      const res = updateColumnClass(exam, session, selectedHallId, c, cleanClass, mode);
      if (res.success) updatedCount++;
    });

    setMessage({
      type: 'success',
      text: `Class "${cleanClass}" successfully set for ${
        scope === 'SINGLE'
          ? `Column ${colNum}`
          : scope === 'ALTERNATING'
          ? `Alternating Columns (${targetCols.map(c => `Col ${c}`).join(', ')})`
          : `All ${updatedCount} Columns`
      } and relative examination desks!`
    });

    setEditingColumn(null);
  };

  // Auto-generate or match student name when class is changed in Desk Edit modal
  const handleSeatClassChange = (newClass: string) => {
    if (!editingSeat) return;
    const cleanClass = newClass.trim().toUpperCase();
    const currentRoll = editingSeat.rollNo.trim();

    let autoName = '';
    let autoId = '';
    if (cleanClass && currentRoll) {
      const match = students.find(
        s => s.className.trim().toUpperCase() === cleanClass &&
             (s.rollNo.trim() === currentRoll || Number(s.rollNo) === Number(currentRoll))
      );
      if (match) {
        autoName = match.name;
        autoId = match.studentId;
      } else {
        autoName = `Student ${cleanClass}-${currentRoll}`;
        autoId = `STU-${cleanClass}-${currentRoll}`;
      }
    }

    setEditingSeat(prev =>
      prev
        ? {
            ...prev,
            className: newClass,
            studentName: autoName || prev.studentName,
            studentId: autoId || prev.studentId
          }
        : null
    );
  };

  // Auto-generate or match student name when roll number is changed in Desk Edit modal
  const handleSeatRollChange = (newRoll: string) => {
    if (!editingSeat) return;
    const cleanRoll = newRoll.trim();
    const cleanClass = editingSeat.className.trim().toUpperCase();

    let autoName = '';
    let autoId = '';
    if (cleanClass && cleanRoll) {
      const match = students.find(
        s => s.className.trim().toUpperCase() === cleanClass &&
             (s.rollNo.trim() === cleanRoll || Number(s.rollNo) === Number(cleanRoll))
      );
      if (match) {
        autoName = match.name;
        autoId = match.studentId;
      } else {
        autoName = `Student ${cleanClass}-${cleanRoll}`;
        autoId = `STU-${cleanClass}-${cleanRoll}`;
      }
    } else if (cleanRoll) {
      autoName = `Student Roll ${cleanRoll}`;
      autoId = `STU-${cleanRoll}`;
    }

    setEditingSeat(prev =>
      prev
        ? {
            ...prev,
            rollNo: newRoll,
            studentName: autoName || prev.studentName,
            studentId: autoId || prev.studentId
          }
        : null
    );
  };

  // Quick select a registered student for the desk
  const handleSelectStudentForSeat = (st: Student) => {
    if (!editingSeat) return;
    setEditingSeat(prev =>
      prev
        ? {
            ...prev,
            className: st.className,
            rollNo: st.rollNo,
            studentName: st.name,
            studentId: st.studentId
          }
        : null
    );
  };

  const handleClearSeat = () => {
    if (!editingSeat || !selectedHallId) return;
    emptySeat(exam, session, selectedHallId, editingSeat.seatNo);
    setMessage({
      type: 'info',
      text: `Desk ${editingSeat.seatNo} cleared (vacant).`
    });
    setEditingSeat(null);
  };

  const handleSaveSeatDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeat || !selectedHallId) return;

    const cleanClass = editingSeat.className.trim().toUpperCase();
    const cleanRoll = editingSeat.rollNo.trim();
    let finalName = editingSeat.studentName.trim();
    let finalId = editingSeat.studentId?.trim();

    // Auto generate if name wasn't provided
    if (cleanClass && cleanRoll && (!finalName || finalName === '')) {
      const match = students.find(
        s => s.className.trim().toUpperCase() === cleanClass &&
             (s.rollNo.trim() === cleanRoll || Number(s.rollNo) === Number(cleanRoll))
      );
      if (match) {
        finalName = match.name;
        finalId = match.studentId;
      } else {
        finalName = `Student ${cleanClass}-${cleanRoll}`;
        finalId = `STU-${cleanClass}-${cleanRoll}`;
      }
    }

    const res = updateSeatDetails(exam, session, selectedHallId, editingSeat.seatNo, {
      className: cleanClass,
      rollNo: cleanRoll,
      studentName: finalName,
      studentId: finalId
    });

    if (res.success) {
      setMessage({
        type: 'success',
        text: `Desk ${editingSeat.seatNo} details successfully updated (Class: ${cleanClass}, Roll: ${cleanRoll}, Name: ${finalName}).`
      });
    }
    setEditingSeat(null);
  };

  const handleSwapDoorWindow = () => {
    const newDoorSide = doorSide === 'LEFT' ? 'RIGHT' : 'LEFT';
    const newWindowSide = windowSide === 'RIGHT' ? 'LEFT' : 'RIGHT';
    setDoorSide(newDoorSide);
    setWindowSide(newWindowSide);

    if (currentHall) {
      const dPos = newDoorSide === 'LEFT' ? 'R1C1' : `R1C${currentHall.columns}`;
      const wPos = newWindowSide === 'RIGHT' ? `R1C${currentHall.columns}` : 'R1C1';
      saveHall({
        ...currentHall,
        doorPosition: dPos,
        windowPosition: wPos
      });
    }

    setMessage({
      type: 'success',
      text: `Door swapped to ${newDoorSide} side and Window swapped to ${newWindowSide} side.`
    });
  };

  const handleSaveDoorWindowConfig = (
    newDoor: 'LEFT' | 'RIGHT',
    newWin: 'LEFT' | 'RIGHT',
    dLbl: string,
    wLbl: string
  ) => {
    setDoorSide(newDoor);
    setWindowSide(newWin);
    setDoorLabel(dLbl.trim() || 'MAIN DOOR (प्रवेश द्वार)');
    setWindowLabel(wLbl.trim() || 'WINDOW (खिड़की)');

    if (currentHall) {
      const dPos = newDoor === 'LEFT' ? 'R1C1' : `R1C${currentHall.columns}`;
      const wPos = newWin === 'RIGHT' ? `R1C${currentHall.columns}` : 'R1C1';
      saveHall({
        ...currentHall,
        doorPosition: dPos,
        windowPosition: wPos
      });
    }
    setShowDoorWindowModal(false);
    setMessage({
      type: 'success',
      text: `Door & Window configuration saved successfully!`
    });
  };

  const getSeatDoorWindowStatus = (seat: SittingSeat, totalCols: number) => {
    const isDoor =
      (doorSide === 'LEFT' && seat.column === 1) ||
      (doorSide === 'RIGHT' && seat.column === totalCols) ||
      seat.doorWindow.includes('DOOR');

    const isWindow =
      (windowSide === 'RIGHT' && seat.column === totalCols) ||
      (windowSide === 'LEFT' && seat.column === 1) ||
      seat.doorWindow.includes('WINDOW');

    return { isDoor, isWindow };
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
              {/* Room Front / Head Banner with Door & Window (Editable) */}
              {currentHall && (
                <div className="p-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl shadow-sm border border-slate-700 flex items-center justify-between gap-3 select-none">
                  {/* Left Side (Door or Window) */}
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                      doorSide === 'LEFT'
                        ? 'bg-red-500/20 border-red-400/60 text-red-200'
                        : 'bg-sky-500/20 border-sky-400/60 text-sky-200'
                    }`}>
                      <span className="text-base">{doorSide === 'LEFT' ? '🚪' : '🪟'}</span>
                      <span className="tracking-wide uppercase font-black">{doorSide === 'LEFT' ? doorLabel : windowLabel}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDoorWindowModal(true)}
                      className="text-[10px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg border border-slate-600 cursor-pointer transition-colors"
                      title="Edit Door & Window Settings"
                    >
                      <Edit2 className="w-3 h-3 inline mr-1" />
                      Edit
                    </button>
                  </div>

                  {/* Center (Hall Name in Large & Blackboard Front) */}
                  <div className="flex flex-col items-center justify-center text-center px-4">
                    <div className="text-base sm:text-2xl font-black uppercase tracking-wide text-white flex items-center justify-center gap-2">
                      <span>{currentHall.hallName}</span>
                      <span className="text-xs sm:text-sm font-bold text-amber-300 font-mono bg-slate-800/90 px-2.5 py-0.5 rounded-md border border-amber-400/40">
                        {currentHall.hallId}
                      </span>
                    </div>
                    <div className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-slate-300 flex items-center gap-1.5 mt-0.5">
                      <span className="text-amber-400">▲</span>
                      <span>BLACKBOARD / TEACHER'S DESK / FRONT OF EXAMINATION HALL</span>
                      <span className="text-amber-400">▲</span>
                    </div>
                  </div>

                  {/* Right Side (Window or Door) */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSwapDoorWindow}
                      className="text-[10px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-600 cursor-pointer transition-colors"
                      title="Swap Door and Window sides"
                    >
                      ⇄ Swap Sides
                    </button>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                      windowSide === 'RIGHT'
                        ? 'bg-sky-500/20 border-sky-400/60 text-sky-200'
                        : 'bg-red-500/20 border-red-400/60 text-red-200'
                    }`}>
                      <span className="text-base">{windowSide === 'RIGHT' ? '🪟' : '🚪'}</span>
                      <span className="tracking-wide uppercase font-black">{windowSide === 'RIGHT' ? windowLabel : doorLabel}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Column Headers Row (Column-wise View with 2 Parts & Aisle) */}
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
                        currentAssignedClasses[cIdx]?.className ||
                        '';

                      return (
                        <React.Fragment key={colNum}>
                          {/* Central Walkway Aisle Divider between Part 1 and Part 2 */}
                          {shouldSplit && colNum === splitCol + 1 && (
                            <div className="w-20 py-2 px-1 text-center rounded-xl bg-amber-50/90 border-2 border-dashed border-amber-300 shadow-2xs flex flex-col items-center justify-center text-amber-900 shrink-0 select-none">
                              <div className="text-[10px] font-black uppercase tracking-wider">AISLE</div>
                              <div className="text-[8px] font-bold text-amber-700">गैलरी / रास्ता</div>
                            </div>
                          )}

                          <div
                            className="w-36 py-2 px-2 text-center rounded-xl bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 hover:border-blue-400 transition-all shadow-2xs group flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                              <span>Col {colNum}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingColumn({
                                    colNum,
                                    currentClass: colClass,
                                    customClassName: colClass,
                                    targetScope: 'SINGLE',
                                    mode: 'FILL_STUDENTS'
                                  })
                                }
                                title={`Edit Class for Column ${colNum} and relative desks`}
                                className="opacity-70 group-hover:opacity-100 p-0.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer transition-opacity"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Editable Class Selector (sabhi column editable) */}
                            <select
                              value={colClass}
                              disabled={currentPlan.locked}
                              onChange={e => {
                                if (e.target.value === '__custom__') {
                                  setEditingColumn({
                                    colNum,
                                    currentClass: colClass,
                                    customClassName: colClass,
                                    targetScope: 'SINGLE',
                                    mode: 'FILL_STUDENTS'
                                  });
                                } else {
                                  handleColumnClassChange(colNum, e.target.value, 'SINGLE', 'FILL_STUDENTS');
                                }
                              }}
                              className="w-full text-xs font-black text-blue-900 bg-white border border-slate-300 rounded px-1.5 py-1 shadow-2xs hover:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center font-mono cursor-pointer transition-all disabled:opacity-50"
                              title={`Click to edit Class for Column ${colNum} and relative desks`}
                            >
                              <option value="" disabled>
                                -- Select Class --
                              </option>
                              {settings.classes.map(cls => (
                                <option key={cls} value={cls}>
                                  {cls}
                                </option>
                              ))}
                              {colClass && !settings.classes.includes(colClass) && (
                                <option value={colClass}>{colClass}</option>
                              )}
                              <option value="__custom__">✏️ Custom / All...</option>
                            </select>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Rows (Row-wise View with 2 Parts & Aisle) */}
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
                          const { isDoor, isWindow } = getSeatDoorWindowStatus(seat, currentHall.columns);

                          return (
                            <React.Fragment key={seat.seatNo}>
                              {/* Central Walkway Spacer between Part 1 and Part 2 */}
                              {shouldSplit && seat.column === splitCol + 1 && (
                                <div className="w-20 h-28 rounded-xl bg-slate-100/90 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 select-none shrink-0">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">AISLE</span>
                                  <span className="text-[8px] font-bold text-slate-400">गैलरी</span>
                                  <span className="text-slate-300 font-mono text-xs">║</span>
                                </div>
                              )}

                              <div
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
                                      <span className="px-1 py-0.2 rounded text-[8px] font-extrabold bg-red-100 text-red-700 border border-red-200" title="Door Entrance Desk">
                                        DOOR
                                      </span>
                                    )}
                                    {isWindow && (
                                      <span className="px-1 py-0.2 rounded text-[8px] font-extrabold bg-sky-100 text-sky-700 border border-sky-200" title="Window Ventilation Desk">
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

                                <div className="flex items-center gap-1">
                                  {!currentPlan.locked && (
                                    <button
                                      type="button"
                                      onClick={e => {
                                        e.stopPropagation();
                                        setEditingSeat({
                                          seatNo: seat.seatNo,
                                          className: seat.className,
                                          rollNo: seat.rollNo,
                                          studentName: seat.studentName
                                        });
                                      }}
                                      className="text-slate-400 hover:text-blue-600 p-0.5 cursor-pointer"
                                      title="Edit seat class or roll number"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  )}

                                  {occupied && !currentPlan.locked && (
                                    <button
                                      type="button"
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
                            </div>
                          </React.Fragment>
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

      {/* Notice Board Printable Modal (Supports 2 Halls per A4 Page आधा-आधा and Single Hall) */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs print-modal-container">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[96vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:max-w-none print:max-h-none print:rounded-none">
            {/* Modal header bar */}
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between print:hidden flex-wrap gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-black text-slate-800 uppercase tracking-wide">
                    Notice Board Seating Chart (सूचना पट्ट)
                  </span>
                </div>

                {/* Print Layout Mode Selector */}
                <div className="flex items-center bg-white rounded-xl border border-slate-300 p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setPrintLayoutMode('TWO_HALLS')}
                    className={`px-3 py-1.5 text-xs font-black rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 ${
                      printLayoutMode === 'TWO_HALLS'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                    title="A4 पेज में 2 हॉल आधा-आधा प्रिंट करें"
                  >
                    <span>📄 2 Halls in 1 A4 (आधा-आधा)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintLayoutMode('SINGLE_HALL')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 ${
                      printLayoutMode === 'SINGLE_HALL'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>Full Page (1 Hall)</span>
                  </button>
                  {halls.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setPrintLayoutMode('ALL_HALLS_PAIRED')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 ${
                        printLayoutMode === 'ALL_HALLS_PAIRED'
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                      title="सभी परीक्षा हॉल को 2-2 आधा-आधा A4 शीट में प्रिंट करें"
                    >
                      <span>📑 All Halls (2 per Page)</span>
                    </button>
                  )}
                </div>

                {/* In TWO_HALLS mode: Room Selectors */}
                {printLayoutMode === 'TWO_HALLS' && (
                  <div className="flex items-center gap-2 pl-2 border-l border-slate-300">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="font-bold text-slate-600">Top Hall (ऊपर):</span>
                      <select
                        value={selectedHallId}
                        onChange={e => setSelectedHallId(e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-blue-900"
                      >
                        {halls.map(h => (
                          <option key={h.hallId} value={h.hallId}>
                            {h.hallName} ({h.rows}R×{h.columns}C)
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const temp = selectedHallId;
                        setSelectedHallId(secondHallId || halls[0]?.hallId || '');
                        setSecondHallId(temp);
                      }}
                      className="p-1 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer"
                      title="Swap Top and Bottom Halls"
                    >
                      ⇄
                    </button>

                    <div className="flex items-center gap-1 text-xs">
                      <span className="font-bold text-slate-600">Bottom Hall (नीचे):</span>
                      <select
                        value={secondHallId || (halls.find(h => h.hallId !== selectedHallId)?.hallId || selectedHallId)}
                        onChange={e => setSecondHallId(e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-blue-900"
                      >
                        {halls.map(h => (
                          <option key={h.hallId} value={h.hallId}>
                            {h.hallName} ({h.rows}R×{h.columns}C)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Font Size Selector */}
                <div className="flex items-center gap-1 pl-2 border-l border-slate-300">
                  <span className="text-xs font-bold text-slate-600">Roll Font:</span>
                  <div className="flex items-center bg-white rounded-lg border border-slate-300 p-0.5">
                    {(['compact', 'normal', 'large', 'extra-large'] as const).map(scale => (
                      <button
                        key={scale}
                        type="button"
                        onClick={() => setFontSizeScale(scale)}
                        className={`px-2 py-1 text-[11px] font-bold rounded cursor-pointer capitalize ${
                          fontSizeScale === scale
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {scale}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Door/Window Controls */}
                <div className="flex items-center gap-1.5 print:hidden">
                  <button
                    type="button"
                    onClick={handleSwapDoorWindow}
                    className="px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors shadow-2xs"
                    title="Swap Door and Window Sides"
                  >
                    ⇄ Swap Door & Window
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDoorWindowModal(true)}
                    className="px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors shadow-2xs"
                    title="Edit Door & Window Labels"
                  >
                    <Edit2 className="w-3 h-3 inline mr-1" />
                    Labels
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Now</span>
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
            <div className="p-4 sm:p-6 overflow-y-auto print:p-0">
              <style>{`
                @media print {
                  @page {
                    size: ${printLayoutMode === 'TWO_HALLS' || printLayoutMode === 'ALL_HALLS_PAIRED' ? 'A4 portrait' : 'landscape'};
                    margin: 4mm;
                  }
                  body {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .print-modal-container {
                    position: static !important;
                    inset: auto !important;
                    background: transparent !important;
                    padding: 0 !important;
                    overflow: visible !important;
                  }
                  .a4-page-sheet {
                    page-break-after: always;
                    page-break-inside: avoid;
                    break-after: page;
                    break-inside: avoid;
                    height: 287mm !important;
                    max-height: 287mm !important;
                    box-sizing: border-box !important;
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: space-between !important;
                    padding: 2mm 0 !important;
                    margin: 0 auto !important;
                    overflow: hidden !important;
                  }
                  .a4-half-block {
                    height: 48.5% !important;
                    max-height: 48.5% !important;
                    box-sizing: border-box !important;
                    display: flex !important;
                    flex-direction: column !important;
                    justify-content: space-between !important;
                    border: 1.5px solid #000 !important;
                    border-radius: 6px !important;
                    padding: 2.5mm !important;
                    overflow: hidden !important;
                  }
                  .a4-cut-divider {
                    height: 2.5% !important;
                    margin: 1mm 0 !important;
                    border-top: 1.5px dashed #475569 !important;
                    border-bottom: 1.5px dashed #475569 !important;
                  }
                  .a4-single-full-page {
                    page-break-after: always;
                    page-break-inside: avoid;
                    break-after: page;
                    break-inside: avoid;
                    min-height: 280mm !important;
                    box-sizing: border-box !important;
                    padding: 4mm !important;
                  }
                }
              `}</style>

              {/* Helper function to render a single hall chart */}
              {(() => {
                const renderHallChart = (
                  targetHall: Hall | undefined,
                  isHalfPage: boolean
                ) => {
                  if (!targetHall) {
                    return (
                      <div className="p-8 text-center text-slate-400 font-bold border-2 border-dashed border-slate-300 rounded-xl">
                        No Hall Selected
                      </div>
                    );
                  }

                  const hallPlan = getSittingPlan(exam, session, targetHall.hallId);
                  const hallSeats = hallPlan?.seats || [];
                  const hallOccupiedCount = hallSeats.filter(
                    s => s.studentName && s.studentName.trim() !== ''
                  ).length;
                  const hallCols = targetHall.columns || 0;
                  const hallRows = targetHall.rows || 0;
                  const hallShouldSplit = hallCols >= 4;
                  const hallSplitCol = Math.ceil(hallCols / 2);
                  const hallAssignedClasses = getHallClasses(exam, session, targetHall.hallId);

                  const rowMap: Record<number, SittingSeat[]> = {};
                  hallSeats.forEach(seat => {
                    if (!rowMap[seat.row]) rowMap[seat.row] = [];
                    rowMap[seat.row].push(seat);
                  });

                  const rollFontSize =
                    fontSizeScale === 'jumbo'
                      ? isHalfPage ? 'text-2xl print:text-xl' : 'text-4xl'
                      : fontSizeScale === 'extra-large'
                      ? isHalfPage ? 'text-xl print:text-lg' : 'text-3xl'
                      : fontSizeScale === 'large'
                      ? isHalfPage ? 'text-lg print:text-base' : 'text-2xl'
                      : fontSizeScale === 'normal'
                      ? isHalfPage ? 'text-base print:text-sm' : 'text-xl'
                      : isHalfPage ? 'text-sm print:text-xs' : 'text-lg';

                  const classFontSize =
                    fontSizeScale === 'jumbo'
                      ? isHalfPage ? 'text-xs print:text-[11px]' : 'text-base'
                      : fontSizeScale === 'extra-large'
                      ? isHalfPage ? 'text-[11px] print:text-[10px]' : 'text-sm'
                      : fontSizeScale === 'large'
                      ? isHalfPage ? 'text-[10px] print:text-[9px]' : 'text-xs'
                      : isHalfPage ? 'text-[9px] print:text-[8px]' : 'text-xs';

                  const cellHeightClass = isHalfPage
                    ? 'h-11 sm:h-12 print:h-10'
                    : 'h-24';

                  return (
                    <div className={`notice-board-hall-chart flex flex-col justify-between ${isHalfPage ? 'h-full' : ''}`}>
                      {/* Top Title Bar */}
                      {isHalfPage ? (
                        <div className="border-b-2 border-black pb-1 mb-1 text-center">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-black text-slate-700 uppercase">
                              {exam} • {session}
                            </span>
                            <h2 className="text-xs sm:text-sm font-black tracking-wide text-black uppercase">
                              {settings.schoolName || 'EXAMINATION SEATING CHART'}
                            </h2>
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300 text-[10px] font-black uppercase">
                              HALL: {targetHall.hallName}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-700 font-bold uppercase tracking-wider mt-0.5 flex items-center justify-center gap-3">
                            <span><strong>ROOM ID:</strong> {targetHall.hallId}</span>
                            <span>•</span>
                            <span><strong>CAPACITY:</strong> {hallRows}R × {hallCols}C ({hallRows * hallCols} Desks)</span>
                            <span>•</span>
                            <span><strong>SEATED:</strong> {hallOccupiedCount} Candidates</span>
                            {hallShouldSplit && (
                              <>
                                <span>•</span>
                                <span className="text-blue-800">
                                  <strong>2 PARTS:</strong> {hallSplitCol}+{hallCols - hallSplitCol} + AISLE
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <HeaderPrint
                            title={`EXAMINATION SEATING CHART (NOTICE BOARD COPY)`}
                            subtitle={`${targetHall.hallName ? `ROOM / HALL: ${targetHall.hallName} • ` : ''}Exam: ${exam} | Session: ${session} | Total Seated: ${hallOccupiedCount}`}
                            exam={exam}
                            session={session}
                          />
                          <div className="my-3 py-2 px-4 rounded-lg bg-slate-100 border border-slate-300 flex items-center justify-between text-xs font-bold text-slate-800 uppercase">
                            <span>Room / Hall: <strong className="text-blue-900 text-sm">{targetHall.hallName} ({targetHall.hallId})</strong></span>
                            <span>
                              Arrangement: {hallRows} Rows × {hallCols} Columns
                              {hallShouldSplit ? ` (Splits into 2 Parts: ${hallSplitCol}+${hallCols - hallSplitCol} with Central Aisle)` : ''}
                            </span>
                            <span>Seated: {hallOccupiedCount} / {hallRows * hallCols} Desks</span>
                          </div>
                        </>
                      )}

                      {/* Head: Door | Blackboard | Window */}
                      <div className={`grid grid-cols-12 items-stretch border-2 border-black rounded-lg overflow-hidden bg-white text-black font-bold ${isHalfPage ? 'my-1' : 'my-2.5'}`}>
                        {/* Left Head */}
                        <div className={`col-span-3 border-r-2 border-black flex items-center justify-center gap-1.5 ${isHalfPage ? 'p-1' : 'p-2'} ${
                          doorSide === 'LEFT' ? 'bg-red-50 text-red-950' : 'bg-sky-50 text-sky-950'
                        }`}>
                          <span className={isHalfPage ? 'text-base' : 'text-xl'}>{doorSide === 'LEFT' ? '🚪' : '🪟'}</span>
                          <div className="text-center">
                            <div className={`${isHalfPage ? 'text-[9px]' : 'text-xs'} font-black uppercase tracking-wide`}>
                              {doorSide === 'LEFT' ? doorLabel : windowLabel}
                            </div>
                            <div className={`${isHalfPage ? 'text-[7px]' : 'text-[9px]'} text-slate-600 font-medium`}>
                              {doorSide === 'LEFT' ? '(प्रवेश द्वार)' : '(खिड़की)'}
                            </div>
                          </div>
                        </div>

                        {/* Center Head */}
                        <div className={`col-span-6 text-center bg-slate-100 flex flex-col items-center justify-center ${isHalfPage ? 'p-1' : 'p-2'}`}>
                          <div className={`${isHalfPage ? 'text-xs sm:text-base print:text-sm' : 'text-lg sm:text-2xl'} font-black uppercase tracking-wide text-black flex items-center justify-center gap-2`}>
                            <span>{targetHall.hallName}</span>
                            <span className={`${isHalfPage ? 'text-[10px] print:text-[9px]' : 'text-xs sm:text-sm'} font-mono font-bold text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300`}>
                              {targetHall.hallId}
                            </span>
                          </div>
                          <div className={`${isHalfPage ? 'text-[8px] print:text-[7.5px]' : 'text-[10px]'} text-slate-700 font-extrabold uppercase tracking-widest mt-0.5`}>
                            ▲ BLACKBOARD / FRONT OF EXAMINATION ROOM ▲
                          </div>
                        </div>

                        {/* Right Head */}
                        <div className={`col-span-3 border-l-2 border-black flex items-center justify-center gap-1.5 ${isHalfPage ? 'p-1' : 'p-2'} ${
                          windowSide === 'RIGHT' ? 'bg-sky-50 text-sky-950' : 'bg-red-50 text-red-950'
                        }`}>
                          <span className={isHalfPage ? 'text-base' : 'text-xl'}>{windowSide === 'RIGHT' ? '🪟' : '🚪'}</span>
                          <div className="text-center">
                            <div className={`${isHalfPage ? 'text-[9px]' : 'text-xs'} font-black uppercase tracking-wide`}>
                              {windowSide === 'RIGHT' ? windowLabel : doorLabel}
                            </div>
                            <div className={`${isHalfPage ? 'text-[7px]' : 'text-[9px]'} text-slate-600 font-medium`}>
                              {windowSide === 'RIGHT' ? '(खिड़की)' : '(प्रवेश द्वार)'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Seating Table */}
                      <div className={`overflow-x-auto ${isHalfPage ? 'my-0.5' : 'my-2'}`}>
                        <table className="w-full border-collapse border-2 border-black text-center">
                          <thead>
                            <tr className="bg-slate-200 border-b-2 border-black">
                              <th className={`border-2 border-black text-black uppercase bg-slate-300 ${isHalfPage ? 'p-0.5 text-[8px] w-12' : 'p-2 text-xs w-20'}`}>
                                Row \ Col
                              </th>
                              {Array.from({ length: hallCols }, (_, cIdx) => {
                                const colNum = cIdx + 1;
                                const colSeats = hallSeats.filter(s => s.column === colNum);
                                const colClass =
                                  colSeats.find(s => s.className?.trim() !== '')?.className ||
                                  hallAssignedClasses[cIdx]?.className;

                                return (
                                  <React.Fragment key={colNum}>
                                    {/* Central Aisle Header */}
                                    {hallShouldSplit && colNum === hallSplitCol + 1 && (
                                      <th className={`border-2 border-black text-center bg-amber-100 text-amber-950 font-black uppercase ${isHalfPage ? 'p-0.5 w-10 text-[7px]' : 'py-2 px-1 w-16 text-[10px]'}`}>
                                        <div>AISLE</div>
                                        <div className={isHalfPage ? 'text-[6px]' : 'text-[8px]'}>रास्ता</div>
                                      </th>
                                    )}

                                    <th className={`border-2 border-black text-center bg-slate-100 relative group ${isHalfPage ? 'p-0.5' : 'py-2 px-3'}`}>
                                      <div className={`flex items-center justify-center gap-1 font-bold text-slate-600 uppercase ${isHalfPage ? 'text-[7px]' : 'text-[10px]'}`}>
                                        <span>Col {colNum}</span>
                                      </div>
                                      <div className={`font-black text-blue-900 uppercase truncate ${isHalfPage ? 'text-[9px] leading-tight' : 'text-xs sm:text-sm'}`}>
                                        {colClass || `Col ${colNum}`}
                                      </div>
                                    </th>
                                  </React.Fragment>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from({ length: hallRows }, (_, rIdx) => {
                              const rowNum = rIdx + 1;
                              const rowSeats = rowMap[rowNum] || [];

                              return (
                                <tr key={rowNum} className="border-b-2 border-black">
                                  {/* Row Header */}
                                  <td className={`border-2 border-black font-black text-black bg-slate-100 whitespace-nowrap ${isHalfPage ? 'p-0.5 text-[8px]' : 'p-2 text-xs'}`}>
                                    R{rowNum}
                                  </td>

                                  {/* Desks */}
                                  {Array.from({ length: hallCols }, (_, cIdx) => {
                                    const colNum = cIdx + 1;
                                    const seat = rowSeats.find(s => s.column === colNum);
                                    const occupied = seat && seat.studentName.trim() !== '';
                                    const { isDoor, isWindow } = seat
                                      ? getSeatDoorWindowStatus(seat, hallCols)
                                      : { isDoor: false, isWindow: false };

                                    return (
                                      <React.Fragment key={colNum}>
                                        {/* Central Aisle Cell */}
                                        {hallShouldSplit && colNum === hallSplitCol + 1 && (
                                          <td className={`border-2 border-black bg-slate-100 text-center align-middle ${isHalfPage ? 'p-0.5 w-10' : 'p-1 w-16'}`}>
                                            <div className="flex flex-col items-center justify-center font-mono text-slate-500">
                                              <span className={`${isHalfPage ? 'text-[6px]' : 'text-[8px]'} font-black uppercase`}>AISLE</span>
                                              <span className="text-slate-400 font-mono text-[9px]">║</span>
                                            </div>
                                          </td>
                                        )}

                                        <td className={`border-2 border-black align-middle bg-white ${isHalfPage ? 'p-0.5 min-w-[55px]' : 'p-2 min-w-[105px]'} ${cellHeightClass}`}>
                                          {seat ? (
                                            occupied ? (
                                              <div className="flex flex-col items-center justify-center h-full">
                                                {/* Seat No & Badges */}
                                                <div className={`w-full flex items-center justify-between font-mono font-bold text-slate-400 mb-0.5 ${isHalfPage ? 'text-[6px]' : 'text-[9px]'}`}>
                                                  <span>{seat.seatNo}</span>
                                                  <div className="flex items-center gap-0.5">
                                                    {isDoor && (
                                                      <span className={`text-red-700 bg-red-100 font-black rounded ${isHalfPage ? 'text-[5px] px-0.5' : 'text-[8px] px-1'}`}>
                                                        DOOR
                                                      </span>
                                                    )}
                                                    {isWindow && (
                                                      <span className={`text-sky-700 bg-sky-100 font-black rounded ${isHalfPage ? 'text-[5px] px-0.5' : 'text-[8px] px-1'}`}>
                                                        WIN
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Class Name */}
                                                <div className={`font-black text-blue-900 uppercase tracking-wide leading-tight ${classFontSize}`}>
                                                  {seat.className}
                                                </div>

                                                {/* Roll Number */}
                                                <div className="mt-0.5 flex items-baseline justify-center gap-0.5">
                                                  <span className={`font-bold text-slate-500 uppercase tracking-wider ${isHalfPage ? 'text-[7px]' : 'text-[10px]'}`}>
                                                    ROLL
                                                  </span>
                                                  <span className={`font-black text-black font-mono tracking-tight leading-none ${rollFontSize}`}>
                                                    {seat.rollNo}
                                                  </span>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                <span className={`font-mono ${isHalfPage ? 'text-[6px]' : 'text-[9px]'}`}>{seat.seatNo}</span>
                                                <span className={`font-bold ${isHalfPage ? 'text-[7px] mt-0.5' : 'text-xs mt-1'}`}>— VACANT —</span>
                                              </div>
                                            )
                                          ) : (
                                            <span className="text-slate-300 text-xs">—</span>
                                          )}
                                        </td>
                                      </React.Fragment>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Footer & Signatures */}
                      <div className={`pt-0.5 border-t border-slate-300 flex items-center justify-between text-slate-700 font-bold ${isHalfPage ? 'text-[7px] mt-0.5' : 'text-[11px] mt-3'}`}>
                        <div className="text-left">
                          <span>Room Notice Copy • Sit strictly as per Class & Roll No.</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="border-t border-black pt-0.5">Invigilator Sign</span>
                          <span className="border-t border-black pt-0.5">Center Superintendent Sign</span>
                        </div>
                      </div>
                    </div>
                  );
                };

                // MODE 1: TWO_HALLS (2 Halls on 1 A4 Page - आधा आधा)
                if (printLayoutMode === 'TWO_HALLS') {
                  const hall1 = halls.find(h => h.hallId === selectedHallId) || halls[0];
                  const hall2 =
                    halls.find(h => h.hallId === (secondHallId || (halls[1]?.hallId || selectedHallId))) ||
                    halls[1] ||
                    hall1;

                  return (
                    <div className="a4-page-sheet flex flex-col justify-between max-w-4xl mx-auto">
                      {/* Upper Half: Hall 1 */}
                      <div className="a4-half-block border-2 border-black rounded-xl p-2.5 bg-white shadow-xs">
                        {renderHallChart(hall1, true)}
                      </div>

                      {/* Scissor Cut Line (आधा-आधा विभाजन रेखा) */}
                      <div className="a4-cut-divider my-1 py-0.5 border-y-2 border-dashed border-slate-600 bg-slate-50 flex items-center justify-between px-3 text-[9px] font-mono font-black text-slate-700 uppercase tracking-wider select-none">
                        <span>✂️ - - - - - - - - - - - -</span>
                        <span>A4 आधा-आधा विभाजन (CUT HERE FOR ROOM COPY) • अगला परीक्षा कक्ष नीचे है (NEXT HALL BELOW)</span>
                        <span>- - - - - - - - - - - - ✂️</span>
                      </div>

                      {/* Lower Half: Hall 2 */}
                      <div className="a4-half-block border-2 border-black rounded-xl p-2.5 bg-white shadow-xs">
                        {renderHallChart(hall2, true)}
                      </div>
                    </div>
                  );
                }

                // MODE 2: ALL_HALLS_PAIRED (Pair all halls 2 per A4 sheet)
                if (printLayoutMode === 'ALL_HALLS_PAIRED') {
                  const pairs: [Hall, Hall | undefined][] = [];
                  for (let i = 0; i < halls.length; i += 2) {
                    pairs.push([halls[i], halls[i + 1]]);
                  }

                  return (
                    <div className="space-y-8 print:space-y-0">
                      {pairs.map(([h1, h2], pIdx) => (
                        <div key={pIdx} className="a4-page-sheet flex flex-col justify-between max-w-4xl mx-auto">
                          {/* Upper Half */}
                          <div className="a4-half-block border-2 border-black rounded-xl p-2.5 bg-white shadow-xs">
                            {renderHallChart(h1, true)}
                          </div>

                          {/* Scissor Cut Line */}
                          <div className="a4-cut-divider my-1 py-0.5 border-y-2 border-dashed border-slate-600 bg-slate-50 flex items-center justify-between px-3 text-[9px] font-mono font-black text-slate-700 uppercase tracking-wider select-none">
                            <span>✂️ - - - - - - - - - - - -</span>
                            <span>A4 आधा-आधा विभाजन (CUT HERE FOR ROOM COPY) • SHEET {pIdx + 1}</span>
                            <span>- - - - - - - - - - - - ✂️</span>
                          </div>

                          {/* Lower Half */}
                          <div className="a4-half-block border-2 border-black rounded-xl p-2.5 bg-white shadow-xs">
                            {h2 ? (
                              renderHallChart(h2, true)
                            ) : (
                              <div className="h-full flex items-center justify-center text-slate-400 font-bold border border-dashed border-slate-300 rounded-lg">
                                — Blank Half Page (Odd number of halls) —
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                }

                // MODE 3: SINGLE_HALL (Full Page)
                return (
                  <div className="a4-single-full-page max-w-5xl mx-auto">
                    {renderHallChart(currentHall, false)}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Edit Column & Relative Desks Modal */}
      {editingColumn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Edit Class for Column {editingColumn.colNum} & Relative Desks</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingColumn(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Class input & quick select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select or Enter Class Name:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {settings.classes.map(cls => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() =>
                        setEditingColumn(prev =>
                          prev ? { ...prev, customClassName: cls } : null
                        )
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        editingColumn.customClassName === cls
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-400'
                      }`}
                    >
                      {cls}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={editingColumn.customClassName}
                  onChange={e =>
                    setEditingColumn(prev =>
                      prev ? { ...prev, customClassName: e.target.value } : null
                    )
                  }
                  placeholder="e.g. X-A, IX-B, XII-COMMERCE..."
                  className="w-full px-3.5 py-2.5 text-sm font-bold text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Scope (Relative / Sabhi Column) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Application Scope (लागू करने का दायरा):
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-800">
                    <input
                      type="radio"
                      name="scope"
                      checked={editingColumn.targetScope === 'SINGLE'}
                      onChange={() =>
                        setEditingColumn(prev =>
                          prev ? { ...prev, targetScope: 'SINGLE' } : null
                        )
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold">Column {editingColumn.colNum} Only</div>
                      <div className="text-slate-500 text-[11px]">
                        Updates all {currentHall?.rows || 0} desks in Column {editingColumn.colNum}
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-800">
                    <input
                      type="radio"
                      name="scope"
                      checked={editingColumn.targetScope === 'ALTERNATING'}
                      onChange={() =>
                        setEditingColumn(prev =>
                          prev ? { ...prev, targetScope: 'ALTERNATING' } : null
                        )
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold">
                        Alternating Columns ({editingColumn.colNum % 2 === 0 ? 'Even Cols: 2, 4, 6...' : 'Odd Cols: 1, 3, 5...'})
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Applies this class to alternate benches across the hall (common exam pattern)
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-800">
                    <input
                      type="radio"
                      name="scope"
                      checked={editingColumn.targetScope === 'ALL'}
                      onChange={() =>
                        setEditingColumn(prev =>
                          prev ? { ...prev, targetScope: 'ALL' } : null
                        )
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold">All Columns (सभी कॉलम)</div>
                      <div className="text-slate-500 text-[11px]">
                        Sets all {currentHall?.columns || 0} columns in this hall to this class
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Student filling mode */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Desks & Roll Number Option:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setEditingColumn(prev =>
                        prev ? { ...prev, mode: 'FILL_STUDENTS' } : null
                      )
                    }
                    className={`p-2.5 rounded-xl text-xs font-semibold border text-left cursor-pointer transition-colors ${
                      editingColumn.mode === 'FILL_STUDENTS'
                        ? 'bg-blue-50 border-blue-500 text-blue-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">Assign Students</div>
                    <div className="text-[10px] text-slate-500">Seat registered students from database</div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingColumn(prev =>
                        prev ? { ...prev, mode: 'KEEP_ROLLS' } : null
                      )
                    }
                    className={`p-2.5 rounded-xl text-xs font-semibold border text-left cursor-pointer transition-colors ${
                      editingColumn.mode === 'KEEP_ROLLS'
                        ? 'bg-blue-50 border-blue-500 text-blue-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">Keep Existing Rolls</div>
                    <div className="text-[10px] text-slate-500">Only change class label on desks</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingColumn(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleColumnClassChange(
                    editingColumn.colNum,
                    editingColumn.customClassName,
                    editingColumn.targetScope,
                    editingColumn.mode
                  )
                }
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Apply & Update Relative Desks
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Seat Edit Modal */}
      {editingSeat && (() => {
        const cleanClass = (editingSeat.className || '').trim().toUpperCase();
        const cleanRoll = (editingSeat.rollNo || '').trim();
        const studentsOfClass = cleanClass
          ? students.filter(s => s.className.trim().toUpperCase() === cleanClass)
          : [];
        const matchedStudent = cleanClass && cleanRoll
          ? students.find(
              s => s.className.trim().toUpperCase() === cleanClass &&
                   (s.rollNo.trim() === cleanRoll || Number(s.rollNo) === Number(cleanRoll))
            )
          : null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Edit2 className="w-4 h-4 text-blue-600" />
                  <span>Edit Desk {editingSeat.seatNo} Details</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingSeat(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveSeatDetails}>
                <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                  {/* Class Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Class (कक्षा):
                    </label>
                    {settings.classes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {settings.classes.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => handleSeatClassChange(c)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                              cleanClass === c.toUpperCase()
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                    <input
                      type="text"
                      required
                      value={editingSeat.className}
                      onChange={e => handleSeatClassChange(e.target.value)}
                      placeholder="e.g. X-A"
                      className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                    />
                  </div>

                  {/* Registered Students Quick Picker */}
                  {studentsOfClass.length > 0 && (
                    <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                      <label className="block text-[11px] font-bold text-blue-900 mb-1">
                        ⚡ Quick Select Registered Student of Class {cleanClass}:
                      </label>
                      <select
                        onChange={e => {
                          const selected = students.find(s => s.studentId === e.target.value);
                          if (selected) handleSelectStudentForSeat(selected);
                        }}
                        value={matchedStudent ? matchedStudent.studentId : ''}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Choose student (auto-fills Roll & Name) --</option>
                        {studentsOfClass.map(st => (
                          <option key={st.studentId} value={st.studentId}>
                            Roll {st.rollNo} • {st.name} ({st.studentId})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Roll Number Input with Real-Time Auto-Detection */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Roll Number (रोल नंबर):
                      </label>
                      <span className="text-[10px] text-slate-500">
                        Type or change roll to auto-generate name
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={editingSeat.rollNo}
                      onChange={e => handleSeatRollChange(e.target.value)}
                      placeholder="e.g. 01"
                      className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  {/* Student Name Auto-Generation Status Banner */}
                  {matchedStudent ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-950 animate-in fade-in duration-150">
                      <span className="text-base leading-none mt-0.5">✓</span>
                      <div className="flex-1">
                        <div className="text-xs font-bold">
                          Database Match: {matchedStudent.name}
                        </div>
                        <div className="text-[10px] text-emerald-700 mt-0.5">
                          ID: <span className="font-mono font-bold">{matchedStudent.studentId}</span> • Class: {matchedStudent.className} • Roll: {matchedStudent.rollNo}
                        </div>
                      </div>
                    </div>
                  ) : cleanClass && cleanRoll ? (
                    <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 flex items-start gap-2.5 text-sky-950 animate-in fade-in duration-150">
                      <span className="text-base leading-none mt-0.5">✨</span>
                      <div className="flex-1">
                        <div className="text-xs font-bold">
                          Auto-Generated Name: {editingSeat.studentName || `Student ${cleanClass}-${cleanRoll}`}
                        </div>
                        <div className="text-[10px] text-sky-700 mt-0.5">
                          Class & Roll number selected. You can also customize the name below.
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Student Name Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Student Name (छात्र का नाम):
                    </label>
                    <input
                      type="text"
                      value={editingSeat.studentName}
                      onChange={e =>
                        setEditingSeat(prev =>
                          prev ? { ...prev, studentName: e.target.value } : null
                        )
                      }
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={handleClearSeat}
                    className="px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold cursor-pointer transition-colors"
                  >
                    Clear Desk (खाली करें)
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingSeat(null)}
                      className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Save Desk Details
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
      {/* Door & Window Configuration Modal */}
      {showDoorWindowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <DoorOpen className="w-5 h-5 text-blue-600" />
                <span>Door & Window Configuration (दरवाजा व खिड़की)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDoorWindowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] leading-relaxed">
                हॉल के हेड (ब्लैकबोर्ड के साथ) में एक तरफ दरवाजा (Door) और दूसरी तरफ खिड़की (Window) प्रदर्शित होती है। आप दोनों की दिशा और नाम आसानी से कस्टमाइज कर सकते हैं।
              </div>

              {/* Side Swap Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Door & Window Layout (दिशा):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDoorSide('LEFT');
                      setWindowSide('RIGHT');
                    }}
                    className={`p-3 rounded-xl border-2 text-left font-bold transition-all cursor-pointer ${
                      doorSide === 'LEFT'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">🚪 ⇄ 🪟</span>
                      {doorSide === 'LEFT' && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">Active</span>}
                    </div>
                    <div className="text-xs font-black">Door Left, Window Right</div>
                    <div className="text-[10px] text-slate-500 font-normal">बाईं तरफ दरवाजा, दाईं तरफ खिड़की</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDoorSide('RIGHT');
                      setWindowSide('LEFT');
                    }}
                    className={`p-3 rounded-xl border-2 text-left font-bold transition-all cursor-pointer ${
                      doorSide === 'RIGHT'
                        ? 'border-blue-600 bg-blue-50 text-blue-950 ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">🪟 ⇄ 🚪</span>
                      {doorSide === 'RIGHT' && <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-bold">Active</span>}
                    </div>
                    <div className="text-xs font-black">Window Left, Door Right</div>
                    <div className="text-[10px] text-slate-500 font-normal">बाईं तरफ खिड़की, दाईं तरफ दरवाजा</div>
                  </button>
                </div>
              </div>

              {/* Editable Label Inputs */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Door Label (दरवाजे का नाम/लेबल):
                  </label>
                  <input
                    type="text"
                    value={doorLabel}
                    onChange={e => setDoorLabel(e.target.value)}
                    placeholder="e.g. DOOR / मुख्य द्वार / GATE 1"
                    className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Window Label (खिड़की का नाम/लेबल):
                  </label>
                  <input
                    type="text"
                    value={windowLabel}
                    onChange={e => setWindowLabel(e.target.value)}
                    placeholder="e.g. WINDOW / खिड़की"
                    className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDoorWindowModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveDoorWindowConfig(doorSide, windowSide, doorLabel, windowLabel);
                  setShowDoorWindowModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Save & Apply (लागू करें)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
