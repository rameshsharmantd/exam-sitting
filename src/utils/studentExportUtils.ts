import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, SystemSettings } from '../types';

export interface StudentExportOptions {
  className?: string; // 'ALL' or specific class
  session?: string;
  schoolSettings?: SystemSettings;
}

/**
 * Generates and downloads an Excel file (.xlsx) formatted with headers, metadata, and styling
 */
export function exportStudentsToExcel(
  students: Student[],
  options?: StudentExportOptions
) {
  const className = options?.className || 'ALL';
  const session = options?.session || options?.schoolSettings?.defaultSession || '2026-2027';
  const schoolName = options?.schoolSettings?.schoolName || "St. Albert's Sr. Sec. School";

  // Data rows
  const dataRows = students.map((s, index) => ({
    'S.No': index + 1,
    'Roll No': s.rollNo,
    'Student ID': s.studentId,
    'Class / Section': s.className,
    'Student Name': s.name,
    "Father's Name": s.fatherName || '—',
    'Gender': s.gender || '—',
    'Contact No': s.contact || '—',
    'Admission No': s.admissionNo || '—',
    'House': s.house || '—',
    'Category': s.category || 'General',
    'Address': s.address || '—',
    'Remarks': s.remarks || '—'
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataRows);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 8 },  // Roll
    { wch: 14 }, // Student ID
    { wch: 12 }, // Class
    { wch: 24 }, // Name
    { wch: 22 }, // Father Name
    { wch: 10 }, // Gender
    { wch: 14 }, // Contact
    { wch: 16 }, // Admission No
    { wch: 12 }, // House
    { wch: 12 }, // Category
    { wch: 30 }, // Address
    { wch: 25 }  // Remarks
  ];

  const workbook = XLSX.utils.book_new();
  const sheetTitle = className === 'ALL' ? 'All_Students' : `Class_${className}`;
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle.substring(0, 31));

  const fileName = `Student_List_${className === 'ALL' ? 'AllClasses' : `Class_${className}`}_${session}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Generates and downloads a clean, printable PDF document with school letterhead
 */
export function exportStudentsToPDF(
  students: Student[],
  options?: StudentExportOptions
) {
  const className = options?.className || 'ALL';
  const session = options?.session || options?.schoolSettings?.defaultSession || '2026-2027';
  const exam = options?.schoolSettings?.defaultExam || 'Annual Examination 2026';
  const schoolName = options?.schoolSettings?.schoolName || "ST. ALBERT'S SR. SEC. SCHOOL";
  const subtitle = options?.schoolSettings?.subtitle || 'Manthan Valley • English Medium Co-Educational Institution';
  const affiliation = options?.schoolSettings?.affiliation || 'Affiliated to Central Board of Secondary Education (CBSE)';

  // Landscape orientation allows showing all vital student columns neatly
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(schoolName.toUpperCase(), pageWidth / 2, 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`${subtitle} • ${affiliation}`, pageWidth / 2, 19, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138); // blue-900
  const titleText = className === 'ALL'
    ? `OFFICIAL STUDENT DIRECTORY - ALL CLASSES (Session: ${session})`
    : `OFFICIAL CLASS ROLL LIST - CLASS ${className} (Session: ${session})`;
  doc.text(titleText, pageWidth / 2, 25, { align: 'center' });

  // Sub metadata line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const nowStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.text(`Examination: ${exam}  |  Total Enrolled Candidates: ${students.length}  |  Generated: ${nowStr}`, pageWidth / 2, 30, { align: 'center' });

  // Draw divider line
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.line(14, 33, pageWidth - 14, 33);

  // Table columns & rows
  const headers = [
    ['S.N', 'Roll', 'Student ID', 'Class', 'Student Name', "Father's Name", 'Contact', 'Admission No', 'House', 'Category']
  ];

  const body = students.map((s, idx) => [
    idx + 1,
    s.rollNo,
    s.studentId,
    s.className,
    s.name,
    s.fatherName || '—',
    s.contact || '—',
    s.admissionNo || '—',
    s.house || '—',
    s.category || 'General'
  ]);

  autoTable(doc, {
    startY: 36,
    head: headers,
    body: body,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 64, 175], // blue-700
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [15, 23, 42]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 12, fontStyle: 'bold' },
      2: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
      3: { halign: 'center', cellWidth: 14, fontStyle: 'bold' },
      4: { cellWidth: 46, fontStyle: 'bold' },
      5: { cellWidth: 42 },
      6: { halign: 'center', cellWidth: 26 },
      7: { cellWidth: 28 },
      8: { halign: 'center', cellWidth: 20 },
      9: { halign: 'center', cellWidth: 20 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // slate-50
    },
    margin: { left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      // Footer page numbering and signatures
      const pageCount = (doc as any).internal.getNumberOfPages();
      const pageCurrent = data.pageNumber;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${pageCurrent} of ${pageCount}`,
        pageWidth - 25,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'right' }
      );
      doc.text(
        `Official Certified Register • Confidential • St. Albert's Exam Cell`,
        14,
        doc.internal.pageSize.getHeight() - 8
      );
    }
  });

  // Save PDF
  const filename = `Student_Directory_${className === 'ALL' ? 'AllClasses' : `Class_${className}`}_${session}.pdf`;
  doc.save(filename);
}

/**
 * Generates an empty CSV / Excel template for bulk student upload
 */
export function downloadBulkUploadTemplate(format: 'csv' | 'xlsx' = 'xlsx') {
  const sampleData = [
    {
      'Student Name': 'Aarav Sharma',
      'Class': 'XA',
      "Father's Name": 'Rajesh Sharma',
      'Gender': 'Male',
      'Contact No': '9876543210',
      'Admission No': 'ADM-2026-001',
      'House': 'Red',
      'Category': 'General',
      'Address': '12 Sector 4, Civil Lines',
      'Remarks': 'Prefect'
    },
    {
      'Student Name': 'Ananya Verma',
      'Class': 'XA',
      "Father's Name": 'Suresh Verma',
      'Gender': 'Female',
      'Contact No': '9876543211',
      'Admission No': 'ADM-2026-002',
      'House': 'Blue',
      'Category': 'General',
      'Address': '45 Green Avenue',
      'Remarks': ''
    },
    {
      'Student Name': 'Kabir Patel',
      'Class': 'XB',
      "Father's Name": 'Vikram Patel',
      'Gender': 'Male',
      'Contact No': '9876543212',
      'Admission No': 'ADM-2026-003',
      'House': 'Green',
      'Category': 'OBC',
      'Address': 'Station Road',
      'Remarks': ''
    }
  ];

  if (format === 'csv') {
    const headers = Object.keys(sampleData[0]).join(',');
    const rows = sampleData.map(item =>
      Object.values(item)
        .map(v => `"${v}"`)
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Bulk_Student_Upload_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 22 }, // Name
      { wch: 10 }, // Class
      { wch: 22 }, // Father
      { wch: 10 }, // Gender
      { wch: 15 }, // Contact
      { wch: 18 }, // Admission
      { wch: 10 }, // House
      { wch: 12 }, // Category
      { wch: 30 }, // Address
      { wch: 20 }  // Remarks
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students_Template');
    XLSX.writeFile(wb, 'Bulk_Student_Upload_Template.xlsx');
  }
}
