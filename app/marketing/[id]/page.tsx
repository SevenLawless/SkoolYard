"use client";

import { useEffect, useMemo } from "react";
import { useData } from "@/lib/store";
import { useRouter, useParams } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

export default function ClassDetailPage() {
  const { data } = useData();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const classItem = useMemo(() => {
    return data.classes.find((c) => c.id === id) ?? null;
  }, [data.classes, id]);

  const teacher = useMemo(() => {
    if (!classItem) return null;
    return data.teachers.find(t => t.id === classItem.teacherId) ?? null;
  }, [data.teachers, classItem]);

  const students = useMemo(() => {
    if (!classItem) return [];
    return data.students.filter(s => classItem.studentIds.includes(s.id));
  }, [data.students, classItem]);

  // Calculate financials
  const totalRevenue = classItem ? classItem.fees * classItem.studentIds.length : 0;
  const teacherSalary = teacher ? teacher.salary : 0;
  const adSpending = classItem?.adExpenses.reduce((sum, ad) => sum + ad.amount, 0) || 0;

  useEffect(() => {
    if (!classItem && id) {
      router.push("/marketing");
    }
  }, [classItem, id, router]);

  if (!classItem) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-700">Class not found</h2>
          <p className="text-gray-500 mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Breadcrumbs 
          items={[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/marketing", label: "Financials" },
            { label: classItem.subject }
          ]} 
        />
        <div className="flex items-start justify-between gap-4 mt-4">
          <div>
            <h1 className="section-title text-gradient">{classItem.subject}</h1>
            {teacher && (
              <div className="flex items-center gap-2 mt-2 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">{teacher.name}</span>
                <span className="text-sm text-gray-400">•</span>
                <span className="text-sm">{teacher.email}</span>
              </div>
            )}
          </div>
          <button
            className="btn btn-outline"
            onClick={() => router.push("/marketing")}
          >
            ← Back to Financials
          </button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-green-700 font-medium">Total Revenue</div>
              <div className="text-2xl font-bold text-green-900">{totalRevenue.toFixed(2)} DH</div>
              <div className="text-xs text-green-600 mt-1">{classItem.fees} DH × {classItem.studentIds.length} students</div>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-l-purple-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-purple-700 font-medium">Teacher Salary</div>
              <div className="text-2xl font-bold text-purple-900">{teacherSalary.toFixed(2)} DH</div>
              <div className="text-xs text-purple-600 mt-1">Monthly payment</div>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-blue-700 font-medium">Ad Spending</div>
              <div className="text-2xl font-bold text-blue-900">{adSpending.toFixed(2)} DH</div>
              <div className="text-xs text-blue-600 mt-1">Total spent on ads</div>
            </div>
          </div>
        </div>
      </div>

      {/* Class Info Card */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Class Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Schedule</div>
            <div className="font-medium text-gray-900">
              {classItem.time || "Not set"}
            </div>
            {classItem.daysOfWeek && classItem.daysOfWeek.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {classItem.daysOfWeek.map(d => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ")}
              </div>
            )}
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Certification</div>
            <div className="font-medium text-gray-900">
              {classItem.providesCertification ? "🎓 Yes" : "No"}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Social Media</div>
            <div className="font-medium text-gray-900">
              {classItem.socialMediaActive ? "✓ Active" : "Inactive"}
            </div>
          </div>
        </div>
      </div>

      {/* Students List with Payment Status */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Students & Payment Status ({students.length})
        </h2>
        
        {students.length > 0 ? (
          <div className="space-y-3">
            {students.map((student) => {
              const payment = data.payments.find(p => p.studentId === student.id && p.classId === classItem.id);
              const paymentStatus = payment?.status || "pending";
              
              return (
                <div 
                  key={student.id} 
                  className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700">
                          {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{student.name}</div>
                          <div className="text-xs text-gray-500">{student.email}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs">
                        <div>
                          <span className="text-gray-500">Phone:</span>
                          <div className="font-medium text-gray-700">{student.phone}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Address:</span>
                          <div className="font-medium text-gray-700">{student.address}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">DOB:</span>
                          <div className="font-medium text-gray-700">{student.dob}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Discount:</span>
                          <div className="font-medium text-gray-700">
                            {student.hasDiscount ? `${student.discountPercentage}%` : "No"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">This Month</div>
                        <div className="text-lg font-bold text-gray-900">
                          {student.hasDiscount && student.discountPercentage 
                            ? (classItem.fees * (1 - student.discountPercentage / 100)).toFixed(2)
                            : classItem.fees.toFixed(2)} DH
                        </div>
                      </div>
                      <span 
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          paymentStatus === "paid" 
                            ? "bg-green-100 text-green-800 border border-green-300" 
                            : paymentStatus === "pending"
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                            : "bg-gray-100 text-gray-800 border border-gray-300"
                        }`}
                      >
                        {paymentStatus === "paid" ? "✓ Paid" : paymentStatus === "pending" ? "⏱ Pending" : "✕ Cancelled"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-lg">No students enrolled in this class</p>
          </div>
        )}
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 border-l-4 border-l-green-500">
          <div className="text-xs text-gray-600 mb-1">Paid</div>
          <div className="text-xl font-bold text-green-700">
            {data.payments.filter(p => p.classId === classItem.id && p.status === "paid").length} students
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data.payments.filter(p => p.classId === classItem.id && p.status === "paid").reduce((sum, p) => sum + p.amount, 0).toFixed(2)} DH
          </div>
        </div>
        
        <div className="card p-4 border-l-4 border-l-yellow-500">
          <div className="text-xs text-gray-600 mb-1">Pending</div>
          <div className="text-xl font-bold text-yellow-700">
            {data.payments.filter(p => p.classId === classItem.id && p.status === "pending").length} students
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data.payments.filter(p => p.classId === classItem.id && p.status === "pending").reduce((sum, p) => sum + p.amount, 0).toFixed(2)} DH
          </div>
        </div>
        
        <div className="card p-4 border-l-4 border-l-gray-400">
          <div className="text-xs text-gray-600 mb-1">Cancelled</div>
          <div className="text-xl font-bold text-gray-700">
            {data.payments.filter(p => p.classId === classItem.id && p.status === "cancelled").length} students
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data.payments.filter(p => p.classId === classItem.id && p.status === "cancelled").reduce((sum, p) => sum + p.amount, 0).toFixed(2)} DH
          </div>
        </div>
      </div>
    </div>
  );
}
