"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { SchoolYardData, Student, Teacher, Staff, ClassItem, Payment, Task, AttendanceRecord, AdExpense, MarketingClass, MarketingExpense, CustomExpense, User, Classroom } from "@/lib/data";
import { emptyData } from "@/lib/data";

type DataContextValue = {
  data: SchoolYardData;
  setData: (updater: (prev: SchoolYardData) => SchoolYardData) => void;
  addStudent: (student: Omit<Student, "id">) => void;
  updateStudent: (id: string, updates: Partial<Omit<Student, "id">>) => void;
  deleteStudent: (id: string) => void;
  enrollStudentInClass: (studentId: string, classId: string) => void;
  unenrollStudentFromClass: (studentId: string, classId: string) => void;
  addStudentTask: (studentId: string, task: Omit<Task, "id">) => void;
  updateStudentTask: (studentId: string, taskId: string, updates: Partial<Task>) => void;
  deleteStudentTask: (studentId: string, taskId: string) => void;
  addStudentAttendance: (studentId: string, record: AttendanceRecord) => void;
  addTeacher: (teacher: Omit<Teacher, "id">) => void;
  updateTeacher: (id: string, updates: Partial<Omit<Teacher, "id">>) => void;
  deleteTeacher: (id: string) => void;
  addTeacherAttendance: (teacherId: string, record: AttendanceRecord) => void;
  addStaff: (staff: Omit<Staff, "id">) => void;
  updateStaff: (id: string, updates: Partial<Omit<Staff, "id">>) => void;
  deleteStaff: (id: string) => void;
  addStaffTask: (staffId: string, task: Omit<Task, "id">) => void;
  updateStaffTask: (staffId: string, taskId: string, updates: Partial<Task>) => void;
  deleteStaffTask: (staffId: string, taskId: string) => void;
  addStaffAttendance: (staffId: string, record: AttendanceRecord) => void;
  addClass: (cls: Omit<ClassItem, "id">) => void;
  updateClass: (id: string, updates: Partial<Omit<ClassItem, "id">>) => void;
  deleteClass: (id: string) => void;
  updateClassSchedule: (id: string, schedule: ClassItem["schedule"]) => void;
  setClassTeacher: (classId: string, teacherId: string | "") => void;
  addClassAdExpense: (classId: string, expense: Omit<AdExpense, "id">) => void;
  deleteClassAdExpense: (classId: string, expenseId: string) => void;
  addPayment: (payment: Omit<Payment, "id">) => void;
  updatePayment: (id: string, updates: Partial<Omit<Payment, "id">>) => void;
  deletePayment: (id: string) => void;
  addMarketingClass: (cls: Omit<MarketingClass, "id">) => void;
  updateMarketingClass: (id: string, updates: Partial<Omit<MarketingClass, "id">>) => void;
  deleteMarketingClass: (id: string) => void;
  addMarketingExpense: (classId: string, expense: Omit<MarketingExpense, "id">) => void;
  deleteMarketingExpense: (classId: string, expenseId: string) => void;
  enrollStudentInMarketingClass: (studentId: string, classId: string) => void;
  unenrollStudentFromMarketingClass: (studentId: string, classId: string) => void;
  addTeacherToMarketingClass: (teacherId: string, classId: string) => void;
  removeTeacherFromMarketingClass: (teacherId: string, classId: string) => void;
  addCustomExpense: (expense: Omit<CustomExpense, "id">) => void;
  deleteCustomExpense: (id: string) => void;
  addUser: (user: Omit<User, "id">) => void;
  updateUser: (id: string, updates: Partial<Omit<User, "id">>) => void;
  deleteUser: (id: string) => void;
  getUserByUsername: (username: string) => User | undefined;
  addClassroom: (classroom: Omit<Classroom, "id">) => void;
  updateClassroom: (id: string, updates: Partial<Omit<Classroom, "id">>) => void;
  deleteClassroom: (id: string) => void;
};

const DataContext = createContext<DataContextValue | null>(null);

