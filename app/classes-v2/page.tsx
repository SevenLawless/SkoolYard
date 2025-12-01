"use client";

import { useMemo, useState, useEffect } from "react";
import { useData } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import SearchBar from "@/components/SearchBar";
import toast from "react-hot-toast";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import EmptyState from "@/components/ui/EmptyState";

export default function ClassesV2Page() {
  const { data, deleteClass } = useData();
  const router = useRouter();
  const { hasPermission, isParent } = useAuth();
  const canView = hasPermission("viewClasses");
  const canEdit = hasPermission("editClasses");
  const canDelete = hasPermission("deleteClasses");

  useEffect(() => {
    if (isParent()) {
      router.push("/parent");
      return;
    }
    if (!canView) {
      router.push("/dashboard");
      toast.error("You don't have permission to view classes");
    }
  }, [canView, isParent, router]);

  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return data.classes.filter(
      (c) => c.subject.toLowerCase().includes(q)
    );
  }, [data.classes, query]);

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "Classes v2" }]} />
        <h1 className="section-title text-gradient">Classes & Attendance Management</h1>
        <p className="muted text-sm">Comprehensive class management with student tracking and attendance monitoring</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-700 font-medium">Active Classes</div>
              <div className="text-3xl font-bold text-blue-900 mt-1">{data.classes.length}</div>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-green-700 font-medium">Total Enrollment</div>
              <div className="text-3xl font-bold text-green-900 mt-1">
                {data.classes.reduce((sum, c) => sum + c.studentIds.length, 0)}
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-purple-700 font-medium">Monthly Revenue</div>
              <div className="text-3xl font-bold text-purple-900 mt-1">
                {(() => {
                  let total = 0;
                  data.classes.forEach(cls => {
                    cls.studentIds.forEach(sid => {
                      const student = data.students.find(s => s.id === sid);
                      if (student?.hasDiscount && student.discountPercentage) {
                        total += cls.fees * (1 - student.discountPercentage / 100);
                      } else {
                        total += cls.fees;
                      }
                    });
                  });
                  return total.toFixed(0);
                })()} DH
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-orange-700 font-medium">Avg Attendance</div>
              <div className="text-3xl font-bold text-orange-900 mt-1">
                {(() => {
                  let totalPresent = 0;
                  let totalSessions = 0;
                  data.students.forEach(s => {
                    s.attendance.forEach(a => {
                      totalSessions++;
                      if (a.status === "present") totalPresent++;
                    });
                  });
                  return totalSessions > 0 ? ((totalPresent / totalSessions) * 100).toFixed(0) : 0;
                })()}%
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar placeholder="Search classes..." delayMs={0} onChange={(v) => setQuery(v)} />
        </div>
        <button
          className="btn-primary"
          onClick={() => router.push("/classes-v2/new")}
        >
          + Create New Class
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No classes found"
          description="Start by creating your first class with students and attendance tracking."
          action={<button className="btn-primary btn-lg" onClick={() => router.push("/classes-v2/new")}>Create Class</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cls) => {
            const teacher = data.teachers.find(t => t.id === cls.teacherId);
            const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const students = data.students.filter(s => cls.studentIds.includes(s.id));
            
            // Calculate attendance rate for this class
            let classAttendance = 0;
            let classSessions = 0;
            students.forEach(s => {
              s.attendance.forEach(a => {
                classSessions++;
                if (a.status === "present") classAttendance++;
              });
            });
            const attendanceRate = classSessions > 0 ? (classAttendance / classSessions) * 100 : 0;

            return (
              <div key={cls.id} className="card p-0 overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                onClick={() => router.push(`/classes-v2/${cls.id}`)}>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white">
                  <h3 className="text-xl font-bold mb-2">{cls.subject}</h3>
                  <div className="text-sm opacity-90 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {teacher?.name || "No teacher assigned"}
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  {/* Schedule */}
                  <div className="flex items-center gap-2 text-sm flex-wrap">
                    {cls.daysOfWeek?.map(d => (
                      <span key={d} className="chip text-xs bg-blue-100 text-blue-700">{dayNames[d]}</span>
                    ))}
                    <span className="text-gray-600">at {cls.time || "TBD"}</span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-xs text-gray-600">Students</div>
                      <div className="text-lg font-bold text-green-700">{cls.studentIds.length}</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <div className="text-xs text-gray-600">Fees</div>
                      <div className="text-lg font-bold text-purple-700">{cls.fees} DH</div>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded">
                      <div className="text-xs text-gray-600">Attendance</div>
                      <div className="text-lg font-bold text-orange-700">{attendanceRate.toFixed(0)}%</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      className="btn btn-sm btn-outline flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/classes-v2/${cls.id}`);
                      }}
                    >
                      View & Track
                    </button>
                    {canEdit && (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/classes-v2/${cls.id}/edit`);
                        }}
                      >
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        className="btn btn-sm btn-ghost text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete ${cls.subject}?`)) {
                            deleteClass(cls.id);
                            toast.success("Class deleted");
                          }
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

