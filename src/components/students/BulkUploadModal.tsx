import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  HelpCircle,
  Trash2
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { downloadBulkUploadTemplate } from '../../utils/studentExportUtils';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClass?: string;
}

interface ParsedStudentRow {
  name: string;
  className: string;
  fatherName?: string;
  gender?: string;
  house?: string;
  category?: string;
  contact?: string;
  admissionNo?: string;
  address?: string;
  remarks?: string;
  status: 'valid' | 'invalid' | 'warning';
  error?: string;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  defaultClass
}) => {
  const { addStudentsBulk, settings } = useSchool();

  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [overrideClass, setOverrideClass] = useState<string>(
    defaultClass && defaultClass !== 'ALL' ? defaultClass : ''
  );
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    addedCount: number;
    skippedCount: number;
    warnings: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Header field normalizer
  const normalizeKey = (key: string): string => {
    return key.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      processFile(dropped);
    }
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setUploadResult(null);
    setIsProcessing(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (rawData.length === 0) {
        alert('The uploaded file contains no data rows.');
        setIsProcessing(false);
        return;
      }

      const rows: ParsedStudentRow[] = rawData.map((row) => {
        // Map various column header variations
        let name = '';
        let className = overrideClass || '';
        let fatherName = '';
        let gender = '';
        let house = '';
        let category = 'General';
        let contact = '';
        let admissionNo = '';
        let address = '';
        let remarks = '';

        for (const [k, v] of Object.entries(row)) {
          const val = String(v).trim();
          const norm = normalizeKey(k);

          if (
            norm === 'studentname' ||
            norm === 'nameofstudent' ||
            norm === 'nameofstudents' ||
            norm === 'name' ||
            norm === 'student'
          ) {
            name = val;
          } else if (
            !overrideClass &&
            (norm === 'class' || norm === 'classname' || norm === 'classsection' || norm === 'section' || norm === 'grade')
          ) {
            className = val.toUpperCase().replace(/\s+/g, '');
          } else if (
            norm === 'fathername' ||
            norm === 'fathersname' ||
            norm === 'guardian' ||
            norm === 'parentname'
          ) {
            fatherName = val;
          } else if (norm === 'gender' || norm === 'sex') {
            gender = val;
          } else if (norm === 'house') {
            house = val;
          } else if (norm === 'category' || norm === 'caste') {
            category = val || 'General';
          } else if (
            norm === 'contact' ||
            norm === 'contactno' ||
            norm === 'phone' ||
            norm === 'mobile' ||
            norm === 'mobileno'
          ) {
            contact = val;
          } else if (
            norm === 'admissionno' ||
            norm === 'admissionnumber' ||
            norm === 'admno' ||
            norm === 'admission'
          ) {
            admissionNo = val;
          } else if (norm === 'address' || norm === 'permanentaddress' || norm === 'residentialaddress') {
            address = val;
          } else if (norm === 'remarks' || norm === 'notes' || norm === 'remark') {
            remarks = val;
          }
        }

        let status: 'valid' | 'invalid' | 'warning' = 'valid';
        let error: string | undefined = undefined;

        if (!name) {
          status = 'invalid';
          error = 'Missing Student Name';
        } else if (!className && !overrideClass) {
          status = 'invalid';
          error = 'Missing Class / Section';
        }

        return {
          name,
          className: overrideClass || className,
          fatherName,
          gender,
          house,
          category,
          contact,
          admissionNo,
          address,
          remarks,
          status,
          error
        };
      });

      setParsedRows(rows);
    } catch (err: any) {
      alert(`Error reading file: ${err.message || 'Corrupted or unsupported format'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyOverrideClass = (newClass: string) => {
    setOverrideClass(newClass);
    if (parsedRows.length > 0 && newClass) {
      setParsedRows(prev =>
        prev.map(row => ({
          ...row,
          className: newClass,
          status: row.name ? 'valid' : 'invalid',
          error: row.name ? undefined : 'Missing Student Name'
        }))
      );
    }
  };

  const handleImport = () => {
    const validRows = parsedRows.filter(r => r.status !== 'invalid');
    if (validRows.length === 0) {
      alert('No valid student rows to import.');
      return;
    }

    const payload = validRows.map(r => ({
      name: r.name,
      className: r.className,
      fatherName: r.fatherName || '',
      gender: r.gender || '',
      house: r.house || '',
      category: r.category || 'General',
      contact: r.contact || '',
      admissionNo: r.admissionNo || '',
      address: r.address || '',
      remarks: r.remarks || ''
    }));

    const result = addStudentsBulk(payload, { skipDuplicates });
    setUploadResult(result);
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validCount = parsedRows.filter(r => r.status === 'valid').length;
  const invalidCount = parsedRows.filter(r => r.status === 'invalid').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Bulk Student Name & Records Upload
              </h3>
              <p className="text-xs text-slate-500">
                Upload multiple students via Excel (.xlsx, .xls) or CSV with automatic roll generation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Result Alert */}
          {uploadResult && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold flex items-start gap-3 ${
                uploadResult.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-amber-50 border border-amber-200 text-amber-900'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="font-bold text-sm">
                  {uploadResult.addedCount} students successfully imported!
                </div>
                {uploadResult.skippedCount > 0 && (
                  <div className="text-amber-800">
                    {uploadResult.skippedCount} rows were skipped due to duplicates or formatting.
                  </div>
                )}
                {uploadResult.warnings.length > 0 && (
                  <ul className="list-disc list-inside text-[11px] font-normal mt-1 max-h-24 overflow-y-auto space-y-0.5">
                    {uploadResult.warnings.slice(0, 5).map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                    {uploadResult.warnings.length > 5 && (
                      <li>...and {uploadResult.warnings.length - 5} more</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Upload Zone or Template Download */}
          {!file ? (
            <div className="space-y-4">
              {/* Drop area */}
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Click to browse or drag & drop student sheet
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports Microsoft Excel (.xlsx, .xls) and standard CSV (.csv) files
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Template Download & Options */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Need the standardized template with all fields?</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => downloadBulkUploadTemplate('xlsx')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Excel Template (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadBulkUploadTemplate('csv')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CSV Template</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File details bar */}
              <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">{file.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {parsedRows.length} rows detected • {validCount} valid • {invalidCount} invalid
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Option to assign single class to all */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-600 font-medium">Assign All to Class:</span>
                    <select
                      value={overrideClass}
                      onChange={e => handleApplyOverrideClass(e.target.value)}
                      className="px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white font-bold"
                    >
                      <option value="">Use class from file</option>
                      {settings.classes.map(cls => (
                        <option key={cls} value={cls}>
                          Class {cls}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3 w-10 text-center">#</th>
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-3">Class</th>
                      <th className="py-2 px-3">Father's Name</th>
                      <th className="py-2 px-3">Admission No</th>
                      <th className="py-2 px-3">Contact</th>
                      <th className="py-2 px-3">Gender</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={row.status === 'invalid' ? 'bg-red-50/60' : 'hover:bg-slate-50'}
                      >
                        <td className="py-1.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-1.5 px-3 font-semibold text-slate-900">
                          {row.name || <span className="text-red-600 italic">Empty Name</span>}
                        </td>
                        <td className="py-1.5 px-3 font-bold text-blue-700">
                          {row.className || <span className="text-red-600 italic">Missing</span>}
                        </td>
                        <td className="py-1.5 px-3 text-slate-600">{row.fatherName || '—'}</td>
                        <td className="py-1.5 px-3 font-mono text-slate-600">{row.admissionNo || '—'}</td>
                        <td className="py-1.5 px-3 font-mono text-slate-600">{row.contact || '—'}</td>
                        <td className="py-1.5 px-3 text-slate-600">{row.gender || '—'}</td>
                        <td className="py-1.5 px-3">
                          {row.status === 'valid' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Ready
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                              {row.error}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Options */}
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={e => setSkipDuplicates(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Skip existing students with duplicate Admission No or identical Name in same class</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Roll numbers and Student IDs will be generated automatically in strict order.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
            >
              {uploadResult ? 'Close' : 'Cancel'}
            </button>
            {file && !uploadResult && (
              <button
                type="button"
                onClick={handleImport}
                disabled={validCount === 0 || isProcessing}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Import {validCount} Students Now</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
