"use client";

import { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import type { SchoolYardData, Student, Teacher, Staff, ClassItem, Payment, Task, AttendanceRecord, AdExpense, MarketingClass, MarketingExpense, CustomExpense, User, Classroom } from "@/lib/data";
import { emptyData } from "@/lib/data";
import toast from "react-hot-toast";

type DataContextValue = {
  data: SchoolYardData;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setData: (updater: (prev: SchoolYardData) => SchoolYardData) => void;
  addStudent: (student: Omit<Student, "id">) => Promise<void>;
  updateStudent: (id: string, updates: Partial<Omit<Student, "id">>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  enrollStudentInClass: (studentId: string, classId: string) => Promise<void>;
  unenrollStudentFromClass: (studentId: string, classId: string) => Promise<void>;
  addStudentTask: (studentId: string, task: Omit<Task, "id">) => Promise<void>;
  updateStudentTask: (studentId: string, taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteStudentTask: (studentId: string, taskId: string) => Promise<void>;
  addStudentAttendance: (studentId: string, record: AttendanceRecord) => Promise<void>;
  addTeacher: (teacher: Omit<Teacher, "id">) => Promise<void>;
  updateTeacher: (id: string, updates: Partial<Omit<Teacher, "id">>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  addTeacherAttendance: (teacherId: string, record: AttendanceRecord) => Promise<void>;
  addStaff: (staff: Omit<Staff, "id">) => Promise<void>;
  updateStaff: (id: string, updates: Partial<Omit<Staff, "id">>) => Promise<void>;
  deleteStaff: (id: string) => Promise<void>;
  addStaffTask: (staffId: string, task: Omit<Task, "id">) => Promise<void>;
  updateStaffTask: (staffId: string, taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteStaffTask: (staffId: string, taskId: string) => Promise<void>;
  addStaffAttendance: (staffId: string, record: AttendanceRecord) => Promise<void>;
  addClass: (cls: Omit<ClassItem, "id">) => Promise<void>;
  updateClass: (id: string, updates: Partial<Omit<ClassItem, "id">>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  updateClassSchedule: (id: string, schedule: ClassItem["schedule"]) => Promise<void>;
  setClassTeacher: (classId: string, teacherId: string | "") => Promise<void>;
  addClassAdExpense: (classId: string, expense: Omit<AdExpense, "id">) => Promise<void>;
  deleteClassAdExpense: (classId: string, expenseId: string) => Promise<void>;
  addPayment: (payment: Omit<Payment, "id">) => Promise<void>;
  updatePayment: (id: string, updates: Partial<Omit<Payment, "id">>) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  addMarketingClass: (cls: Omit<MarketingClass, "id">) => Promise<void>;
  updateMarketingClass: (id: string, updates: Partial<Omit<MarketingClass, "id">>) => Promise<void>;
  deleteMarketingClass: (id: string) => Promise<void>;
  addMarketingExpense: (classId: string, expense: Omit<MarketingExpense, "id">) => Promise<void>;
  deleteMarketingExpense: (classId: string, expenseId: string) => Promise<void>;
  enrollStudentInMarketingClass: (studentId: string, classId: string) => Promise<void>;
  unenrollStudentFromMarketingClass: (studentId: string, classId: string) => Promise<void>;
  addTeacherToMarketingClass: (teacherId: string, classId: string) => Promise<void>;
  removeTeacherFromMarketingClass: (teacherId: string, classId: string) => Promise<void>;
  addCustomExpense: (expense: Omit<CustomExpense, "id">) => Promise<void>;
  deleteCustomExpense: (id: string) => Promise<void>;
  addUser: (user: Omit<User, "id">) => Promise<void>;
  updateUser: (id: string, updates: Partial<Omit<User, "id">>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getUserByUsername: (username: string) => User | undefined;
  addClassroom: (classroom: Omit<Classroom, "id">) => Promise<void>;
  updateClassroom: (id: string, updates: Partial<Omit<Classroom, "id">>) => Promise<void>;
  deleteClassroom: (id: string) => Promise<void>;
};

const DataContext = createContext<DataContextValue | null>(null);

// Helper function to get CSRF token
async function getCsrfToken(): Promise<string> {
  const response = await fetch('/api/auth/csrf');
  const data = await response.json();
  return data.token;
}

// Helper function to make authenticated API calls
async function apiCall(url: string, options: RequestInit = {}): Promise<Response> {
  const csrfToken = await getCsrfToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
      ...options.headers,
    },
    credentials: 'include',
  });
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setDataState] = useState<SchoolYardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data from APIs
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, teachersRes, staffRes, classesRes, paymentsRes, marketingRes, classroomsRes, expensesRes] = await Promise.all([
        fetch('/api/students').then(r => r.json()),
        fetch('/api/teachers').then(r => r.json()),
        fetch('/api/staff').then(r => r.json()),
        fetch('/api/classes').then(r => r.json()),
        fetch('/api/payments').then(r => r.json()),
        fetch('/api/marketing/classes').then(r => r.json()),
        fetch('/api/classrooms').then(r => r.json()),
        fetch('/api/expenses').then(r => r.json()),
      ]);

      setDataState({
        students: studentsRes.success ? studentsRes.students : [],
        teachers: teachersRes.success ? teachersRes.teachers : [],
        staff: staffRes.success ? staffRes.staff : [],
        classes: classesRes.success ? classesRes.classes : [],
        payments: paymentsRes.success ? paymentsRes.payments : [],
        marketingClasses: marketingRes.success ? marketingRes.classes : [],
        customExpenses: expensesRes.success ? expensesRes.expenses : [],
        users: [], // Users are managed separately via /api/admin/users
        classrooms: classroomsRes.success ? classroomsRes.classrooms : [],
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const refresh = useCallback(async () => {
    await fetchAllData();
  }, [fetchAllData]);

  const setData = (updater: (prev: SchoolYardData) => SchoolYardData) => {
    setDataState((prev) => updater(prev));
  };

  // Students
  const addStudent = async (student: Omit<Student, "id">) => {
    try {
      const response = await apiCall('/api/students', {
        method: 'POST',
        body: JSON.stringify({
          ...student,
          classes: student.classes || [],
        }),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Student added successfully');
      } else {
        throw new Error(result.error || 'Failed to add student');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add student');
      throw err;
    }
  };

  const updateStudent = async (id: string, updates: Partial<Omit<Student, "id">>) => {
    try {
      const response = await apiCall(`/api/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Student updated successfully');
      } else {
        throw new Error(result.error || 'Failed to update student');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update student');
      throw err;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const response = await apiCall(`/api/students/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Student deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete student');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete student');
      throw err;
    }
  };

  const enrollStudentInClass = async (studentId: string, classId: string) => {
    try {
      const response = await apiCall(`/api/classes/${classId}/students`, {
        method: 'POST',
        body: JSON.stringify({ studentId }),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
      } else {
        throw new Error(result.error || 'Failed to enroll student');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to enroll student');
      throw err;
    }
  };

  const unenrollStudentFromClass = async (studentId: string, classId: string) => {
    try {
      const response = await apiCall(`/api/classes/${classId}/students?studentId=${studentId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
      } else {
        throw new Error(result.error || 'Failed to unenroll student');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to unenroll student');
      throw err;
    }
  };

  const addStudentTask = async (studentId: string, task: Omit<Task, "id">) => {
    try {
      const response = await apiCall(`/api/students/${studentId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(task),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Task added successfully');
      } else {
        throw new Error(result.error || 'Failed to add task');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add task');
      throw err;
    }
  };

  const updateStudentTask = async (studentId: string, taskId: string, updates: Partial<Task>) => {
    try {
      const response = await apiCall(`/api/students/${studentId}/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Task updated successfully');
      } else {
        throw new Error(result.error || 'Failed to update task');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    }
  };

  const deleteStudentTask = async (studentId: string, taskId: string) => {
    try {
      const response = await apiCall(`/api/students/${studentId}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Task deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete task');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete task');
      throw err;
    }
  };

  const addStudentAttendance = async (studentId: string, record: AttendanceRecord) => {
    try {
      const response = await apiCall(`/api/students/${studentId}/attendance`, {
        method: 'POST',
        body: JSON.stringify(record),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
      } else {
        throw new Error(result.error || 'Failed to add attendance');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add attendance');
      throw err;
    }
  };

  // Teachers
  const addTeacher = async (teacher: Omit<Teacher, "id">) => {
    try {
      const response = await apiCall('/api/teachers', {
        method: 'POST',
        body: JSON.stringify(teacher),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Teacher added successfully');
      } else {
        throw new Error(result.error || 'Failed to add teacher');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add teacher');
      throw err;
    }
  };

  const updateTeacher = async (id: string, updates: Partial<Omit<Teacher, "id">>) => {
    try {
      const response = await apiCall(`/api/teachers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Teacher updated successfully');
      } else {
        throw new Error(result.error || 'Failed to update teacher');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update teacher');
      throw err;
    }
  };

  const deleteTeacher = async (id: string) => {
    try {
      const response = await apiCall(`/api/teachers/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Teacher deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete teacher');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete teacher');
      throw err;
    }
  };

  const addTeacherAttendance = async (teacherId: string, record: AttendanceRecord) => {
    try {
      const response = await apiCall(`/api/teachers/${teacherId}/attendance`, {
        method: 'POST',
        body: JSON.stringify(record),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
      } else {
        throw new Error(result.error || 'Failed to add attendance');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add attendance');
      throw err;
    }
  };

  // Staff
  const addStaff = async (staff: Omit<Staff, "id">) => {
    try {
      const response = await apiCall('/api/staff', {
        method: 'POST',
        body: JSON.stringify(staff),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Staff member added successfully');
      } else {
        throw new Error(result.error || 'Failed to add staff');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add staff');
      throw err;
    }
  };

  const updateStaff = async (id: string, updates: Partial<Omit<Staff, "id">>) => {
    try {
      const response = await apiCall(`/api/staff/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Staff member updated successfully');
      } else {
        throw new Error(result.error || 'Failed to update staff');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update staff');
      throw err;
    }
  };

  const deleteStaff = async (id: string) => {
    try {
      const response = await apiCall(`/api/staff/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Staff member deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete staff');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete staff');
      throw err;
    }
  };

  const addStaffTask = async (staffId: string, task: Omit<Task, "id">) => {
    try {
      const response = await apiCall(`/api/staff/${staffId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(task),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Task added successfully');
      } else {
        throw new Error(result.error || 'Failed to add task');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add task');
      throw err;
    }
  };

  const updateStaffTask = async (staffId: string, taskId: string, updates: Partial<Task>) => {
    try {
      const response = await apiCall(`/api/staff/${staffId}/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Task updated successfully');
      } else {
        throw new Error(result.error || 'Failed to update task');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    }
  };

  const deleteStaffTask = async (staffId: string, taskId: string) => {
    try {
      const response = await apiCall(`/api/staff/${staffId}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Task deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete task');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete task');
      throw err;
    }
  };

  const addStaffAttendance = async (staffId: string, record: AttendanceRecord) => {
    try {
      const response = await apiCall(`/api/staff/${staffId}/attendance`, {
        method: 'POST',
        body: JSON.stringify(record),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
      } else {
        throw new Error(result.error || 'Failed to add attendance');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add attendance');
      throw err;
    }
  };

  // Classes
  const addClass = async (cls: Omit<ClassItem, "id">) => {
    try {
      const response = await apiCall('/api/classes', {
        method: 'POST',
        body: JSON.stringify({
          ...cls,
          studentIds: cls.studentIds || [],
        }),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Class added successfully');
      } else {
        throw new Error(result.error || 'Failed to add class');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add class');
      throw err;
    }
  };

  const updateClass = async (id: string, updates: Partial<Omit<ClassItem, "id">>) => {
    try {
      const response = await apiCall(`/api/classes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Class updated successfully');
      } else {
        throw new Error(result.error || 'Failed to update class');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update class');
      throw err;
    }
  };

  const deleteClass = async (id: string) => {
    try {
      const response = await apiCall(`/api/classes/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Class deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete class');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete class');
      throw err;
    }
  };

  const updateClassSchedule = async (id: string, schedule: ClassItem["schedule"]) => {
    await updateClass(id, { schedule });
  };

  const setClassTeacher = async (classId: string, teacherId: string | "") => {
    await updateClass(classId, { teacherId: teacherId || undefined });
  };

  const addClassAdExpense = async (classId: string, expense: Omit<AdExpense, "id">) => {
    try {
      const response = await apiCall(`/api/classes/${classId}/expenses`, {
        method: 'POST',
        body: JSON.stringify(expense),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Expense added successfully');
      } else {
        throw new Error(result.error || 'Failed to add expense');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add expense');
      throw err;
    }
  };

  const deleteClassAdExpense = async (classId: string, expenseId: string) => {
    try {
      const response = await apiCall(`/api/classes/${classId}/expenses/${expenseId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Expense deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete expense');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete expense');
      throw err;
    }
  };

  // Payments
  const addPayment = async (payment: Omit<Payment, "id">) => {
    try {
      const response = await apiCall('/api/payments', {
        method: 'POST',
        body: JSON.stringify(payment),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Payment added successfully');
      } else {
        throw new Error(result.error || 'Failed to add payment');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add payment');
      throw err;
    }
  };

  const updatePayment = async (id: string, updates: Partial<Omit<Payment, "id">>) => {
    try {
      const response = await apiCall(`/api/payments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Payment updated successfully');
      } else {
        throw new Error(result.error || 'Failed to update payment');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update payment');
      throw err;
    }
  };

  const deletePayment = async (id: string) => {
    try {
      const response = await apiCall(`/api/payments/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Payment deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete payment');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete payment');
      throw err;
    }
  };

  // Marketing Classes
  const addMarketingClass = async (cls: Omit<MarketingClass, "id">) => {
    try {
      const response = await apiCall('/api/marketing/classes', {
        method: 'POST',
        body: JSON.stringify(cls),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Marketing class added successfully');
      } else {
        throw new Error(result.error || 'Failed to add marketing class');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add marketing class');
      throw err;
    }
  };

  const updateMarketingClass = async (id: string, updates: Partial<Omit<MarketingClass, "id">>) => {
    try {
      const response = await apiCall(`/api/marketing/classes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Marketing class updated successfully');
      } else {
        throw new Error(result.error || 'Failed to update marketing class');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update marketing class');
      throw err;
    }
  };

  const deleteMarketingClass = async (id: string) => {
    try {
      const response = await apiCall(`/api/marketing/classes/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Marketing class deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete marketing class');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete marketing class');
      throw err;
    }
  };

  const addMarketingExpense = async (classId: string, expense: Omit<MarketingExpense, "id">) => {
    try {
      const response = await apiCall(`/api/marketing/classes/${classId}/expenses`, {
        method: 'POST',
        body: JSON.stringify(expense),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Expense added successfully');
      } else {
        throw new Error(result.error || 'Failed to add expense');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add expense');
      throw err;
    }
  };

  const deleteMarketingExpense = async (classId: string, expenseId: string) => {
    try {
      const response = await apiCall(`/api/marketing/classes/${classId}/expenses/${expenseId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Expense deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete expense');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete expense');
      throw err;
    }
  };

  const enrollStudentInMarketingClass = async (studentId: string, classId: string) => {
    try {
      const response = await apiCall(`/api/marketing/classes/${classId}/students`, {
        method: 'POST',
        body: JSON.stringify({ studentId }),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
      } else {
        throw new Error(result.error || 'Failed to enroll student');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to enroll student');
      throw err;
    }
  };

  const unenrollStudentFromMarketingClass = async (studentId: string, classId: string) => {
    try {
      const response = await apiCall(`/api/marketing/classes/${classId}/students?studentId=${studentId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
      } else {
        throw new Error(result.error || 'Failed to unenroll student');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to unenroll student');
      throw err;
    }
  };

  const addTeacherToMarketingClass = async (teacherId: string, classId: string) => {
    try {
      const response = await apiCall(`/api/marketing/classes/${classId}/teachers`, {
        method: 'POST',
        body: JSON.stringify({ teacherId }),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
      } else {
        throw new Error(result.error || 'Failed to add teacher');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add teacher');
      throw err;
    }
  };

  const removeTeacherFromMarketingClass = async (teacherId: string, classId: string) => {
    try {
      const response = await apiCall(`/api/marketing/classes/${classId}/teachers?teacherId=${teacherId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
      } else {
        throw new Error(result.error || 'Failed to remove teacher');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove teacher');
      throw err;
    }
  };

  // Custom Expenses
  const addCustomExpense = async (expense: Omit<CustomExpense, "id">) => {
    try {
      const response = await apiCall('/api/expenses', {
        method: 'POST',
        body: JSON.stringify(expense),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Expense added successfully');
      } else {
        throw new Error(result.error || 'Failed to add expense');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add expense');
      throw err;
    }
  };

  const deleteCustomExpense = async (id: string) => {
    try {
      const response = await apiCall(`/api/expenses/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Expense deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete expense');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete expense');
      throw err;
    }
  };

  // Users (still using local state for compatibility, but users are managed via /api/admin/users)
  const addUser = async (user: Omit<User, "id">) => {
    // Users are managed via /api/admin/users, this is kept for compatibility
    setData((prev) => ({
      ...prev,
      users: [...prev.users, { ...user, id: `usr-${Math.random().toString(36).slice(2, 9)}` }],
    }));
  };

  const updateUser = async (id: string, updates: Partial<Omit<User, "id">>) => {
    // Users are managed via /api/admin/users, this is kept for compatibility
    setData((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    }));
  };

  const deleteUser = async (id: string) => {
    // Users are managed via /api/admin/users, this is kept for compatibility
    setData((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== id),
    }));
  };

  const getUserByUsername = (username: string) => {
    return data.users.find((u) => u.username === username);
  };

  // Classrooms
  const addClassroom = async (classroom: Omit<Classroom, "id">) => {
    try {
      const response = await apiCall('/api/classrooms', {
        method: 'POST',
        body: JSON.stringify(classroom),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Classroom added successfully');
      } else {
        throw new Error(result.error || 'Failed to add classroom');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add classroom');
      throw err;
    }
  };

  const updateClassroom = async (id: string, updates: Partial<Omit<Classroom, "id">>) => {
    try {
      const response = await apiCall(`/api/classrooms/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Classroom updated successfully');
      } else {
        throw new Error(result.error || 'Failed to update classroom');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update classroom');
      throw err;
    }
  };

  const deleteClassroom = async (id: string) => {
    try {
      const response = await apiCall(`/api/classrooms/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        await refresh();
        toast.success('Classroom deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete classroom');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete classroom');
      throw err;
    }
  };

  const value = useMemo<DataContextValue>(
    () => ({
      data,
      loading,
      error,
      refresh,
      setData,
      addStudent,
      updateStudent,
      deleteStudent,
      enrollStudentInClass,
      unenrollStudentFromClass,
      addStudentTask,
      updateStudentTask,
      deleteStudentTask,
      addStudentAttendance,
      addTeacher,
      updateTeacher,
      deleteTeacher,
      addTeacherAttendance,
      addStaff,
      updateStaff,
      deleteStaff,
      addStaffTask,
      updateStaffTask,
      deleteStaffTask,
      addStaffAttendance,
      addClass,
      updateClass,
      deleteClass,
      updateClassSchedule,
      setClassTeacher,
      addClassAdExpense,
      deleteClassAdExpense,
      addPayment,
      updatePayment,
      deletePayment,
      addMarketingClass,
      updateMarketingClass,
      deleteMarketingClass,
      addMarketingExpense,
      deleteMarketingExpense,
      enrollStudentInMarketingClass,
      unenrollStudentFromMarketingClass,
      addTeacherToMarketingClass,
      removeTeacherFromMarketingClass,
      addCustomExpense,
      deleteCustomExpense,
      addUser,
      updateUser,
      deleteUser,
      getUserByUsername,
      addClassroom,
      updateClassroom,
      deleteClassroom,
    }),
    [data, loading, error, refresh]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
