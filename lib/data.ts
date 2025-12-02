export type AttendanceRecord = {
  date: string;
  status: "present" | "absent" | "excused";
};

export type Task = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  assignedBy?: string; // teacher id for student tasks
};

export type UserRole = "admin" | "staff" | "parent";

export type StaffPermissions = {
  viewStudents: boolean;
  editStudents: boolean;
  deleteStudents: boolean;
  viewTeachers: boolean;
  editTeachers: boolean;
  deleteTeachers: boolean;
  viewClasses: boolean;
  editClasses: boolean;
  deleteClasses: boolean;
  viewPayments: boolean;
  editPayments: boolean;
  deletePayments: boolean;
  viewStaff: boolean;
  editStaff: boolean;
  deleteStaff: boolean;
  viewMarketing: boolean;
  editMarketing: boolean;
  deleteMarketing: boolean;
  viewDashboard: boolean;
};

export type User = {
  id: string;
  username: string;
  password: string; // In production, this should be hashed
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  // For staff users
  staffId?: string;
  permissions?: StaffPermissions;
  // For parent users
  studentIds?: string[]; // Array of student IDs they can access
};

export type Student = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  classes: string[];
  hasDiscount: boolean;
  discountPercentage?: number;
  attendance: AttendanceRecord[];
  tasks: Task[];
};

export type Teacher = {
  id: string;
  name: string;
  email: string;
  phone: string;
  qualifications: string;
  subjects: string[];
  salary: number;
  classes: string[];
  hasDiscount: boolean;
  discountPercentage?: number;
  attendance: AttendanceRecord[];
};

export type Staff = {
  id: string;
  name: string;
  email: string;
  phone: string;
  salary: number;
  attendance: AttendanceRecord[];
  tasks: Task[];
};

export type AdExpense = {
  id: string;
  date: string;
  amount: number;
  platform: string;
  description?: string;
};

export type ClassItem = {
  id: string;
  subject: string;
  teacherId: string;
  studentIds: string[];
  schedule: { date: string; time: string }[];
  // Recurring weekly schedule: days of week (0=Sun..6=Sat) and a time (HH:MM)
  daysOfWeek?: number[];
  time?: string;
  fees: number;
  socialMediaActive: boolean;
  providesCertification: boolean;
  adExpenses: AdExpense[];
  classroomId?: string;
};

export type Payment = {
  id: string;
  amount: number;
  status: "paid" | "pending" | "cancelled";
  type: "student" | "teacher" | "staff";
  studentId?: string;
  teacherId?: string;
  staffId?: string;
  classId?: string;
  invoiceNumber?: string;
  date: string;
};

export type MarketingExpense = {
  id: string;
  date: string;
  amount: number;
  category: string; // e.g., "Advertising", "Materials", "Venue", "Equipment", etc.
  description: string;
  type: "in" | "out"; // money in or out
};

export type MarketingClass = {
  id: string;
  name: string;
  description: string;
  teacherIds: string[]; // can have multiple teachers
  studentIds: string[];
  fees: number; // fee per student
  profitSharingPercentage: number; // percentage that goes to teacher(s)
  centerPercentage: number; // percentage that goes to the center
  schedule: { date: string; time: string }[];
  daysOfWeek?: number[];
  time?: string;
  expenses: MarketingExpense[];
  createdAt: string;
  active: boolean;
};

export type CustomExpense = {
  id: string;
  date: string;
  amount: number;
  category: string; // e.g., "Electricity", "Markers", "Tables", "Datashow", etc.
  description: string;
  type: "monthly" | "one-time"; // whether this is a recurring monthly expense or one-time
};

export type Classroom = {
  id: string;
  name: string;
};

export type SchoolYardData = {
  students: Student[];
  teachers: Teacher[];
  staff: Staff[];
  classes: ClassItem[];
  payments: Payment[];
  marketingClasses: MarketingClass[];
  customExpenses: CustomExpense[];
  users: User[];
  classrooms: Classroom[];
};

// Empty initial data - all data will be stored in MySQL database
// Users are managed separately in MySQL via authentication system

export const emptyData: SchoolYardData = {
  students: [],
  teachers: [],
  staff: [],
  classes: [],
  payments: [],
  marketingClasses: [],
  customExpenses: [],
  users: [], // Users are now in MySQL database, not in-memory
  classrooms: [],
};

// Legacy functions kept for compatibility but return empty data
// All data should now be managed through MySQL database
export function loadData(): SchoolYardData {
  // Always return empty data - no localStorage usage
  return emptyData;
}

export function saveData(_data: SchoolYardData): void {
  // No-op - data is stored in MySQL, not localStorage
  // This function is kept for compatibility but does nothing
}

export function clearData(): void {
  // No-op - no localStorage to clear
  // This function is kept for compatibility but does nothing
}
