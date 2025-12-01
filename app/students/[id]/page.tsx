"use client";

import { useEffect, useMemo, useState } from "react";
import { useData } from "@/lib/store";
import { useRouter, useParams } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import SearchBar from "@/components/SearchBar";

export default function StudentDetailPage() {
  const { data } = useData();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [searchQuery, setSearchQuery] = useState("");

  const student = useMemo(() => {
    return data.students.find((s) => s.id === id) ?? null;
  }, [data.students, id]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return data.students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q)
    );
  }, [data.students, searchQuery]);

  const studentClasses = useMemo(() => {
    if (!student) return [];
    return data.classes.filter(c => student.classes.includes(c.id));
  }, [data.classes, student]);

  const studentPayments = useMemo(() => {
    if (!student) return [];
    return data.payments.filter(p => p.studentId === student.id);
  }, [data.payments, student]);

  const totalFees = useMemo(() => {
    return studentClasses.reduce((sum, cls) => {
      let fee = cls.fees;
      if (student?.hasDiscount && student.discountPercentage) {
        fee = fee * (1 - student.discountPercentage / 100);
      }
      return sum + fee;
    }, 0);
  }, [studentClasses, student]);

  const paidAmount = useMemo(() => {
    return studentPayments.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  }, [studentPayments]);

  const pendingAmount = useMemo(() => {
    return studentPayments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);
  }, [studentPayments]);

  const attendanceStats = useMemo(() => {
    if (!student) return { present: 0, absent: 0, excused: 0, total: 0 };
    const present = student.attendance.filter(a => a.status === "present").length;
    const absent = student.attendance.filter(a => a.status === "absent").length;
    const excused = student.attendance.filter(a => a.status === "excused").length;
    return { present, absent, excused, total: student.attendance.length };
  }, [student]);

  const tasks = useMemo(() => {
    if (!student) return { pending: 0, completed: 0, overdue: 0 };
    const pending = student.tasks.filter(t => !t.completed).length;
    const completed = student.tasks.filter(t => t.completed).length;
    const overdue = student.tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length;
    return { pending, completed, overdue };
  }, [student]);

  useEffect(() => {
    if (!student && id) {
      router.push("/students");
    }
  }, [student, id, router]);

  if (!student) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-700">Student not found</h2>
          <p className="text-gray-500 mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Left Sidebar - Student List */}
      <div className="w-80 flex-shrink-0 space-y-4">
        <div className="card p-4 sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">All Students</h2>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => router.push("/students")}
              title="Back to Students"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-4">
            <SearchBar 
              placeholder="Search students..." 
              onChange={setSearchQuery} 
              delayMs={200}
            />
          </div>

          <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
            {filteredStudents.map((s) => {
              const sClasses = data.classes.filter(c => s.classes.includes(c.id));
              const sPayments = data.payments.filter(p => p.studentId === s.id);
              const pendingPayments = sPayments.filter(p => p.status === "pending");
              const paidPayments = sPayments.filter(p => p.status === "paid");
              
              return (
                <button
                  key={s.id}
                  onClick={() => router.push(`/students/${s.id}`)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    s.id === id
                      ? "bg-blue-50 border-2 border-blue-500 shadow-sm"
                      : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                  }`}
                >
                  <div className="font-medium text-gray-900 truncate">{s.name}</div>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {s.classes.length} {s.classes.length === 1 ? 'class' : 'classes'}
                    </span>
                    {pendingPayments.length > 0 ? (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                        {pendingPayments.length} pending
                      </span>
                    ) : paidPayments.length > 0 ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        ✓ Paid
                      </span>
                    ) : null}
                    {s.hasDiscount && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        {s.discountPercentage}% off
                      </span>
                    )}
                  </div>
                  {sClasses.length > 0 && (
                    <div className="text-xs text-gray-600 mt-1 truncate">
                      {sClasses.map(c => c.subject).join(', ')}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6 overflow-y-auto">
      {/* Header */}
      <div>
        <Breadcrumbs 
          items={[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/students", label: "Students" },
            { label: student.name }
          ]} 
        />
        <div className="flex items-start justify-between gap-4 mt-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
              {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="section-title text-gradient">{student.name}</h1>
              <p className="text-gray-600 mt-1">Born: {student.dob}</p>
              {student.hasDiscount && student.discountPercentage && (
                <span className="mt-2 inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {student.discountPercentage}% Discount Applied
                </span>
              )}
            </div>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => router.push("/students")}
          >
            ← Back to Students
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-blue-700 font-medium mb-2">Enrolled Classes</div>
              {studentClasses.length > 0 ? (
                <div className="space-y-1">
                  {studentClasses.map((cls) => (
                    <div key={cls.id} className="text-sm font-semibold text-blue-900 truncate" title={cls.subject}>
                      • {cls.subject}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-blue-600">No classes</div>
              )}
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-green-700 font-medium">Monthly Payment</div>
              <div className="text-2xl font-bold text-green-900">{totalFees.toFixed(2)} DH</div>
              <div className="text-xs text-green-600 mt-1">Total monthly fees</div>
              {student.hasDiscount && student.discountPercentage && (
                <div className="text-xs text-green-700 mt-1 font-medium">
                  ({student.discountPercentage}% discount applied)
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-l-yellow-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-yellow-700 font-medium">Unpaid Amount</div>
              <div className="text-2xl font-bold text-yellow-900">{pendingAmount.toFixed(2)} DH</div>
              <div className="text-xs text-yellow-600 mt-1">Still pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Contact Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </div>
            <div className="font-medium text-gray-900">{student.email}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Phone
            </div>
            <div className="font-medium text-gray-900">{student.phone}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Address
            </div>
            <div className="font-medium text-gray-900">{student.address}</div>
          </div>
        </div>
      </div>

      {/* Attendance & Tasks Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Attendance Summary
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xs text-green-700 font-medium mb-1">Present</div>
              <div className="text-2xl font-bold text-green-800">{attendanceStats.present}</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-xs text-red-700 font-medium mb-1">Absent</div>
              <div className="text-2xl font-bold text-red-800">{attendanceStats.absent}</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-xs text-yellow-700 font-medium mb-1">Excused</div>
              <div className="text-2xl font-bold text-yellow-800">{attendanceStats.excused}</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xs text-blue-700 font-medium mb-1">Total</div>
              <div className="text-2xl font-bold text-blue-800">{attendanceStats.total}</div>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Tasks Summary
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-xs text-yellow-700 font-medium mb-1">Pending</div>
              <div className="text-2xl font-bold text-yellow-800">{tasks.pending}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xs text-green-700 font-medium mb-1">Completed</div>
              <div className="text-2xl font-bold text-green-800">{tasks.completed}</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-xs text-red-700 font-medium mb-1">Overdue</div>
              <div className="text-2xl font-bold text-red-800">{tasks.overdue}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Classes */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Enrolled Classes ({studentClasses.length})
        </h2>
        
        {studentClasses.length > 0 ? (
          <div className="space-y-3">
            {studentClasses.map((cls) => {
              const teacher = data.teachers.find(t => t.id === cls.teacherId);
              const payment = studentPayments.find(p => p.classId === cls.id);
              let fee = cls.fees;
              if (student.hasDiscount && student.discountPercentage) {
                fee = fee * (1 - student.discountPercentage / 100);
              }

              return (
                <div 
                  key={cls.id}
                  className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all cursor-pointer"
                  onClick={() => router.push(`/marketing/${cls.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{cls.subject}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          payment?.status === "paid" 
                            ? "bg-green-100 text-green-800 border border-green-300" 
                            : payment?.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                            : "bg-gray-100 text-gray-800 border border-gray-300"
                        }`}>
                          {payment?.status === "paid" ? "✓ Paid" : payment?.status === "pending" ? "⏱ Pending" : "✕ Cancelled"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {teacher && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {teacher.name}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {cls.time || "Not set"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Monthly Fee</div>
                      <div className="text-lg font-bold text-gray-900">{fee.toFixed(2)} DH</div>
                      {student.hasDiscount && student.discountPercentage && (
                        <div className="text-xs text-green-600">{student.discountPercentage}% off</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-lg">Not enrolled in any classes</p>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Payment History ({studentPayments.length})
        </h2>
        
        {studentPayments.length > 0 ? (
          <div className="space-y-2">
            {studentPayments.map((payment) => {
              const cls = data.classes.find(c => c.id === payment.classId);
              return (
                <div 
                  key={payment.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{cls?.subject || "Unknown class"}</div>
                    <div className="text-xs text-gray-500">Payment ID: {payment.id}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{payment.amount.toFixed(2)} DH</div>
                    </div>
                    <span 
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        payment.status === "paid" 
                          ? "bg-green-100 text-green-800" 
                          : payment.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {payment.status === "paid" ? "✓ Paid" : payment.status === "pending" ? "⏱ Pending" : "✕ Cancelled"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>No payment records</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

