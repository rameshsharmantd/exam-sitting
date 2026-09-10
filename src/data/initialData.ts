import { Student, Hall, HallClassMapItem, SittingArrangement, ActivityLog, SystemSettings } from '../types';
import { CONFIG } from './constants';

export const DEFAULT_SETTINGS: SystemSettings = {
  schoolName: CONFIG.SCHOOL_NAME,
  defaultExam: CONFIG.DEFAULT_EXAM,
  defaultSession: CONFIG.DEFAULT_SESSION,
  adminUsername: CONFIG.DEFAULT_ADMIN_USER,
  adminPasswordHash: CONFIG.DEFAULT_ADMIN_PASS,
  classes: CONFIG.CLASS_SHEETS,
  subtitle: "Affiliated to CBSE, New Delhi | Senior Secondary Co-Educational Institution",
  affiliation: "Affiliation No: 2130892 | School Code: 70142",
  address: "St. Albert's Enclave, Manthan Valley, Pin: 248001",
  contact: "+91-135-2654321 / 2654322",
  email: "info@stalbertsmanthanvalley.edu.in"
};

export const INITIAL_STUDENTS: Student[] = [
  // Class XA
  {
    className: "XA",
    rollNo: "01",
    name: "Aarav Sharma",
    fatherName: "Rajesh Sharma",
    gender: "Male",
    house: "Gandhi",
    category: "General",
    contact: "9876543210",
    admissionNo: "ADM-2021-101",
    studentId: "XA01",
    address: "Plot 12, Anand Nagar, Manthan Valley",
    remarks: "Class Monitor, excellent in mathematics",
    recordKey: "sec-xa-001"
  },
  {
    className: "XA",
    rollNo: "02",
    name: "Ananya Patel",
    fatherName: "Bhavesh Patel",
    gender: "Female",
    house: "Tagore",
    category: "OBC",
    contact: "9876543211",
    admissionNo: "ADM-2021-102",
    studentId: "XA02",
    address: "44 Green Meadows, Civil Lines",
    remarks: "Debate team lead",
    recordKey: "sec-xa-002"
  },
  {
    className: "XA",
    rollNo: "03",
    name: "Devansh Verma",
    fatherName: "Manoj Verma",
    gender: "Male",
    house: "Nehru",
    category: "General",
    contact: "9876543212",
    admissionNo: "ADM-2021-103",
    studentId: "XA03",
    address: "B-14 Sector 4, Manthan Valley",
    remarks: "Science club secretary",
    recordKey: "sec-xa-003"
  },
  {
    className: "XA",
    rollNo: "04",
    name: "Diya Mukherjee",
    fatherName: "Subhash Mukherjee",
    gender: "Female",
    house: "Teresa",
    category: "General",
    contact: "9876543213",
    admissionNo: "ADM-2021-104",
    studentId: "XA04",
    address: "Flat 302, Palm Heights",
    remarks: "Prefect",
    recordKey: "sec-xa-004"
  },
  {
    className: "XA",
    rollNo: "05",
    name: "Ishaan Gupta",
    fatherName: "Vikas Gupta",
    gender: "Male",
    house: "Ashoka",
    category: "General",
    contact: "9876543214",
    admissionNo: "ADM-2021-105",
    studentId: "XA05",
    address: "Near Stadium Road, Manthan Valley",
    remarks: "Sports captain - Cricket",
    recordKey: "sec-xa-005"
  },
  {
    className: "XA",
    rollNo: "06",
    name: "Kavya Singh",
    fatherName: "Dharmendra Singh",
    gender: "Female",
    house: "Subhash",
    category: "OBC",
    contact: "9876543215",
    admissionNo: "ADM-2021-106",
    studentId: "XA06",
    address: "78 Shanti Kunj, Ward 5",
    remarks: "Excellent attendance",
    recordKey: "sec-xa-006"
  },

  // Class IXA
  {
    className: "IXA",
    rollNo: "01",
    name: "Rohan Malhotra",
    fatherName: "Sanjay Malhotra",
    gender: "Male",
    house: "Gandhi",
    category: "General",
    contact: "9876543220",
    admissionNo: "ADM-2022-201",
    studentId: "IXA01",
    address: "105 Silver Oak Enclave",
    remarks: "Olympiad medalist",
    recordKey: "sec-ixa-001"
  },
  {
    className: "IXA",
    rollNo: "02",
    name: "Saanvi Joshi",
    fatherName: "Naveen Joshi",
    gender: "Female",
    house: "Tagore",
    category: "General",
    contact: "9876543221",
    admissionNo: "ADM-2022-202",
    studentId: "IXA02",
    address: "21 Garden Estate, Manthan Valley",
    remarks: "Vocal music lead",
    recordKey: "sec-ixa-002"
  },
  {
    className: "IXA",
    rollNo: "03",
    name: "Kabir Choudhary",
    fatherName: "Amit Choudhary",
    gender: "Male",
    house: "Nehru",
    category: "OBC",
    contact: "9876543222",
    admissionNo: "ADM-2022-203",
    studentId: "IXA03",
    address: "House 55, Model Town",
    remarks: "Athletics champion",
    recordKey: "sec-ixa-003"
  },
  {
    className: "IXA",
    rollNo: "04",
    name: "Pari Agarwal",
    fatherName: "Sunil Agarwal",
    gender: "Female",
    house: "Teresa",
    category: "General",
    contact: "9876543223",
    admissionNo: "ADM-2022-204",
    studentId: "IXA04",
    address: "4B Surya Tower, Main Market",
    remarks: "Art exhibition contributor",
    recordKey: "sec-ixa-004"
  },
  {
    className: "IXA",
    rollNo: "05",
    name: "Tanmay Mishra",
    fatherName: "Pramod Mishra",
    gender: "Male",
    house: "Ashoka",
    category: "General",
    contact: "9876543224",
    admissionNo: "ADM-2022-205",
    studentId: "IXA05",
    address: "Vikas Marg, Manthan Valley",
    remarks: "Good disciplined student",
    recordKey: "sec-ixa-005"
  },
  {
    className: "IXA",
    rollNo: "06",
    name: "Sneha Reddy",
    fatherName: "Venkatesh Reddy",
    gender: "Female",
    house: "Subhash",
    category: "General",
    contact: "9876543225",
    admissionNo: "ADM-2022-206",
    studentId: "IXA06",
    address: "Block C, Metro Villa",
    remarks: "Robotics club member",
    recordKey: "sec-ixa-006"
  },

  // Class VIIIA
  {
    className: "VIIIA",
    rollNo: "01",
    name: "Aditya Nair",
    fatherName: "Girish Nair",
    gender: "Male",
    house: "Gandhi",
    category: "General",
    contact: "9876543230",
    admissionNo: "ADM-2023-301",
    studentId: "VIIIA01",
    address: "Sector 9, Lake View Apartments",
    remarks: "Quiz team",
    recordKey: "sec-viiia-001"
  },
  {
    className: "VIIIA",
    rollNo: "02",
    name: "Meera Sen",
    fatherName: "Arun Sen",
    gender: "Female",
    house: "Tagore",
    category: "General",
    contact: "9876543231",
    admissionNo: "ADM-2023-302",
    studentId: "VIIIA02",
    address: "12 Rose Villa, Manthan Valley",
    remarks: "Excellent writing skills",
    recordKey: "sec-viiia-002"
  },

  // Class VA
  {
    className: "VA",
    rollNo: "01",
    name: "Vihaan Srivastava",
    fatherName: "Alok Srivastava",
    gender: "Male",
    house: "Nehru",
    category: "General",
    contact: "9876543240",
    admissionNo: "ADM-2024-401",
    studentId: "VA01",
    address: "88 Riverfront Colony",
    remarks: "Active in sports",
    recordKey: "sec-va-001"
  },
  {
    className: "VA",
    rollNo: "02",
    name: "Anvi Saxena",
    fatherName: "Deepak Saxena",
    gender: "Female",
    house: "Teresa",
    category: "General",
    contact: "9876543241",
    admissionNo: "ADM-2024-402",
    studentId: "VA02",
    address: "Sector 3, House 19",
    remarks: "Good in drawing and dance",
    recordKey: "sec-va-002"
  },

  // Class IA
  {
    className: "IA",
    rollNo: "01",
    name: "Reyansh Tiwari",
    fatherName: "Hemant Tiwari",
    gender: "Male",
    house: "Ashoka",
    category: "General",
    contact: "9876543250",
    admissionNo: "ADM-2025-501",
    studentId: "IA01",
    address: "Flat 101, Green Hills",
    remarks: "Very cheerful and punctual",
    recordKey: "sec-ia-001"
  },
  {
    className: "IA",
    rollNo: "02",
    name: "Myra Kapoor",
    fatherName: "Rohit Kapoor",
    gender: "Female",
    house: "Gandhi",
    category: "General",
    contact: "9876543251",
    admissionNo: "ADM-2025-502",
    studentId: "IA02",
    address: "B-23 Rajendra Nagar",
    remarks: "Creative and enthusiastic",
    recordKey: "sec-ia-002"
  },

  // Class NUR
  {
    className: "NUR",
    rollNo: "01",
    name: "Ayaan Kulkarni",
    fatherName: "Mahesh Kulkarni",
    gender: "Male",
    house: "Nehru",
    category: "General",
    contact: "9876543260",
    admissionNo: "ADM-2026-001",
    studentId: "NUR01",
    address: "Lane 4, Shiv Colony, Manthan Valley",
    remarks: "New admission",
    recordKey: "sec-nur-001"
  },
  {
    className: "NUR",
    rollNo: "02",
    name: "Kiara Bhatt",
    fatherName: "Gaurav Bhatt",
    gender: "Female",
    house: "Teresa",
    category: "General",
    contact: "9876543261",
    admissionNo: "ADM-2026-002",
    studentId: "NUR02",
    address: "27 Sun City, Manthan Valley",
    remarks: "Attentive in activity periods",
    recordKey: "sec-nur-002"
  }
];

