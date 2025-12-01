"use client";

import { useEffect, useMemo, useState } from "react";
import { useData } from "@/lib/store";
import { useRouter, useParams } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import SearchBar from "@/components/SearchBar";

export default function TeacherDetailPage() {
  const { data } = useData();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [searchQuery, setSearchQuery] = useState("");

  const teacher = useMemo(() => {
    return data.teachers.find((t) => t.id === id) ?? null;
  }, [data.teachers, id]);

  const filteredTeachers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return data.teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.phone.toLowerCase().includes(q) ||
        t.qualifications.toLowerCase().includes(q) ||
        t.subjects.some(s => s.toLowerCase().includes(q))
    );
  }, [data.teachers, searchQuery]);

  const teacherClasses = useMemo(() => {
    if (!teacher) return [];
    return data.classes.filter(c => c.teacherId === teacher.id);
  }, [data.classes, teacher]);

  const totalStudents = useMemo(() => {
    return teacherClasses.reduce((sum, cls) => sum + cls.studentIds.length, 0);
  }, [teacherClasses]);

  const totalRevenue = useMemo(() => {
    return teacherClasses.reduce((sum, cls) => sum + (cls.fees * cls.studentIds.length), 0);
  }, [teacherClasses]);

  const attendanceStats = useMemo(() => {
    if (!teacher) return { present: 0, absent: 0, excused: 0, total: 0 };
    const present = teacher.attendance.filter(a => a.status === "present").length;
    const absent = teacher.attendance.filter(a => a.status === "absent").length;
    const excused = teacher.attendance.filter(a => a.status === "excused").length;
    return { present, absent, excused, total: teacher.attendance.length };
  }, [teacher]);

  useEffect(() => {
    if (!teacher && id) {
      router.push("/teachers");
    }
  }, [teacher, id, router]);

  if (!teacher) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-700">Teacher not found</h2>
          <p className="text-gray-500 mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Left Sidebar - Teacher List */}
      <div className="w-80 flex-shrink-0 space-y-4">
        <div className="card p-4 sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">All Teachers</h2>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => router.push("/teachers")}
              title="Back to Teachers"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-4">
            <SearchBar 
              placeholder="Search teachers..." 
              onChange={setSearchQuery} 
              delayMs={200}
            />
          </div>

          <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
            {filteredTeachers.map((t) => {
              const tClasses = data.classes.filter(c => c.teacherId === t.id);
              const totalStudents = tClasses.reduce((sum, cls) => sum + cls.studentIds.length, 0);
              
              return (
                <button
                  key={t.id}
                  onClick={() => router.push(`/teachers/${t.id}`)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    t.id === id
                      ? "bg-purple-50 border-2 border-purple-500 shadow-sm"
                      : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                  }`}
                >
                  <div className="font-medium text-gray-900 truncate">{t.name}</div>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {tClasses.length} {tClasses.length === 1 ? 'class' : 'classes'}
                    </span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      {totalStudents} students
                    </span>
                  </div>
                  {t.subjects.length > 0 && (
                    <div className="text-xs text-gray-600 mt-1 truncate">
                      {t.subjects.join(', ')}
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
            { href: "/teachers", label: "Teachers" },
            { label: teacher.name }
          ]} 
        />
        <div className="flex items-start justify-between gap-4 mt-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
              {teacher.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="section-title text-gradient">{teacher.name}</h1>
              <p className="text-gray-600 mt-1">{teacher.qualifications}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {teacher.subjects.map((subject) => (
                  <span key={subject} className="chip bg-purple-100 text-purple-800">
                    {subject}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => router.push("/teachers")}
          >
            ← Back to Teachers
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
              <div className="text-sm text-blue-700 font-medium mb-2">Teaching Classes</div>
              {teacherClasses.length > 0 ? (
                <div className="space-y-1">
                  {teacherClasses.map((cls) => (
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

        <div className="card p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-l-purple-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-purple-700 font-medium">Monthly Salary</div>
              <div className="text-2xl font-bold text-purple-900">{teacher.salary.toFixed(2)} DH</div>
              <div className="text-xs text-purple-600 mt-1">Fixed payment</div>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-green-700 font-medium">Total Students</div>
              <div className="text-2xl font-bold text-green-900">{totalStudents}</div>
              <div className="text-xs text-green-600 mt-1">Across all classes</div>
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
            <div className="font-medium text-gray-900">{teacher.email}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Phone
            </div>
            <div className="font-medium text-gray-900">{teacher.phone}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Qualifications</div>
            <div className="font-medium text-gray-900">{teacher.qualifications}</div>
          </div>
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Attendance Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="text-xs text-blue-700 font-medium mb-1">Total Records</div>
            <div className="text-2xl font-bold text-blue-800">{attendanceStats.total}</div>
          </div>
        </div>
      </div>

      {/* Classes Teaching */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Classes Teaching ({teacherClasses.length})
        </h2>
        
        {teacherClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherClasses.map((cls) => (
              <div key={cls.id} className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all cursor-pointer"
                onClick={() => router.push(`/marketing/${cls.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{cls.subject}</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {cls.studentIds.length} students
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {cls.time || "Not set"}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {cls.fees.toFixed(2)} DH/student
                  </div>
                  {cls.providesCertification && (
                    <div className="flex items-center gap-2 text-green-600">
                      <span>🎓 Certification</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-lg">Not teaching any classes currently</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

