import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';

interface DuplicateWarningModalProps {
  isOpen: boolean;
  warnings: string[];
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
}

export const DuplicateWarningModal: React.FC<DuplicateWarningModalProps> = ({
  isOpen,
  warnings,
  onConfirm,
  onCancel,
  title = 'Duplicate Record Warning'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-amber-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-amber-500 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-100" />
            <span>{title}</span>
          </div>
          <button
            onClick={onCancel}
            className="text-amber-100 hover:text-white p-1 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-xs text-slate-600 mb-3 font-medium">
            The system detected potential duplicate information in the student database:
          </p>

          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {warnings.map((w, index) => (
              <div
                key={index}
                className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-start gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500 mb-5">
            Do you wish to bypass this warning and proceed anyway?
          </p>

          <div className="flex items-center justify-end gap-2.5">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel & Rectify
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Proceed Anyway</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
