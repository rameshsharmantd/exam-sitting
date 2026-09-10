import React, { useState, useEffect } from 'react';
import { Columns3, Save, AlertTriangle, CheckCircle2, ArrowRight, Layers, Info } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';

export const HallClassMapView: React.FC = () => {
  const {
    settings,
    halls,
    getHallClasses,
    setHallClasses,
    getStudentsByClass,
    getRemainingStudentsForClass,
    getClassSeatingStatus
  } = useSchool();

  const [exam, setExam] = useState(settings.defaultExam);
  const [session, setSession] = useState(settings.defaultSession);
  const [selectedHallId, setSelectedHallId] = useState<string>('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Default hall selection
  useEffect(() => {
    if (halls.length > 0 && !selectedHallId) {
      setSelectedHallId(halls[0].hallId);
    }
  }, [halls, selectedHallId]);

  // Load mapped classes when exam, session, or hall changes
  useEffect(() => {
    if (exam && session && selectedHallId) {
      const assigned = getHallClasses(exam, session, selectedHallId);
      setSelectedClasses(assigned.map(a => a.className));
      setMessage(null);
    }
  }, [exam, session, selectedHallId, getHallClasses]);

  const activeHall = halls.find(h => h.hallId === selectedHallId);
  const seatingStatus = getClassSeatingStatus(exam, session);

  // Calculate total students remaining to seat in this hall for selected classes
  const remainingInSelected = selectedClasses.reduce((acc, cls) => {
    return acc + getRemainingStudentsForClass(exam, session, cls, selectedHallId).length;
  }, 0);

  const totalNominalEnrolled = selectedClasses.reduce((acc, cls) => {
    return acc + getStudentsByClass(cls).length;
  }, 0);

  const capacity = activeHall ? activeHall.capacity : 0;
  const willOverflow = remainingInSelected > capacity;
  const overflowCount = willOverflow ? remainingInSelected - capacity : 0;
  const willSeatCount = Math.min(remainingInSelected, capacity);

  const toggleClass = (cls: string) => {
    setSelectedClasses(prev =>
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  const handleSave = () => {
    setMessage(null);

    if (!selectedHallId) {
      setMessage({ type: 'error', text: 'Please select a hall.' });
      return;
    }

    setHallClasses(exam, session, selectedHallId, selectedClasses);
    setMessage({
      type: 'success',
      text: willOverflow
        ? `Assigned ${selectedClasses.length} classes to ${activeHall?.hallName}. ${willSeatCount} students will be seated here from R1C1, and ${overflowCount} remaining students will roll over to the next hall.`
        : `Assigned ${selectedClasses.length} classes (${remainingInSelected} students) to ${activeHall?.hallName} successfully!`
    });
  };

  return (
    <div className="space-y-6">
      {/* Multi-Hall Cascade Explanation Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
          <Layers className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-700 space-y-1">
          <div className="font-bold text-blue-950 text-sm flex items-center gap-1.5">
            <span>Multi-Hall Overflow Allocation Enabled</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">Auto-Sequence</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Assign whichever classes you want in this hall. When seating is generated, students fill desks starting from desk 1 (R1C1) up to hall capacity. If student strength exceeds capacity, the remaining students automatically roll over: simply select that class in the next hall, along with any new classes, to continue seating!
          </p>
        </div>
      </div>

      {/* Top Filter & Hall Selection */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Examination Hall Class Assignment
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select classes for each hall. Monitor remaining students and auto-overflow to subsequent halls.
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Examination
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
              Academic Session
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
              Select Examination Hall
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
        </div>

        {/* Capacity status card */}
        {activeHall && (
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              willOverflow
                ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            }`}
          >
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <Columns3 className={`w-4 h-4 ${willOverflow ? 'text-indigo-600' : 'text-emerald-600'}`} />
                <span>Hall Allocation Analysis: {activeHall.hallName}</span>
              </div>
              <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed">
                {willOverflow ? (
                  <>
                    <strong className="text-indigo-900">{willSeatCount} students</strong> will fill this hall completely from R1C1. The remaining{' '}
                    <strong className="text-amber-700">{overflowCount} students</strong> will automatically roll over to the next hall when you select these classes there.
                  </>
                ) : (
                  <>
                    All <strong className="text-emerald-900">{remainingInSelected} students</strong> from selected classes fit comfortably in this hall ({capacity - remainingInSelected} vacant desks remaining).
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="px-3 py-1.5 rounded-lg bg-white/90 border border-slate-200 text-center shadow-2xs">
                <span className="block text-[10px] uppercase font-bold text-slate-500">To Seat Here</span>
                <span className="text-base font-black text-blue-700">
                  {willSeatCount}
                </span>
              </div>
              <span className="text-slate-400 font-bold">/</span>
              <div className="px-3 py-1.5 rounded-lg bg-white/90 border border-slate-200 text-center shadow-2xs">
                <span className="block text-[10px] uppercase font-bold text-slate-500">Desk Limit</span>
                <span className="text-base font-black text-slate-900">{capacity}</span>
              </div>
              {willOverflow && (
                <>
                  <span className="text-slate-400 font-bold">+</span>
                  <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-center shadow-2xs">
                    <span className="block text-[10px] uppercase font-bold text-amber-700">Rolls to Next Hall</span>
                    <span className="text-base font-black text-amber-800">{overflowCount}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Class checkboxes grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Select Classes for {activeHall?.hallId} ({selectedClasses.length} selected)
              </label>
            </div>
            <div className="space-x-2 text-[11px]">
              <button
                type="button"
                onClick={() => setSelectedClasses(settings.classes)}
                className="text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setSelectedClasses([])}
                className="text-slate-500 hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {settings.classes.map(cls => {
              const count = getStudentsByClass(cls).length;
              const remainingForThisHall = getRemainingStudentsForClass(exam, session, cls, selectedHallId).length;
              const seatedInOtherHalls = count - remainingForThisHall;
              const isChecked = selectedClasses.includes(cls);

              return (
                <label
                  key={cls}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer select-none flex flex-col items-center justify-between min-h-[76px] ${
                    isChecked
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleClass(cls)}
                    className="sr-only"
                  />
                  <div className="w-full flex items-center justify-between">
                    <span className="text-xs font-bold">{cls}</span>
                    {seatedInOtherHalls > 0 && (
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                          isChecked ? 'bg-blue-800 text-blue-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                        title={`${seatedInOtherHalls} students already seated in previous hall`}
                      >
                        +{seatedInOtherHalls} seated
                      </span>
                    )}
                  </div>

                  <div className="mt-1 w-full text-center">
                    <span className={`block text-[10px] ${isChecked ? 'text-blue-100' : 'text-slate-500'}`}>
                      {remainingForThisHall > 0 ? (
                        <span className="font-semibold">{remainingForThisHall} to seat</span>
                      ) : (
                        <span className={isChecked ? 'text-emerald-200 font-bold' : 'text-emerald-600 font-bold'}>
                          ✓ All Seated
                        </span>
                      )}
                    </span>
                    <span className={`block text-[9px] ${isChecked ? 'text-blue-200/70' : 'text-slate-400'}`}>
                      Total: {count}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Action button */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Students already seated in other halls will not be duplicated.</span>
          </div>

          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer justify-center"
          >
            <Save className="w-4 h-4" />
            <span>Save Class Assignment for {activeHall?.hallId}</span>
          </button>
        </div>
      </div>

      {/* Hall Assignment Overview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            All Halls Multi-Allocation Status for {exam} ({session})
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Sequential Seating Pipeline
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                <th className="py-2.5 px-3">Hall ID</th>
                <th className="py-2.5 px-3">Hall Name</th>
                <th className="py-2.5 px-3">Assigned Classes</th>
                <th className="py-2.5 px-3">Available To Seat</th>
                <th className="py-2.5 px-3">Desk Capacity</th>
                <th className="py-2.5 px-3">Allocation Flow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {halls.map(h => {
                const mapped = getHallClasses(exam, session, h.hallId);
                const classNames = mapped.map(m => m.className);
                const toSeat = classNames.reduce(
                  (acc, c) => acc + getRemainingStudentsForClass(exam, session, c, h.hallId).length,
                  0
                );
                const fillsHall = toSeat >= h.capacity;
                const overflow = Math.max(0, toSeat - h.capacity);

                return (
                  <tr key={h.hallId} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {h.hallId}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {h.hallName}
                    </td>
                    <td className="py-2.5 px-3">
                      {classNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {classNames.map(c => (
                            <span
                              key={c}
                              className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None assigned</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {toSeat}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      {h.capacity}
                    </td>
                    <td className="py-2.5 px-3">
                      {classNames.length === 0 ? (
                        <span className="text-slate-400 text-[11px]">Unassigned</span>
                      ) : overflow > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold text-[10px]">
                          Fills {h.capacity} desks + {overflow} rolls to next hall
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[10px]">
                          All {toSeat} fit ({h.capacity - toSeat} empty desks)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
