"use client";

import { useEffect, useMemo, useState } from "react";
import { useData } from "@/lib/store";
import { useRouter, useParams } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import SearchBar from "@/components/SearchBar";

export default function StaffDetailPage() {
  const { data } = useData();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [searchQuery, setSearchQuery] = useState("");

  const staffMember = useMemo(() => {
    return data.staff.find((s) => s.id === id) ?? null;
  }, [data.staff, id]);

  const filteredStaff = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return data.staff.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q)
    );
  }, [data.staff, searchQuery]);

  const attendanceStats = useMemo(() => {
    if (!staffMember) return { present: 0, absent: 0, excused: 0, total: 0 };
    const present = staffMember.attendance.filter(a => a.status === "present").length;
    const absent = staffMember.attendance.filter(a => a.status === "absent").length;
    const excused = staffMember.attendance.filter(a => a.status === "excused").length;
    return { present, absent, excused, total: staffMember.attendance.length };
  }, [staffMember]);

  const tasks = useMemo(() => {
    if (!staffMember) return { pending: 0, completed: 0, overdue: 0 };
    const pending = staffMember.tasks.filter(t => !t.completed).length;
    const completed = staffMember.tasks.filter(t => t.completed).length;
    const overdue = staffMember.tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()).length;
    return { pending, completed, overdue };
  }, [staffMember]);

  useEffect(() => {
    if (!staffMember && id) {
      router.push("/staff");
    }
  }, [staffMember, id, router]);

  if (!staffMember) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-700">Staff member not found</h2>
          <p className="text-gray-500 mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Left Sidebar - Staff List */}
      <div className="w-80 flex-shrink-0 space-y-4">
        <div className="card p-4 sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">All Staff</h2>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => router.push("/staff")}
              title="Back to Staff"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-4">
            <SearchBar 
              placeholder="Search staff..." 
              onChange={setSearchQuery} 
              delayMs={200}
            />
          </div>

          <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
            {filteredStaff.map((s) => {
              const sTasks = s.tasks || [];
              const pendingTasks = sTasks.filter(t => !t.completed);
              const overdueTasks = pendingTasks.filter(t => new Date(t.dueDate) < new Date());
              const sAttendance = s.attendance || [];
              const presentDays = sAttendance.filter(a => a.status === "present").length;
              
              return (
                <button
                  key={s.id}
                  onClick={() => router.push(`/staff/${s.id}`)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    s.id === id
                      ? "bg-orange-50 border-2 border-orange-500 shadow-sm"
                      : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                  }`}
                >
                  <div className="font-medium text-gray-900 truncate">{s.name}</div>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                      {s.salary.toFixed(0)} DH/mo
                    </span>
                    {pendingTasks.length > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        overdueTasks.length > 0 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {pendingTasks.length} {pendingTasks.length === 1 ? 'task' : 'tasks'}
                      </span>
                    )}
                    {presentDays > 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        {presentDays} days
                      </span>
                    )}
                  </div>
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
            { href: "/staff", label: "Staff" },
            { label: staffMember.name }
          ]} 
        />
        <div className="flex items-start justify-between gap-4 mt-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
              {staffMember.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="section-title text-gradient">{staffMember.name}</h1>
              <p className="text-gray-600 mt-1">Staff Member</p>
            </div>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => router.push("/staff")}
          >
            ← Back to Staff
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-l-4 border-l-orange-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-orange-700 font-medium">Monthly Salary</div>
              <div className="text-2xl font-bold text-orange-900">{staffMember.salary.toFixed(2)} DH</div>
              <div className="text-xs text-orange-600 mt-1">Fixed payment</div>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-green-700 font-medium">Attendance</div>
              <div className="text-2xl font-bold text-green-900">{attendanceStats.present}</div>
              <div className="text-xs text-green-600 mt-1">Days present</div>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-blue-700 font-medium">Pending Tasks</div>
              <div className="text-2xl font-bold text-blue-900">{tasks.pending}</div>
              <div className="text-xs text-blue-600 mt-1">{tasks.overdue > 0 ? `${tasks.overdue} overdue` : 'On track'}</div>
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
            <div className="font-medium text-gray-900">{staffMember.email}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Phone
            </div>
            <div className="font-medium text-gray-900">{staffMember.phone}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Role
            </div>
            <div className="font-medium text-gray-900">Staff Member</div>
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

      {/* Tasks List */}
      {staffMember.tasks && staffMember.tasks.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Assigned Tasks ({staffMember.tasks.length})
          </h2>
          
          <div className="space-y-3">
            {staffMember.tasks.map((task) => {
              const isOverdue = !task.completed && new Date(task.dueDate) < new Date();
              
              return (
                <div 
                  key={task.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    task.completed 
                      ? "bg-green-50 border-green-500" 
                      : isOverdue
                      ? "bg-red-50 border-red-500"
                      : "bg-blue-50 border-blue-500"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{task.title}</h3>
                        <span 
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            task.completed 
                              ? "bg-green-100 text-green-800" 
                              : isOverdue
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {task.completed ? "✓ Completed" : isOverdue ? "⚠ Overdue" : "⏱ Pending"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{task.description}</p>
                      <div className="text-xs text-gray-500 mt-2">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