export const INITIAL_HALLS: Hall[] = [
  {
    hallId: "IIIA",
    hallName: "IIIA",
    rows: 5,
    columns: 8,
    capacity: 40,
    doorPosition: "R1C1",
    windowPosition: "R1C5, R1C8",
    active: true
  },
  {
    hallId: "IIIB",
    hallName: "IIIB",
    rows: 6,
    columns: 7,
    capacity: 42,
    doorPosition: "R1C5",
    windowPosition: "R1C1",
    active: true
  },
  {
    hallId: "IV-A",
    hallName: "IV-A",
    rows: 7,
    columns: 8,
    capacity: 56,
    doorPosition: "R1C1",
    windowPosition: "R1C5",
    active: true
  },
  {
    hallId: "IV-B",
    hallName: "IV-B",
    rows: 5,
    columns: 8,
    capacity: 40,
    doorPosition: "R1C1",
    windowPosition: "R1C5",
    active: true
  },
  {
    hallId: "V-A",
    hallName: "V-A",
    rows: 6,
    columns: 8,
    capacity: 48,
    doorPosition: "R1C5",
    windowPosition: "R1C1",
    active: true
  },
  {
    hallId: "V-B",
    hallName: "V-B",
    rows: 4,
    columns: 8,
    capacity: 32,
    doorPosition: "R1C1",
    windowPosition: "R1C5",
    active: true
  },
  {
    hallId: "VI-A",
    hallName: "VI-A",
    rows: 5,
    columns: 6,
    capacity: 30,
    doorPosition: "R1C1",
    windowPosition: "R1C4",
    active: true
  },
  {
    hallId: "VI-B",
    hallName: "VI-B",
    rows: 6,
    columns: 6,
    capacity: 36,
    doorPosition: "R1C1",
    windowPosition: "R1C4",
    active: true
  },
  {
    hallId: "VII-A",
    hallName: "VII-A",
    rows: 5,
    columns: 6,
    capacity: 30,
    doorPosition: "R1C4",
    windowPosition: "R1C1",
    active: true
  },
  {
    hallId: "VII-B",
    hallName: "VII-B",
    rows: 6,
    columns: 6,
    capacity: 36,
    doorPosition: "R1C4",
    windowPosition: "R1C1",
    active: true
  },
  {
    hallId: "X-A",
    hallName: "X-A",
    rows: 6,
    columns: 6,
    capacity: 36,
    doorPosition: "R1C4",
    windowPosition: "R1C1",
    active: true
  },
  {
    hallId: "X-B",
    hallName: "X-B",
    rows: 6,
    columns: 6,
    capacity: 36,
    doorPosition: "R1C1",
    windowPosition: "R1C4",
    active: true
  },
  {
    hallId: "Digital Class-I",
    hallName: "Digital Class-I",
    rows: 7,
    columns: 6,
    capacity: 42,
    doorPosition: "R1C1",
    windowPosition: "R1C4",
    active: true
  },
  {
    hallId: "Digital Class- II",
    hallName: "Digital Class- II",
    rows: 7,
    columns: 6,
    capacity: 42,
    doorPosition: "R1C4",
    windowPosition: "R1C1",
    active: true
  },
  {
    hallId: "HALL-101",
    hallName: "Main Examination Hall - Block A",
    rows: 4,
    columns: 4,
    capacity: 16,
    doorPosition: "R1C1",
    windowPosition: "R1C4, R4C4",
    active: true
  },
  {
    hallId: "AUDITORIUM",
    hallName: "Central St. Albert Auditorium",
    rows: 6,
    columns: 6,
    capacity: 36,
    doorPosition: "R1C1, R1C6",
    windowPosition: "R6C1, R6C6",
    active: true
  }
];

export const INITIAL_HALL_CLASS_MAPS: HallClassMapItem[] = [
  {
    exam: "PA-I",
    session: "2026-27",
    hallId: "HALL-101",
    hallName: "Main Examination Hall - Block A",
    className: "XA",
    order: 1,
    active: true
  },
  {
    exam: "PA-I",
    session: "2026-27",
    hallId: "HALL-101",
    hallName: "Main Examination Hall - Block A",
    className: "IXA",
    order: 2,
    active: true
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: "act-1",
    timestamp: new Date().toISOString(),
    admin: "admin",
    action: "SYSTEM_SETUP",
    details: "School Management System initial schema and starter data initialized."
  }
];
