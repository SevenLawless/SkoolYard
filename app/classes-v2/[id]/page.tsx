"use client";

import { useEffect, useMemo, useState } from "react";
import { useData } from "@/lib/store";
import { useRouter, useParams } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import SearchBar from "@/components/SearchBar";
import toast from "react-hot-toast";

export default function ClassV2DetailPage() {
  const { data, addStudentAttendance, enrollStudentInClass, unenrollStudentFromClass, addPayment, updatePayment } = useData();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const selectedClass = useMemo(() => {
    return data.classes.find((c) => c.id === id) ?? null;
  }, [data.classes, id]);

  const teacher = useMemo(() => {
    if (!selectedClass) return null;
    return data.teachers.find(t => t.id === selectedClass.teacherId);
  }, [selectedClass, data.teachers]);

  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    return data.students.filter(s => selectedClass.studentIds.includes(s.id));
  }, [selectedClass, data.students]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return classStudents.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  }, [classStudents, searchQuery]);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return data.students.find(s => s.id === selectedStudentId);
  }, [selectedStudentId, data.students]);

  // Auto-select first student
  useEffect(() => {
    if (classStudents.length > 0 && !selectedStudentId) {
      setSelectedStudentId(classStudents[0].id);
    }
  }, [classStudents, selectedStudentId]);

  useEffect(() => {
    if (!selectedClass && id) {
      router.push("/classes-v2");
    }
  }, [selectedClass, id, router]);

  const getClassDaysInMonth = () => {
    if (!selectedClass?.daysOfWeek) return [];
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (selectedClass.daysOfWeek.includes(date.getDay())) {
        days.push(date.toISOString().split('T')[0]);
      }
    }
    
    return days;
  };

  const changeMonth = (direction: "prev" | "next") => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const markAttendance = (studentId: string, dateStr: string, status: "present" | "absent" | "excused") => {
    const record = { date: dateStr, status };
    addStudentAttendance(studentId, record);
    toast.success(`Marked as ${status}`);
  };

  const togglePaymentStatus = (studentId: string, newStatus: "paid" | "pending" | "cancelled") => {
    const existingPayment = data.payments.find(p => p.studentId === studentId && p.classId === selectedClass?.id);
    const student = data.students.find(s => s.id === studentId);
    if (!student || !selectedClass) return;

    const amount = student.hasDiscount && student.discountPercentage
      ? selectedClass.fees * (1 - student.discountPercentage / 100)
      : selectedClass.fees;

    if (existingPayment) {
      updatePayment(existingPayment.id, { status: newStatus });
    } else {
      addPayment({
        type: "student",
        studentId,
        classId: selectedClass.id,
        amount,
        status: newStatus,
        date: new Date().toISOString(),
      });
    }
    toast.success(`Payment marked as ${newStatus}`);
  };

  if (!selectedClass) {
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

  const classDays = getClassDaysInMonth();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Student payment status
  const getStudentPayment = (studentId: string) => {
    return data.payments.find(p => p.studentId === studentId && p.classId === selectedClass.id);
  };

  // Student attendance stats
  const getStudentStats = (student: any) => {
    const totalPresent = student.attendance.filter((a: any) => a.status === "present").length;
    const totalAbsent = student.attendance.filter((a: any) => a.status === "absent").length;
    const totalExcused = student.attendance.filter((a: any) => a.status === "excused").length;
    const total = totalPresent + totalAbsent + totalExcused;
    const attendanceRate = total > 0 ? (totalPresent / total) * 100 : 0;
    const absenceRate = total > 0 ? (totalAbsent / total) * 100 : 0;
    
    return { totalPresent, totalAbsent, totalExcused, total, attendanceRate, absenceRate };
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Left Sidebar - Students List */}
      <div className="w-80 flex-shrink-0 space-y-4">
        <div className="card p-4 sticky top-4">
          <div>
            <Breadcrumbs items={[
              { href: "/dashboard", label: "Dashboard" }, 
              { href: "/classes-v2", label: "Classes v2" },
              { label: selectedClass.subject }
            ]} />
            <h2 className="text-xl font-bold text-gray-900 mt-2 mb-1">{selectedClass.subject}</h2>
            <p className="text-sm text-gray-600 mb-4">Track student attendance and payments</p>
          </div>
          
          <div className="mb-4">
            <SearchBar 
              placeholder="Search students..." 
              onChange={setSearchQuery} 
              delayMs={200}
            />
          </div>

          <div className="space-y-1 max-h-[calc(100vh-320px)] overflow-y-auto pr-2">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No students enrolled</p>
                <button
                  className="btn btn-sm btn-primary mt-2"
                  onClick={() => router.push(`/classes-v2/${id}/edit`)}
                >
                  Enroll Students
                </button>
              </div>
            ) : (
              filteredStudents.map((s) => {
                const stats = getStudentStats(s);
                const payment = getStudentPayment(s.id);
                
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStudentId(s.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      s.id === selectedStudentId
                        ? "bg-blue-50 border-2 border-blue-500 shadow-sm"
                        : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                    }`}
                  >
                    <div className="font-medium text-gray-900 truncate">{s.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        payment?.status === "paid" ? "bg-green-100 text-green-700" :
                        payment?.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {payment?.status === "paid" ? "✓ Paid" :
                         payment?.status === "pending" ? "⏱ Pending" :
                         "✕ Unpaid"}
                      </span>
                      <span className={`text-xs font-semibold ${
                        stats.attendanceRate >= 80 ? "text-green-600" :
                        stats.attendanceRate >= 60 ? "text-yellow-600" :
                        "text-red-600"
                      }`}>
                        {stats.attendanceRate.toFixed(0)}%
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-4 border-t">
            <button
              className="btn btn-outline w-full"
              onClick={() => router.push(`/classes-v2/${id}/edit`)}
            >
              Edit Class
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Student Dashboard */}
      <div className="flex-1 space-y-6 overflow-y-auto">
        {!selectedStudent ? (
          <div className="card p-12 text-center mt-20">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a Student</h3>
            <p className="text-gray-500">Choose a student from the sidebar to track their attendance and payments</p>
          </div>
        ) : (
          <>
            {/* Student Header */}
            <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-600">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-blue-900 mb-1">{selectedStudent.name}</h2>
                  <div className="text-sm text-blue-700 space-y-1">
                    <div>📧 {selectedStudent.email}</div>
                    <div>📱 {selectedStudent.phone}</div>
                  </div>
                </div>
                <button
                  className="btn btn-outline"
                  onClick={() => router.push(`/students/${selectedStudent.id}`)}
                >
                  View Full Profile →
                </button>
              </div>
            </div>

            {/* Stats Dashboard */}
            {(() => {
              const stats = getStudentStats(selectedStudent);
              const payment = getStudentPayment(selectedStudent.id);
              const fee = selectedStudent.hasDiscount && selectedStudent.discountPercentage
                ? selectedClass.fees * (1 - selectedStudent.discountPercentage / 100)
                : selectedClass.fees;

              return (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="card p-5 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500">
                    <div className="text-sm text-green-700 font-medium mb-2">Payment Status</div>
                    <div className="text-2xl font-bold text-green-900 mb-3">{fee.toFixed(0)} DH</div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => togglePaymentStatus(selectedStudent.id, "paid")}
                        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded transition-colors ${
                          payment?.status === "paid"
                            ? "bg-green-600 text-white"
                            : "bg-white text-green-700 hover:bg-green-100"
                        }`}
                      >
                        ✓ Paid
                      </button>
                      <button
                        onClick={() => togglePaymentStatus(selectedStudent.id, "pending")}
                        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded transition-colors ${
                          payment?.status === "pending"
                            ? "bg-yellow-600 text-white"
                            : "bg-white text-yellow-700 hover:bg-yellow-100"
                        }`}
                      >
                        ⏱ Pending
                      </button>
                      <button
                        onClick={() => togglePaymentStatus(selectedStudent.id, "cancelled")}
                        className={`flex-1 py-1.5 px-3 text-xs font-medium rounded transition-colors ${
                          payment?.status === "cancelled"
                            ? "bg-red-600 text-white"
                            : "bg-white text-red-700 hover:bg-red-100"
                        }`}
                      >
                        ✕ Unpaid
                      </button>
                    </div>
                  </div>

                  <div className="card p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500">
                    <div className="text-sm text-blue-700 font-medium">Attendance Rate</div>
                    <div className="text-3xl font-bold text-blue-900 mt-1">{stats.attendanceRate.toFixed(1)}%</div>
                    <div className="text-xs text-blue-600 mt-1">{stats.totalPresent} present</div>
                  </div>

                  <div className="card p-5 bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-l-red-500">
                    <div className="text-sm text-red-700 font-medium">Absence Rate</div>
                    <div className="text-3xl font-bold text-red-900 mt-1">{stats.absenceRate.toFixed(1)}%</div>
                    <div className="text-xs text-red-600 mt-1">{stats.totalAbsent} absent</div>
                  </div>

                  <div className="card p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-l-purple-500">
                    <div className="text-sm text-purple-700 font-medium">Total Sessions</div>
                    <div className="text-3xl font-bold text-purple-900 mt-1">{stats.total}</div>
                    <div className="text-xs text-purple-600 mt-1">{stats.totalExcused} excused</div>
                  </div>
                </div>
              );
            })()}

            {/* Month Navigation */}
            <div className="card p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeMonth("prev")}
                  className="btn btn-sm btn-outline"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="btn btn-sm btn-outline"
                >
                  Today
                </button>
                <button
                  onClick={() => changeMonth("next")}
                  className="btn btn-sm btn-outline"
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Attendance Calendar */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Class Days Calendar ({classDays.length} days this month)
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-100 border border-green-400 rounded"></div>
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-100 border border-red-400 rounded"></div>
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-100 border border-yellow-400 rounded"></div>
                    <span>Excused</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-50 border border-gray-300 rounded"></div>
                    <span>Not marked</span>
                  </div>
                </div>
              </div>

              {classDays.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No class days in this month</p>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {classDays.map((dateStr) => {
                    const attendance = selectedStudent.attendance.find(a => a.date === dateStr);
                    const date = new Date(dateStr);
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    
                    let bgColor = "bg-gray-50 border-gray-300";
                    if (attendance) {
                      bgColor = attendance.status === "present" ? "bg-green-100 border-green-400" :
                               attendance.status === "absent" ? "bg-red-100 border-red-400" :
                               "bg-yellow-100 border-yellow-400";
                    }

                    return (
                      <div
                        key={dateStr}
                        className={`relative p-3 border-2 rounded-lg ${bgColor} ${
                          isToday ? "ring-2 ring-blue-500 ring-offset-1" : ""
                        }`}
                      >
                        <div className="text-center mb-2">
                          <div className={`text-xs font-semibold ${isToday ? "text-blue-600" : "text-gray-900"}`}>
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {dayNames[date.getDay()]}
                          </div>
                        </div>

                        {attendance ? (
                          <div className="text-center">
                            <div className={`text-xs font-semibold ${
                              attendance.status === "present" ? "text-green-700" :
                              attendance.status === "absent" ? "text-red-700" :
                              "text-yellow-700"
                            }`}>
                              {attendance.status === "present" ? "✓ Present" :
                               attendance.status === "absent" ? "✗ Absent" :
                               "⚠ Excused"}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => markAttendance(selectedStudent.id, dateStr, "present")}
                              className="btn btn-xs bg-green-500 text-white hover:bg-green-600 text-[10px] py-1"
                              title="Mark Present"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => markAttendance(selectedStudent.id, dateStr, "absent")}
                              className="btn btn-xs bg-red-500 text-white hover:bg-red-600 text-[10px] py-1"
                              title="Mark Absent"
                            >
                              ✗
                            </button>
                            <button
                              onClick={() => markAttendance(selectedStudent.id, dateStr, "excused")}
                              className="btn btn-xs bg-yellow-500 text-white hover:bg-yellow-600 text-[10px] py-1"
                              title="Mark Excused"
                            >
                              ⚠
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

