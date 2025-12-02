"use client";

import { useMemo } from "react";
import { useData } from "@/lib/store";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

export default function ClassroomSchedulePage() {
  const { data } = useData();
  const router = useRouter();
  const params = useParams();
  const { hasPermission } = useAuth();
  const canView = hasPermission("viewClasses");
  const classroomId = params?.id as string;

  const classroom = useMemo(() => {
    return data.classrooms.find((c) => c.id === classroomId);
  }, [data.classrooms, classroomId]);

  const classesInRoom = useMemo(() => {
    if (!classroom) return [];
    return data.classes.filter((c) => c.classroomId === classroomId);
  }, [data.classes, classroomId, classroom]);

  // Generate time slots from 8:00 to 20:00 (every hour)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${String(hour).padStart(2, "0")}:00`);
    }
    return slots;
  }, []);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Get classes for a specific day and time slot
  const getClassesForSlot = (dayIndex: number, time: string) => {
    return classesInRoom.filter((cls) => {
      // Check if class has required schedule info
      if (!cls.daysOfWeek || cls.daysOfWeek.length === 0 || !cls.time) {
        return false;
      }
      
      // Normalize time format (handle both "14:00" and "14:00:00")
      const classTime = cls.time.split(':').slice(0, 2).join(':');
      const slotTime = time.split(':').slice(0, 2).join(':');
      
      // Check if day matches and time matches
      const dayMatches = cls.daysOfWeek.includes(dayIndex);
      const timeMatches = classTime === slotTime;
      
      return dayMatches && timeMatches;
    });
  };

  if (!canView) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { href: "/classrooms", label: "Rooms" }, { label: "Schedule" }]} />
        <div className="card p-8 text-center">
          <p className="text-gray-500">You don't have permission to view rooms</p>
        </div>
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { href: "/classrooms", label: "Rooms" }, { label: "Schedule" }]} />
        <div className="card p-8 text-center">
          <p className="text-gray-500">Room not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumbs items={[
          { href: "/dashboard", label: "Dashboard" },
          { href: "/classrooms", label: "Rooms" },
          { label: classroom.name }
        ]} />
        <h1 className="section-title text-gradient">{classroom.name} Schedule</h1>
        <p className="muted text-sm">Weekly schedule showing all classes assigned to this room. Click on a class to view details.</p>
      </div>

      {/* Info Alert if classes exist but have no schedule */}
      {classesInRoom.length > 0 && classesInRoom.some(c => !c.daysOfWeek || !c.time) && (
        <div className="card p-4 bg-yellow-50 border border-yellow-200">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-yellow-900">Some classes missing schedule information</p>
              <p className="text-xs text-yellow-700 mt-1">
                Some classes in this room don't have days of week or time set. They won't appear in the schedule grid below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 bg-blue-50">
          <div className="text-sm text-blue-700 font-medium">Total Classes</div>
          <div className="text-2xl font-bold text-blue-900 mt-1">{classesInRoom.length}</div>
        </div>
        <div className="card p-4 bg-green-50">
          <div className="text-sm text-green-700 font-medium">Total Students</div>
          <div className="text-2xl font-bold text-green-900 mt-1">
            {classesInRoom.reduce((sum, c) => sum + c.studentIds.length, 0)}
          </div>
        </div>
        <div className="card p-4 bg-purple-50">
          <div className="text-sm text-purple-700 font-medium">Teachers</div>
          <div className="text-2xl font-bold text-purple-900 mt-1">
            {new Set(classesInRoom.map((c) => c.teacherId)).size}
          </div>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="card p-6 overflow-x-auto">
        <div className="min-w-full">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2 bg-gray-100 text-left font-semibold text-sm sticky left-0 bg-gray-100 z-10">Time</th>
                {dayNames.map((day, index) => (
                  <th key={index} className="border border-gray-300 p-2 bg-gray-100 text-center font-semibold text-sm min-w-[180px]">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time) => (
                <tr key={time}>
                  <td className="border border-gray-300 p-2 bg-gray-50 font-medium text-sm sticky left-0 bg-gray-50 z-10">{time}</td>
                  {dayNames.map((_, dayIndex) => {
                    const slotClasses = getClassesForSlot(dayIndex, time);
                    return (
                      <td key={dayIndex} className="border border-gray-300 p-2 align-top min-h-[60px]">
                        {slotClasses.length > 0 ? (
                          <div className="space-y-2">
                            {slotClasses.map((cls) => {
                              const teacher = data.teachers.find((t) => t.id === cls.teacherId);
                              return (
                                <div
                                  key={cls.id}
                                  className="bg-blue-100 border-2 border-blue-400 rounded-lg p-3 cursor-pointer hover:bg-blue-200 hover:border-blue-500 transition-all shadow-sm"
                                  onClick={() => router.push(`/classes-v2/${cls.id}`)}
                                  title={`Click to view ${cls.subject} details`}
                                >
                                  <div className="font-bold text-blue-900 text-sm mb-1">{cls.subject}</div>
                                  <div className="text-xs text-blue-700">
                                    👨‍🏫 {teacher?.name || "No teacher"}
                                  </div>
                                  <div className="text-xs text-blue-600 mt-1">
                                    👥 {cls.studentIds.length} student{cls.studentIds.length !== 1 ? "s" : ""}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-gray-300 text-center text-xs py-2">Free</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Debug Info - Show if no classes are displaying */}
      {classesInRoom.length === 0 ? (
        <div className="card p-6 bg-yellow-50 border border-yellow-200">
          <h2 className="text-xl font-semibold mb-2 text-yellow-900">No Classes Assigned</h2>
          <p className="text-yellow-700">
            This room doesn't have any classes assigned to it yet. Assign a classroom when creating or editing a class.
          </p>
          <button
            className="btn-primary mt-4"
            onClick={() => router.push("/classes-v2/new")}
          >
            Create a Class
          </button>
        </div>
      ) : (
        <>
          {/* Classes List */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">All Classes in {classroom.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classesInRoom.map((cls) => {
                const teacher = data.teachers.find((t) => t.id === cls.teacherId);
                const scheduleDays = cls.daysOfWeek
                  ? cls.daysOfWeek.map((d) => dayNames[d]).join(", ")
                  : "No schedule";
                return (
                  <div
                    key={cls.id}
                    className="p-4 border-2 border-blue-200 rounded-lg hover:shadow-md hover:border-blue-400 transition-all cursor-pointer bg-blue-50"
                    onClick={() => router.push(`/classes-v2/${cls.id}`)}
                  >
                    <h3 className="font-bold text-gray-900 text-lg">{cls.subject}</h3>
                    <p className="text-sm text-gray-700 mt-2">
                      <span className="font-semibold">Teacher:</span> {teacher?.name || "Not assigned"}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Schedule:</span> {scheduleDays} {cls.time ? `at ${cls.time}` : ""}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-semibold">Students:</span> {cls.studentIds.length} student{cls.studentIds.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Debug section to show class details */}
          <div className="card p-4 bg-gray-50 text-xs">
            <details>
              <summary className="cursor-pointer font-semibold text-gray-700">Debug: View class schedule details</summary>
              <div className="mt-2 space-y-2">
                {classesInRoom.map((cls) => (
                  <div key={cls.id} className="p-2 bg-white rounded border">
                    <strong>{cls.subject}</strong>: Days: {cls.daysOfWeek?.join(", ") || "none"}, Time: {cls.time || "none"}, Room: {cls.classroomId || "none"}
                  </div>
                ))}
              </div>
            </details>
          </div>
        </>
      )}
    </div>
  );
}

