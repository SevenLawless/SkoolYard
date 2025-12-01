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

const STORAGE_KEY = "schoolyard-data-v1";

// Minimal test data - 2 teachers, 2 classes, 2 students (1 per class), 2 staff, 2 rooms

// Teachers
const teachers: Teacher[] = [
  {
    id: "tch-1",
    name: "Ahmed Hassan",
    email: "ahmed.hassan@schoolyard.com",
    phone: "+212 6 11 22 33 44",
    qualifications: "Master's in Mathematics",
    subjects: ["Mathematics"],
    salary: 2000,
    classes: ["cls-1"],
    hasDiscount: false,
    attendance: [],
  },
  {
    id: "tch-2",
    name: "Fatima Zahra",
    email: "fatima.zahra@schoolyard.com",
    phone: "+212 6 22 33 44 55",
    qualifications: "PhD in Physics",
    subjects: ["Physics"],
    salary: 2000,
    classes: ["cls-2"],
    hasDiscount: false,
    attendance: [],
  },
];

// Students (2 total - 1 per class)
const students: Student[] = [
  {
    id: "stu-1",
    name: "Omar Benali",
    email: "omar.benali@gmail.com",
    phone: "+212 6 11 22 33 44",
    address: "1 Avenue Mohammed V, Casablanca",
    dob: "2008-01-15",
    classes: ["cls-1"],
    hasDiscount: false,
    attendance: [],
    tasks: [],
  },
  {
    id: "stu-2",
    name: "Salma Cherkaoui",
    email: "salma.cherkaoui@gmail.com",
    phone: "+212 6 22 33 44 55",
    address: "2 Avenue Mohammed V, Casablanca",
    dob: "2009-02-15",
    classes: ["cls-2"],
    hasDiscount: true,
    discountPercentage: 10,
    attendance: [],
    tasks: [],
  },
];

// Staff (2 members)
const staff: Staff[] = [
  {
    id: "stf-1",
    name: "Rachid El Mansouri",
    email: "rachid.mansouri@schoolyard.com",
    phone: "+212 6 99 88 77 66",
    salary: 1500,
      attendance: [],
      tasks: [],
    },
    {
    id: "stf-2",
    name: "Karima Benchekroun",
    email: "karima.benchekroun@schoolyard.com",
    phone: "+212 6 88 77 66 55",
    salary: 1500,
      attendance: [],
      tasks: [],
    },
];

// Classes (2 classes)
const classes: ClassItem[] = [
  {
    id: "cls-1",
    subject: "Mathematics",
    teacherId: "tch-1",
    studentIds: ["stu-1"],
    schedule: [],
    daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
    time: "14:00",
    fees: 500,
    socialMediaActive: true,
    providesCertification: true,
    adExpenses: [],
    classroomId: "room-1",
  },
  {
    id: "cls-2",
    subject: "Physics",
    teacherId: "tch-2",
    studentIds: ["stu-2"],
    schedule: [],
    daysOfWeek: [2, 4], // Tue, Thu
    time: "15:00",
    fees: 550,
    socialMediaActive: true,
    providesCertification: true,
    adExpenses: [],
    classroomId: "room-2",
  },
];

// Payments (2 student payments)
const payments: Payment[] = [
  {
    id: "pay-1",
    amount: 500,
    status: "paid",
    type: "student",
    studentId: "stu-1",
    classId: "cls-1",
    invoiceNumber: "INV-0001",
    date: new Date().toISOString(),
  },
  {
    id: "pay-2",
    amount: 495, // 550 with 10% discount
    status: "pending",
    type: "student",
    studentId: "stu-2",
    classId: "cls-2",
    date: new Date().toISOString(),
  },
];

// Marketing Classes (empty for now)
const marketingClasses: MarketingClass[] = [];

// Classrooms (2 rooms)
const classrooms: Classroom[] = [
  { id: "room-1", name: "Room 101" },
  { id: "room-2", name: "Room 102" },
];

// Users (admin, staff, and parent)
const defaultStaffPermissions: StaffPermissions = {
  viewStudents: true,
  editStudents: true,
  deleteStudents: false,
  viewTeachers: true,
  editTeachers: false,
  deleteTeachers: false,
  viewClasses: true,
  editClasses: true,
  deleteClasses: false,
  viewPayments: true,
  editPayments: true,
  deletePayments: false,
  viewStaff: true,
  editStaff: false,
  deleteStaff: false,
  viewMarketing: true,
  editMarketing: false,
  deleteMarketing: false,
  viewDashboard: true,
};

const users: User[] = [
  {
    id: "usr-1",
    username: "admin",
    password: "password",
    role: "admin",
    name: "Admin User",
    email: "admin@schoolyard.com",
    phone: "+212 6 00 00 00 00",
  },
  {
    id: "usr-2",
    username: "staff1",
    password: "password",
    role: "staff",
    name: "Rachid El Mansouri",
    email: "rachid.mansouri@schoolyard.com",
    phone: "+212 6 99 88 77 66",
    staffId: "stf-1",
    permissions: defaultStaffPermissions,
  },
  {
    id: "usr-3",
    username: "parent1",
    password: "password",
    role: "parent",
    name: "Fatima Benali",
    email: "fatima.benali@gmail.com",
    phone: "+212 6 11 22 33 44",
    studentIds: ["stu-1"], // Parent of first student (Omar Benali)
  },
];

// Custom Expenses (minimal test data)
const now = new Date();
const customExpenses: CustomExpense[] = [
  {
    id: "exp-1",
    date: now.toISOString(),
    amount: 800,
    category: "Electricity",
    description: "Monthly electricity bill",
    type: "monthly",
  },
  {
    id: "exp-2",
    date: now.toISOString(),
    amount: 450,
    category: "Internet & Phone",
    description: "Monthly internet and phone services",
    type: "monthly",
  },
];

export const demoData: SchoolYardData = {
  students,
  teachers,
  staff,
  classes,
  payments,
  marketingClasses,
  customExpenses,
  users,
  classrooms,
};

export function loadData(): SchoolYardData {
  if (typeof window === "undefined") return demoData;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return demoData;
    const parsed = JSON.parse(raw) as SchoolYardData;
    
    // Migration: Ensure marketingClasses exists for old data
    if (!parsed.marketingClasses) {
      parsed.marketingClasses = [];
    }
    
    // Migration: Ensure customExpenses exists for old data
    if (!parsed.customExpenses) {
      parsed.customExpenses = [];
    }
    
    // Migration: Ensure users exists for old data
    if (!parsed.users) {
      parsed.users = users;
    }
    
    // Migration: Ensure classrooms exists for old data
    if (!parsed.classrooms) {
      parsed.classrooms = classrooms;
    }
    
    // Migration: Update payments to include new fields
    if (parsed.payments && parsed.payments.length > 0) {
      parsed.payments = parsed.payments.map((p: any) => {
        if (!p.type) {
          return {
            ...p,
            type: "student",
            date: p.date || new Date().toISOString(),
            invoiceNumber: p.status === "paid" && !p.invoiceNumber ? `INV-${p.id.slice(-4)}` : p.invoiceNumber,
          };
        }
        return p;
      });
    }
    
    return parsed;
  } catch {
    return demoData;
  }
}

export function saveData(data: SchoolYardData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function clearData(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
