import React, { useState } from 'react';
import { Building2, Plus, Edit2, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { Hall } from '../../types';

export const HallManagementView: React.FC = () => {
  const { halls, saveHall, deleteHall } = useSchool();

  const [hallId, setHallId] = useState('');
  const [hallName, setHallName] = useState('');
  const [rows, setRows] = useState<number>(5);
  const [columns, setColumns] = useState<number>(6);
  const [doorPosition, setDoorPosition] = useState('R1C1');
  const [windowPosition, setWindowPosition] = useState('R1C6, R5C6');
  const [active, setActive] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const capacity = (rows || 0) * (columns || 0);

  const handleClear = () => {
    setHallId('');
    setHallName('');
    setRows(5);
    setColumns(6);
    setDoorPosition('R1C1');
    setWindowPosition('R1C6, R5C6');
    setActive(true);
    setIsEditing(false);
    setMessage(null);
  };

  const handleEdit = (hall: Hall) => {
    setHallId(hall.hallId);
    setHallName(hall.hallName);
    setRows(hall.rows);
    setColumns(hall.columns);
    setDoorPosition(hall.doorPosition);
    setWindowPosition(hall.windowPosition);
    setActive(hall.active);
    setIsEditing(true);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete exam hall "${name}" (${id})?`)) {
      deleteHall(id);
      if (hallId === id) handleClear();
      setMessage({ type: 'success', text: `Hall ${id} deleted successfully.` });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!hallId.trim() || !hallName.trim()) {
      setMessage({ type: 'error', text: 'Hall ID and Hall Name are required.' });
      return;
    }

    if (rows <= 0 || columns <= 0) {
      setMessage({ type: 'error', text: 'Rows and Columns must be greater than zero.' });
      return;
    }

    saveHall({
      hallId: hallId.trim(),
      hallName: hallName.trim(),
      rows: Number(rows),
      columns: Number(columns),
      doorPosition: doorPosition.trim(),
      windowPosition: windowPosition.trim(),
      active
    });

    setMessage({
      type: 'success',
      text: `Hall "${hallName}" (${hallId}) with ${capacity} seats saved successfully!`
    });

    if (!isEditing) {
      handleClear();
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isEditing ? `Edit Exam Hall: ${hallId}` : 'Add New Examination Hall'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify desk dimensions (Rows × Columns) and spatial markers for Door & Window
            </p>
          </div>
          {isEditing && (
            <button
              onClick={handleClear}
              className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {message && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hall ID *
              </label>
              <input
                type="text"
                value={hallId}
                onChange={e => setHallId(e.target.value)}
                placeholder="e.g. HALL-101"
                disabled={isEditing}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 font-mono disabled:bg-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hall Name *
              </label>
              <input
                type="text"
                value={hallName}
                onChange={e => setHallName(e.target.value)}
                placeholder="e.g. Main Examination Hall - Ground Floor"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rows of Desks *
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={rows}
                onChange={e => setRows(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Columns of Desks *
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={columns}
                onChange={e => setColumns(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Calculated Capacity
              </label>
              <input
                type="text"
                value={`${capacity} Desks (Auto: ${rows}×${columns})`}
                readOnly
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Door Position
              </label>
              <input
                type="text"
                value={doorPosition}
                onChange={e => setDoorPosition(e.target.value)}
                placeholder="e.g. R1C1 or R1C1, R1C6"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Window Position
              </label>
              <input
                type="text"
                value={windowPosition}
                onChange={e => setWindowPosition(e.target.value)}
                placeholder="e.g. R1C6, R5C6"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hall Status
              </label>
              <select
                value={active ? 'true' : 'false'}
                onChange={e => setActive(e.target.value === 'true')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="true">Active (Available for Examination)</option>
                <option value="false">Inactive / Under Maintenance</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Clear
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Create Hall'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Hall Master Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Registered Examination Halls ({halls.length})
          </span>
          <span className="text-xs text-slate-500">
            Total Desks across all halls: {halls.reduce((a, b) => a + b.capacity, 0)}
          </span>
        </div>

        {halls.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No examination halls configured yet. Add your first hall above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Hall ID</th>
                  <th className="py-2.5 px-3">Hall Name</th>
                  <th className="py-2.5 px-3">Matrix (R×C)</th>
                  <th className="py-2.5 px-3">Capacity</th>
                  <th className="py-2.5 px-3">Door Positions</th>
                  <th className="py-2.5 px-3">Window Positions</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {halls.map(h => (
                  <tr key={h.hallId} className="hover:bg-blue-50/40">
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">
                      {h.hallId}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {h.hallName}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {h.rows} rows × {h.columns} cols
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                        {h.capacity} seats
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-red-700 text-[11px]">
                      {h.doorPosition || 'None'}
                    </td>
                    <td className="py-3 px-3 font-mono text-sky-700 text-[11px]">
                      {h.windowPosition || 'None'}
                    </td>
                    <td className="py-3 px-3">
                      {h.active ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[11px]">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEdit(h)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                          title="Edit Hall"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(h.hallId, h.hallName)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Delete Hall"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