function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  // Start with empty data - all data should be managed through MySQL database
  const [data, setDataState] = useState<SchoolYardData>(emptyData);

  const setData = (updater: (prev: SchoolYardData) => SchoolYardData) => {
    setDataState((prev) => updater(prev));
  };

  const addStudent = (student: Omit<Student, "id">) => {
    setData((prev) => ({
      ...prev,
      students: [...prev.students, { ...student, id: generateId("stu") }],
    }));
  };

  const updateStudent = (id: string, updates: Partial<Omit<Student, "id">>) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const deleteStudent = (id: string) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.filter((s) => s.id !== id),
      classes: prev.classes.map((c) => ({
        ...c,
        studentIds: c.studentIds.filter((sid) => sid !== id),
      })),
      payments: prev.payments.filter((p) => p.studentId !== id),
    }));
  };

  const enrollStudentInClass = (studentId: string, classId: string) => {
    setData((prev) => {
      const student = prev.students.find((s) => s.id === studentId);
      const cls = prev.classes.find((c) => c.id === classId);
      if (!student || !cls) return prev;
      const alreadyEnrolled = student.classes.includes(classId) || cls.studentIds.includes(studentId);
      if (alreadyEnrolled) return prev;

      const updatedStudents = prev.students.map((s) =>
        s.id === studentId ? { ...s, classes: [...s.classes, classId] } : s
      );
      const updatedClasses = prev.classes.map((c) =>
        c.id === classId ? { ...c, studentIds: [...c.studentIds, studentId] } : c
      );

      const hasPendingForEnrollment = prev.payments.some(
        (p) => p.type === "student" && p.studentId === studentId && p.classId === classId && p.status === "pending"
      );
      const newPayment: Payment | null = hasPendingForEnrollment
        ? null
        : { 
            id: generateId("pay"), 
            amount: cls.fees, 
            status: "pending", 
            type: "student",
            studentId, 
            classId,
            date: new Date().toISOString(),
          };

      return {
        ...prev,
        students: updatedStudents,
        classes: updatedClasses,
        payments: newPayment ? [...prev.payments, newPayment] : prev.payments,
      };
    });
  };

  const unenrollStudentFromClass = (studentId: string, classId: string) => {
    setData((prev) => {
      const updatedStudents = prev.students.map((s) =>
        s.id === studentId ? { ...s, classes: s.classes.filter((cid) => cid !== classId) } : s
      );
      const updatedClasses = prev.classes.map((c) =>
        c.id === classId ? { ...c, studentIds: c.studentIds.filter((sid) => sid !== studentId) } : c
      );

      // Remove only pending payments for this enrollment
      const updatedPayments = prev.payments.filter(
        (p) => !(p.studentId === studentId && p.classId === classId && p.status === "pending")
      );

      return { ...prev, students: updatedStudents, classes: updatedClasses, payments: updatedPayments };
    });
  };

  const addTeacher = (teacher: Omit<Teacher, "id">) => {
    setData((prev) => ({
      ...prev,
      teachers: [...prev.teachers, { ...teacher, id: generateId("tch") }],
    }));
  };

  const updateTeacher = (id: string, updates: Partial<Omit<Teacher, "id">>) => {
    setData((prev) => ({
      ...prev,
      teachers: prev.teachers.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  };

  const deleteTeacher = (id: string) => {
    setData((prev) => ({
      ...prev,
      teachers: prev.teachers.filter((t) => t.id !== id),
      classes: prev.classes.map((c) => (c.teacherId === id ? { ...c, teacherId: "" } : c)),
    }));
  };

  const addClass = (cls: Omit<ClassItem, "id">) => {
    setData((prev) => {
      const newId = generateId("cls");
      const newClass: ClassItem = { ...cls, id: newId } as ClassItem;
      const updatedTeachers = prev.teachers.map((t) =>
        t.id === newClass.teacherId ? { ...t, classes: [...t.classes, newId] } : t
      );
      return { ...prev, classes: [...prev.classes, newClass], teachers: updatedTeachers };
    });
  };

  const updateClass = (id: string, updates: Partial<Omit<ClassItem, "id">>) => {
    setData((prev) => {
      const existing = prev.classes.find((c) => c.id === id);
      if (!existing) return prev;
      const nextClass: ClassItem = { ...existing, ...updates } as ClassItem;

      let updatedTeachers = prev.teachers;
      if (updates.teacherId !== undefined && updates.teacherId !== existing.teacherId) {
        const oldTeacherId = existing.teacherId;
        const newTeacherId = updates.teacherId;
        updatedTeachers = prev.teachers.map((t) => {
          if (t.id === oldTeacherId) {
            return { ...t, classes: t.classes.filter((cid) => cid !== id) };
          }
          if (t.id === newTeacherId) {
            return { ...t, classes: t.classes.includes(id) ? t.classes : [...t.classes, id] };
          }
          return t;
        });
      }

      const updatedClasses = prev.classes.map((c) => (c.id === id ? nextClass : c));
      return { ...prev, classes: updatedClasses, teachers: updatedTeachers };
    });
  };

  const deleteClass = (id: string) => {
    setData((prev) => {
      const cls = prev.classes.find((c) => c.id === id);
      const updatedTeachers = cls
        ? prev.teachers.map((t) =>
            t.id === cls.teacherId ? { ...t, classes: t.classes.filter((cid) => cid !== id) } : t
          )
        : prev.teachers;

      const updatedPayments = prev.payments.filter((p) => p.classId !== id);

      return {
        ...prev,
        classes: prev.classes.filter((c) => c.id !== id),
        students: prev.students.map((s) => ({
          ...s,
          classes: s.classes.filter((cid) => cid !== id),
        })),
        teachers: updatedTeachers,
        payments: updatedPayments,
      };
    });
  };

  const updateClassSchedule = (id: string, schedule: ClassItem["schedule"]) => {
    setData((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => (c.id === id ? { ...c, schedule } : c)),
    }));
  };

  const setClassTeacher = (classId: string, teacherId: string | "") => {
    setData((prev) => {
      const cls = prev.classes.find((c) => c.id === classId);
      if (!cls) return prev;
      const oldTeacherId = cls.teacherId;
      const updatedClasses = prev.classes.map((c) => (c.id === classId ? { ...c, teacherId } : c));
      const updatedTeachers = prev.teachers.map((t) => {
        if (t.id === oldTeacherId && oldTeacherId) {
          return { ...t, classes: t.classes.filter((cid) => cid !== classId) };
        }
        if (teacherId && t.id === teacherId) {
          return { ...t, classes: t.classes.includes(classId) ? t.classes : [...t.classes, classId] };
        }
        return t;
      });
      return { ...prev, classes: updatedClasses, teachers: updatedTeachers };
    });
  };

  const addPayment = (payment: Omit<Payment, "id">) => {
    setData((prev) => {
      const newId = generateId("pay");
      // Generate invoice number if status is paid
      const invoiceNumber = payment.status === "paid" 
        ? `INV-${Date.now().toString().slice(-6)}-${newId.slice(-4)}`
        : undefined;
      
      const newPayment: Payment = {
        ...payment,
        id: newId,
        date: payment.date || new Date().toISOString(),
        invoiceNumber: payment.invoiceNumber || invoiceNumber,
      };
      
      return {
        ...prev,
        payments: [...prev.payments, newPayment],
      };
    });
  };

  const updatePayment = (id: string, updates: Partial<Omit<Payment, "id">>) => {
    setData((prev) => {
      return {
        ...prev,
        payments: prev.payments.map((p) => {
          if (p.id !== id) return p;
          
          // Generate invoice number if status is being changed to paid and doesn't have one
          const statusUpdate = updates.status;
          const shouldGenerateInvoice = statusUpdate === "paid" && !p.invoiceNumber;
          const invoiceNumber = shouldGenerateInvoice 
            ? `INV-${Date.now().toString().slice(-6)}-${p.id.slice(-4)}`
            : p.invoiceNumber;
          
          return {
            ...p,
            ...updates,
            invoiceNumber: updates.invoiceNumber || invoiceNumber,
            date: updates.date || p.date || new Date().toISOString(),
          };
        }),
      };
    });
  };

  const deletePayment = (id: string) => {
    setData((prev) => ({
      ...prev,
      payments: prev.payments.filter((p) => p.id !== id),
    }));
  };

  const addClassAdExpense = (classId: string, expense: Omit<AdExpense, "id">) => {
    setData((prev) => ({
      ...prev,
      classes: prev.classes.map((c) =>
        c.id === classId ? { ...c, adExpenses: [...c.adExpenses, { ...expense, id: generateId("ad") }] } : c
      ),
    }));
  };

  const deleteClassAdExpense = (classId: string, expenseId: string) => {
    setData((prev) => ({
      ...prev,
      classes: prev.classes.map((c) =>
        c.id === classId ? { ...c, adExpenses: c.adExpenses.filter((e) => e.id !== expenseId) } : c
      ),
    }));
  };

  const addStudentTask = (studentId: string, task: Omit<Task, "id">) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === studentId ? { ...s, tasks: [...s.tasks, { ...task, id: generateId("tsk") }] } : s
      ),
    }));
  };

  const updateStudentTask = (studentId: string, taskId: string, updates: Partial<Task>) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === studentId
          ? { ...s, tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)) }
          : s
      ),
    }));
  };

  const deleteStudentTask = (studentId: string, taskId: string) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === studentId ? { ...s, tasks: s.tasks.filter((t) => t.id !== taskId) } : s
      ),
    }));
  };

  const addStudentAttendance = (studentId: string, record: AttendanceRecord) => {
    setData((prev) => ({
      ...prev,
      students: prev.students.map((s) => {
        if (s.id !== studentId) return s;
        // Check if attendance for this date already exists
        const existingIndex = s.attendance.findIndex(a => a.date === record.date);
        if (existingIndex >= 0) {
          // Update existing record
          const newAttendance = [...s.attendance];
          newAttendance[existingIndex] = record;
          return { ...s, attendance: newAttendance };
        }
        // Add new record
        return { ...s, attendance: [...s.attendance, record] };
      }),
    }));
  };

  const addTeacherAttendance = (teacherId: string, record: AttendanceRecord) => {
    setData((prev) => ({
      ...prev,
      teachers: prev.teachers.map((t) => {
        if (t.id !== teacherId) return t;
        // Check if attendance for this date already exists
        const existingIndex = t.attendance.findIndex(a => a.date === record.date);
        if (existingIndex >= 0) {
          // Update existing record
          const newAttendance = [...t.attendance];
          newAttendance[existingIndex] = record;
          return { ...t, attendance: newAttendance };
        }
        // Add new record
        return { ...t, attendance: [...t.attendance, record] };
      }),
    }));
  };

  const addStaff = (staff: Omit<Staff, "id">) => {
    setData((prev) => ({
      ...prev,
      staff: [...prev.staff, { ...staff, id: generateId("stf") }],
    }));
  };

  const updateStaff = (id: string, updates: Partial<Omit<Staff, "id">>) => {
    setData((prev) => ({
      ...prev,
      staff: prev.staff.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
  };

  const deleteStaff = (id: string) => {
    setData((prev) => ({
      ...prev,
      staff: prev.staff.filter((s) => s.id !== id),
    }));
  };

  const addStaffTask = (staffId: string, task: Omit<Task, "id">) => {
    setData((prev) => ({
      ...prev,
      staff: prev.staff.map((s) =>
        s.id === staffId ? { ...s, tasks: [...s.tasks, { ...task, id: generateId("tsk") }] } : s
      ),
    }));
  };

  const updateStaffTask = (staffId: string, taskId: string, updates: Partial<Task>) => {
    setData((prev) => ({
      ...prev,
      staff: prev.staff.map((s) =>
        s.id === staffId
          ? { ...s, tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)) }
          : s
      ),
    }));
  };

  const deleteStaffTask = (staffId: string, taskId: string) => {
    setData((prev) => ({
      ...prev,
      staff: prev.staff.map((s) =>
        s.id === staffId ? { ...s, tasks: s.tasks.filter((t) => t.id !== taskId) } : s
      ),
    }));
  };

  const addStaffAttendance = (staffId: string, record: AttendanceRecord) => {
    setData((prev) => ({
      ...prev,
      staff: prev.staff.map((s) => {
        if (s.id !== staffId) return s;
        // Check if attendance for this date already exists
        const existingIndex = s.attendance.findIndex(a => a.date === record.date);
        if (existingIndex >= 0) {
          // Update existing record
          const newAttendance = [...s.attendance];
          newAttendance[existingIndex] = record;
          return { ...s, attendance: newAttendance };
        }
        // Add new record
        return { ...s, attendance: [...s.attendance, record] };
      }),
    }));
  };

  const addMarketingClass = (cls: Omit<MarketingClass, "id">) => {
    setData((prev) => ({
      ...prev,
      marketingClasses: [...prev.marketingClasses, { ...cls, id: generateId("mkt") }],
    }));
  };

  const updateMarketingClass = (id: string, updates: Partial<Omit<MarketingClass, "id">>) => {
    setData((prev) => ({
      ...prev,
      marketingClasses: prev.marketingClasses.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const deleteMarketingClass = (id: string) => {
    setData((prev) => ({
      ...prev,
      marketingClasses: prev.marketingClasses.filter((c) => c.id !== id),
    }));
  };

  const addMarketingExpense = (classId: string, expense: Omit<MarketingExpense, "id">) => {
    setData((prev) => ({
      ...prev,
      marketingClasses: prev.marketingClasses.map((c) =>
        c.id === classId ? { ...c, expenses: [...c.expenses, { ...expense, id: generateId("exp") }] } : c
      ),
    }));
  };

  const deleteMarketingExpense = (classId: string, expenseId: string) => {
    setData((prev) => ({
      ...prev,
      marketingClasses: prev.marketingClasses.map((c) =>
        c.id === classId ? { ...c, expenses: c.expenses.filter((e) => e.id !== expenseId) } : c
      ),
    }));
  };

  const enrollStudentInMarketingClass = (studentId: string, classId: string) => {
    setData((prev) => {
      const cls = prev.marketingClasses.find((c) => c.id === classId);
      if (!cls) return prev;
      if (cls.studentIds.includes(studentId)) return prev;

      return {
        ...prev,
        marketingClasses: prev.marketingClasses.map((c) =>
          c.id === classId ? { ...c, studentIds: [...c.studentIds, studentId] } : c
        ),
      };
    });
  };

  const unenrollStudentFromMarketingClass = (studentId: string, classId: string) => {
    setData((prev) => ({
      ...prev,
      marketingClasses: prev.marketingClasses.map((c) =>
        c.id === classId ? { ...c, studentIds: c.studentIds.filter((id) => id !== studentId) } : c
      ),
    }));
  };

  const addTeacherToMarketingClass = (teacherId: string, classId: string) => {
    setData((prev) => {
      const cls = prev.marketingClasses.find((c) => c.id === classId);
      if (!cls) return prev;
      if (cls.teacherIds.includes(teacherId)) return prev;

      return {
        ...prev,
        marketingClasses: prev.marketingClasses.map((c) =>
          c.id === classId ? { ...c, teacherIds: [...c.teacherIds, teacherId] } : c
        ),
      };
    });
  };

  const removeTeacherFromMarketingClass = (teacherId: string, classId: string) => {
    setData((prev) => ({
      ...prev,
      marketingClasses: prev.marketingClasses.map((c) =>
        c.id === classId ? { ...c, teacherIds: c.teacherIds.filter((id) => id !== teacherId) } : c
      ),
    }));
  };

  const addCustomExpense = (expense: Omit<CustomExpense, "id">) => {
    setData((prev) => ({
      ...prev,
      customExpenses: [...prev.customExpenses, { ...expense, id: generateId("exp") }],
    }));
  };

  const deleteCustomExpense = (id: string) => {
    setData((prev) => ({
      ...prev,
      customExpenses: prev.customExpenses.filter((e) => e.id !== id),
    }));
  };

  const addUser = (user: Omit<User, "id">) => {
    setData((prev) => ({
      ...prev,
      users: [...prev.users, { ...user, id: generateId("usr") }],
    }));
  };

  const updateUser = (id: string, updates: Partial<Omit<User, "id">>) => {
    setData((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    }));
  };

  const deleteUser = (id: string) => {
    setData((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== id),
    }));
  };

  const getUserByUsername = (username: string) => {
    return data.users.find((u) => u.username === username);
  };

  const addClassroom = (classroom: Omit<Classroom, "id">) => {
    setData((prev) => ({
      ...prev,
      classrooms: [...prev.classrooms, { ...classroom, id: generateId("room") }],
    }));
  };

  const updateClassroom = (id: string, updates: Partial<Omit<Classroom, "id">>) => {
    setData((prev) => ({
      ...prev,
      classrooms: prev.classrooms.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const deleteClassroom = (id: string) => {
    setData((prev) => ({
      ...prev,
      classrooms: prev.classrooms.filter((c) => c.id !== id),
      classes: prev.classes.map((c) => (c.classroomId === id ? { ...c, classroomId: undefined } : c)),
    }));
  };

  const value = useMemo<DataContextValue>(
    () => ({
      data,
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
    [data]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}


