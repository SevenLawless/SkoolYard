"use client";

import { useEffect, useMemo } from "react";
import { useData } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

export default function DashboardPage() {
  const { data } = useData();
  const { user, hasPermission, isParent } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/");
      return;
    }
    
    // Redirect parents to their dashboard
    if (isParent()) {
      router.replace("/parent");
      return;
    }
    
    // Check dashboard view permission
    if (!hasPermission("viewDashboard")) {
      router.replace("/students");
    }
  }, [user, isParent, hasPermission, router]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Attendance stats for today
    const studentsPresent = data.students.filter(s => 
      s.attendance.some(a => a.date === today && a.status === "present")
    ).length;
    
    const teachersPresent = data.teachers.filter(t => 
      t.attendance.some(a => a.date === today && a.status === "present")
    ).length;
    
    const staffPresent = data.staff.filter(s => 
      s.attendance.some(a => a.date === today && a.status === "present")
    ).length;

    // Pending tasks
    const allTasks = [
      ...data.students.flatMap(s => s.tasks || []),
      ...data.staff.flatMap(s => s.tasks || []),
    ];
    const pendingTasks = allTasks.filter(t => !t.completed).length;
    const overdueTasks = allTasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length;

    return {
      totalStudents: data.students.length,
      totalTeachers: data.teachers.length,
      totalStaff: data.staff.length,
      totalClasses: data.classes.length,
      studentsPresent,
      teachersPresent,
      staffPresent,
      pendingTasks,
      overdueTasks,
    };
  }, [data]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ label: "Dashboard" }]} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title text-gradient">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user.name}!</p>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-700">Students</div>
              <div className="text-3xl font-bold text-blue-900 mt-2">{stats.totalStudents}</div>
              <div className="text-xs text-blue-600 mt-1">Total enrolled</div>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-purple-700">Teachers</div>
              <div className="text-3xl font-bold text-purple-900 mt-2">{stats.totalTeachers}</div>
              <div className="text-xs text-purple-600 mt-1">Active instructors</div>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-700">Classes</div>
              <div className="text-3xl font-bold text-green-900 mt-2">{stats.totalClasses}</div>
              <div className="text-xs text-green-600 mt-1">Running courses</div>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-orange-700">Staff</div>
              <div className="text-3xl font-bold text-orange-900 mt-2">{stats.totalStaff}</div>
              <div className="text-xs text-orange-600 mt-1">Team members</div>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-6 border-t-4 border-t-blue-500">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Today&apos;s Attendance
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Students</span>
              <span className="text-lg font-bold text-blue-600">{stats.studentsPresent}/{stats.totalStudents}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Teachers</span>
              <span className="text-lg font-bold text-purple-600">{stats.teachersPresent}/{stats.totalTeachers}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Staff</span>
              <span className="text-lg font-bold text-green-600">{stats.staffPresent}/{stats.totalStaff}</span>
            </div>
          </div>
        </div>

        {/* Tasks Overview */}
        <div className="card p-6 border-t-4 border-t-amber-500">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Tasks
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Pending</span>
              <span className="text-lg font-bold text-amber-600">{stats.pendingTasks}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Overdue</span>
              <span className="text-lg font-bold text-red-600">{stats.overdueTasks}</span>
            </div>
            <button 
              onClick={() => router.push("/students")}
              className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
            >
              View All Tasks →
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6 border-t-4 border-t-indigo-500">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Actions
          </h2>
          <div className="space-y-2">
            <button
              onClick={() => router.push("/classes-v2")}
              className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left text-sm font-medium text-blue-700 transition-colors"
            >
              📚 Manage Classes
            </button>
            <button
              onClick={() => router.push("/students")}
              className="w-full p-3 bg-green-50 hover:bg-green-100 rounded-lg text-left text-sm font-medium text-green-700 transition-colors"
            >
              👨‍🎓 Manage Students
            </button>
            <button
              onClick={() => router.push("/marketing")}
              className="w-full p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-left text-sm font-medium text-purple-700 transition-colors"
            >
              💰 View Financials
            </button>
          </div>
        </div>
      </div>

      {/* Classes Overview */}
      <div className="card p-6">
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Active Classes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.classes.map((cls) => {
            const teacher = data.teachers.find(t => t.id === cls.teacherId);
            return (
              <div key={cls.id} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-blue-300 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{cls.subject}</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {cls.studentIds.length} students
                  </span>
                </div>
                <p className="text-sm text-gray-600">{teacher?.name || "No teacher"}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <span>⏰ {cls.time || "Not set"}</span>
                  {cls.providesCertification && (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">🎓 Cert</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
