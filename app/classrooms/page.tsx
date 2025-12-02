"use client";

import { useMemo } from "react";
import { useData } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import EmptyState from "@/components/ui/EmptyState";

export default function ClassroomsPage() {
  const { data } = useData();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canView = hasPermission("viewClasses");

  const classroomsWithStats = useMemo(() => {
    return data.classrooms.map((classroom) => {
      const classesInRoom = data.classes.filter((c) => c.classroomId === classroom.id);
      const totalStudents = classesInRoom.reduce((sum, c) => sum + c.studentIds.length, 0);
      const totalTeachers = new Set(classesInRoom.map((c) => c.teacherId)).size;

      return {
        ...classroom,
        classCount: classesInRoom.length,
        studentCount: totalStudents,
        teacherCount: totalTeachers,
      };
    });
  }, [data.classrooms, data.classes]);

  if (!canView) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "Rooms" }]} />
        <div className="card p-8 text-center">
          <p className="text-gray-500">You don&apos;t have permission to view rooms</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { label: "Rooms" }]} />
        <h1 className="section-title text-gradient">Rooms</h1>
        <p className="muted text-sm">View schedules and class assignments for each room</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-700 font-medium">Total Rooms</div>
              <div className="text-3xl font-bold text-blue-900 mt-1">{data.classrooms.length}</div>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-green-700 font-medium">Active Classes</div>
              <div className="text-3xl font-bold text-green-900 mt-1">
                {data.classes.filter((c) => c.classroomId).length}
              </div>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-5 bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-purple-700 font-medium">Total Students</div>
              <div className="text-3xl font-bold text-purple-900 mt-1">
                {data.classes
                  .filter((c) => c.classroomId)
                  .reduce((sum, c) => sum + c.studentIds.length, 0)}
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {classroomsWithStats.length === 0 ? (
        <EmptyState
          title="No rooms found"
          description="Rooms will appear here once they are created."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classroomsWithStats.map((classroom) => (
            <div
              key={classroom.id}
              className="card p-0 overflow-hidden hover:shadow-xl transition-all cursor-pointer"
              onClick={() => router.push(`/classrooms/${classroom.id}`)}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-4 text-white">
                <h3 className="text-xl font-bold mb-2">{classroom.name}</h3>
                <div className="text-sm opacity-90 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Room
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="text-xs text-gray-600">Classes</div>
                    <div className="text-lg font-bold text-blue-700">{classroom.classCount}</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-xs text-gray-600">Students</div>
                    <div className="text-lg font-bold text-green-700">{classroom.studentCount}</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded">
                    <div className="text-xs text-gray-600">Teachers</div>
                    <div className="text-lg font-bold text-purple-700">{classroom.teacherCount}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    className="btn btn-sm btn-outline flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/classrooms/${classroom.id}`);
                    }}
                  >
                    View Schedule
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

