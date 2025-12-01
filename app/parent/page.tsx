"use client";

import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ParentDashboard() {
  const { user, isParent } = useAuth();
  const { data } = useData();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/");
    } else if (!isParent()) {
      router.push("/dashboard");
    }
  }, [user, isParent, router]);

  if (!user || !isParent()) {
    return null;
  }

  const studentIds = user.studentIds || [];
  const students = data.students.filter((s) => studentIds.includes(s.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-primary)]">Welcome, {user.name}!</h1>
          <p className="text-[var(--color-muted)] mt-1">View your student&apos;s information</p>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-[var(--color-muted)]">No students assigned to your account.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {students.map((student) => {
            const enrolledClasses = data.classes.filter((c) => c.studentIds.includes(student.id));
            const payments = data.payments.filter((p) => p.studentId === student.id);
            const pendingPayments = payments.filter((p) => p.status === "pending");
            const paidPayments = payments.filter((p) => p.status === "paid");

            return (
              <div key={student.id} className="card p-6 space-y-6">
                {/* Student Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--color-primary)]">{student.name}</h2>
                    <div className="mt-2 space-y-1 text-sm text-[var(--color-muted)]">
                      <p>Email: {student.email}</p>
                      <p>Phone: {student.phone}</p>
                      <p>Date of Birth: {new Date(student.dob).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                      {enrolledClasses.length} {enrolledClasses.length === 1 ? "Class" : "Classes"}
                    </div>
                  </div>
                </div>

                {/* Enrolled Classes */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-[var(--color-primary)]">Enrolled Classes</h3>
                  {enrolledClasses.length === 0 ? (
                    <p className="text-[var(--color-muted)]">Not enrolled in any classes.</p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {enrolledClasses.map((cls) => {
                        const teacher = data.teachers.find((t) => t.id === cls.teacherId);
                        const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                        const schedule = cls.daysOfWeek && cls.time
                          ? `${cls.daysOfWeek.map(d => daysMap[d]).join(", ")} at ${cls.time}`
                          : "No schedule set";

                        return (
                          <div key={cls.id} className="p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                            <h4 className="font-semibold text-[var(--color-primary)]">{cls.subject}</h4>
                            <p className="text-sm text-[var(--color-muted)] mt-1">
                              Teacher: {teacher?.name || "Not assigned"}
                            </p>
                            <p className="text-sm text-[var(--color-muted)]">Schedule: {schedule}</p>
                            <p className="text-sm font-medium text-green-600 mt-2">
                              Fee: {cls.fees} MAD/month
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Attendance */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-[var(--color-primary)]">Attendance</h3>
                  {student.attendance.length === 0 ? (
                    <p className="text-[var(--color-muted)]">No attendance records yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {student.attendance.slice(-10).reverse().map((record, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                          <span className="text-sm">{new Date(record.date).toLocaleDateString()}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            record.status === "present"
                              ? "bg-green-100 text-green-800"
                              : record.status === "absent"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tasks */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-[var(--color-primary)]">Assigned Tasks</h3>
                  {student.tasks.length === 0 ? (
                    <p className="text-[var(--color-muted)]">No tasks assigned.</p>
                  ) : (
                    <div className="space-y-2">
                      {student.tasks.map((task) => (
                        <div key={task.id} className="p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-[var(--color-primary)]">{task.title}</h4>
                              <p className="text-sm text-[var(--color-muted)] mt-1">{task.description}</p>
                              <p className="text-xs text-[var(--color-muted)] mt-2">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`ml-3 px-2 py-1 rounded text-xs font-medium ${
                              task.completed
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {task.completed ? "Completed" : "Pending"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payments */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-[var(--color-primary)]">Payment Status</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-sm text-green-700">Paid Payments</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {paidPayments.length}
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        Total: {paidPayments.reduce((sum, p) => sum + p.amount, 0)} MAD
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                      <p className="text-sm text-yellow-700">Pending Payments</p>
                      <p className="text-2xl font-bold text-yellow-600 mt-1">
                        {pendingPayments.length}
                      </p>
                      <p className="text-sm text-yellow-600 mt-1">
                        Total: {pendingPayments.reduce((sum, p) => sum + p.amount, 0)} MAD
                      </p>
                    </div>
                  </div>

                  {pendingPayments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-[var(--color-primary)]">Pending Payment Details:</p>
                      {pendingPayments.map((payment) => {
                        const cls = data.classes.find((c) => c.id === payment.classId);
                        return (
                          <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]">
                            <span className="text-sm">{cls?.subject || "Unknown Class"}</span>
                            <span className="text-sm font-medium text-yellow-600">
                              {payment.amount} MAD
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

