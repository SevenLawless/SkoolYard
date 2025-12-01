"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useData } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import SearchBar from "@/components/SearchBar";
import DataTable from "@/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import Modal from "@/components/Modal";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/Input";
import toast from "react-hot-toast";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";

const taskSchema = z.object({
  title: z.string().min(2, "Title required"),
  description: z.string(),
  dueDate: z.string(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

export default function StudentsPage() {
  const { data, addStudent, updateStudent, deleteStudent, enrollStudentInClass, unenrollStudentFromClass, addStudentTask, updateStudentTask, deleteStudentTask, addStudentAttendance } = useData();
  const router = useRouter();
  
  // Permission checks
  const { hasPermission, isParent } = useAuth();
  const canView = hasPermission("viewStudents");
  const canEdit = hasPermission("editStudents");
  const canDelete = hasPermission("deleteStudents");
  
  // Redirect if no view permission
  useEffect(() => {
    if (isParent()) {
      router.push("/parent");
      return;
    }
    if (!canView) {
      router.push("/dashboard");
      toast.error("You don't have permission to view students");
    }
  }, [canView, isParent, router]);
  
  // State
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openTaskForm, setOpenTaskForm] = useState(false);
  const [classToAdd, setClassToAdd] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState<"present" | "absent" | "excused">("present");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Forms (only for tasks now)

  const {
    register: registerTask,
    handleSubmit: handleSubmitTask,
    reset: resetTask,
    formState: { errors: taskErrors, isSubmitting: isSubmittingTask },
  } = useForm<TaskFormValues>({ resolver: zodResolver(taskSchema) });

  // Filtered students based on search
  const filtered = useMemo(() => {
    if (!query) return data.students;
    const q = query.toLowerCase();
    return data.students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q)
    );
  }, [data.students, query]);

  // Paginated students
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, page, pageSize]);

  // Handle search with page reset
  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setPage(1);
  }, []);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Define columns (stable reference)
  const columns = useMemo<ColumnDef<(typeof data.students)[number]>[]>(() => {
    return [
      {
        header: "Name",
        accessorKey: "name",
        cell: ({ row }) => (
          <button
            className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-left"
            onClick={() => router.push(`/students/${row.original.id}`)}
          >
            {row.original.name}
          </button>
        ),
      },
      {
        header: "Classes",
        cell: ({ row }) => {
          const studentClasses = data.classes.filter((c) =>
            row.original.classes.includes(c.id)
          );
          return (
            <div className="flex flex-col gap-1">
              {studentClasses.length > 0 ? (
                <>
                  <span className="text-sm font-medium">
                    {studentClasses.length} {studentClasses.length === 1 ? "class" : "classes"}
                  </span>
                  <span className="text-xs text-gray-600 truncate max-w-xs" title={studentClasses.map((c) => c.subject).join(", ")}>
                    {studentClasses.map((c) => c.subject).join(", ")}
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-400">No classes</span>
              )}
            </div>
          );
        },
      },
      {
        header: "Payment Status",
        cell: ({ row }) => {
          const studentPayments = data.payments.filter(
            (p) => p.studentId === row.original.id
          );
          const pending = studentPayments.filter((p) => p.status === "pending");
          const paid = studentPayments.filter((p) => p.status === "paid");

          return (
            <div className="flex gap-1 flex-wrap">
              {pending.length > 0 && (
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-medium">
                  {pending.length} pending
                </span>
              )}
              {paid.length > 0 && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                  {paid.length} paid
                </span>
              )}
              {pending.length === 0 && paid.length === 0 && (
                <span className="text-xs text-gray-400">No payments</span>
              )}
            </div>
          );
        },
      },
      {
        header: "Info",
        cell: ({ row }) => (
          <div className="flex gap-1 flex-wrap">
            {row.original.hasDiscount && row.original.discountPercentage && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">
                {row.original.discountPercentage}% off
              </span>
            )}
          </div>
        ),
      },
      {
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            {canEdit && (
              <button
                className="btn btn-sm btn-outline"
                onClick={(e) => {
                  e.stopPropagation();
                  const s = row.original;
                  router.push(`/students/${s.id}/edit`);
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
                  if (confirm(`Delete ${row.original.name}?`)) {
                    deleteStudent(row.original.id);
                    toast.success("Student deleted");
                  }
                }}
              >
                Delete
              </button>
            )}
          </div>
        ),
      },
    ];
    }, [router, data.classes, data.payments, deleteStudent, canEdit, canDelete]);

  const selected = selectedId
    ? data.students.find((s) => s.id === selectedId) ?? null
    : null;


  return (
    <div className="content-grid">
      {/* Header */}
      <div className="section-header">
        <Breadcrumbs
          items={[
            { href: "/", label: "Dashboard" },
            { label: "Students" },
          ]}
        />
        <h1 className="section-title text-gradient">Students</h1>
        <p className="muted text-sm">
          Manage student records, enrollments, and details
        </p>
      </div>

      {/* Actions Bar */}
      <div className="action-bar">
        <div className="flex-1">
          <SearchBar
            placeholder="Search by name, email, or phone"
            delayMs={300}
            onChange={handleSearch}
          />
        </div>
        {canEdit && (
          <button className="btn-primary" onClick={() => router.push("/students/new")}>
            Add Student
          </button>
        )}
      </div>

      {/* Table or Empty State */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No students found"
          description={
            query
              ? "Try adjusting your search or add a new student."
              : "Get started by adding your first student."
          }
          action={
            <button className="btn-primary btn-lg" onClick={() => router.push("/students/new")}>
              Add Student
            </button>
          }
        />
      ) : (
        <>
          <DataTable data={paged} columns={columns} globalFilter={query} />
          <Pagination
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Student Details Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title="Student Details"
      >
        {selected && (
          <div className="space-y-3 text-sm max-h-[80vh] overflow-y-auto">
            <div>
              <span className="muted">Name:</span> {selected.name}
            </div>
            <div>
              <span className="muted">Email:</span> {selected.email}
            </div>
            <div>
              <span className="muted">Phone:</span> {selected.phone}
            </div>
            <div>
              <span className="muted">Address:</span> {selected.address}
            </div>
            <div>
              <span className="muted">DOB:</span> {selected.dob}
            </div>
            <div>
              <span className="muted">Discount:</span>{" "}
              {selected.hasDiscount
                ? `Yes (${selected.discountPercentage}%)`
                : "No"}
            </div>

            {/* Teachers */}
            <div className="space-y-2 border-t pt-2">
              <div className="muted font-semibold">Professors Teaching:</div>
              <div className="text-sm">
                {(() => {
                  const teacherIds = new Set<string>();
                  selected.classes.forEach((cid) => {
                    const cls = data.classes.find((c) => c.id === cid);
                    if (cls && cls.teacherId) {
                      teacherIds.add(cls.teacherId);
                    }
                  });
                  const teachers = Array.from(teacherIds)
                    .map((tid) => data.teachers.find((t) => t.id === tid))
                    .filter(Boolean);
                  return teachers.length > 0 ? (
                    <ul className="list-disc ml-5">
                      {teachers.map((t) => (
                        <li key={t!.id}>
                          {t!.name} - {t!.subjects.join(", ")}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500">No professors assigned</span>
                  );
                })()}
              </div>
            </div>

            {/* Classes */}
            <div className="space-y-2 border-t pt-2">
              <div className="muted font-semibold">Classes:</div>
              <ul className="list-disc ml-5 space-y-1">
                {selected.classes.map((cid) => {
                  const cls = data.classes.find((c) => c.id === cid);
                  return (
                    <li
                      key={cid}
                      className="flex items-center justify-between gap-2"
                    >
                      <span>{cls ? cls.subject : cid}</span>
                      {canEdit && (
                        <button
                          className="btn btn-ghost text-red-600"
                          onClick={() => {
                            unenrollStudentFromClass(selected.id, cid);
                            toast.success("Class removed from student");
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
              {canEdit && (
                <div className="flex items-center gap-2 pt-1">
                  <select
                    className="select-field"
                    value={classToAdd}
                    onChange={(e) => setClassToAdd(e.target.value)}
                  >
                    <option value="">Select class</option>
                    {data.classes
                      .filter((c) => !selected.classes.includes(c.id))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.subject}
                        </option>
                      ))}
                  </select>
                  <button
                    className="btn-outline btn-lg whitespace-nowrap"
                    onClick={() => {
                      if (!classToAdd) return;
                      enrollStudentInClass(selected.id, classToAdd);
                      setClassToAdd("");
                      toast.success("Student enrolled in class");
                    }}
                    disabled={!classToAdd}
                  >
                    Add class
                  </button>
                </div>
              )}
            </div>

            {/* Attendance */}
            <div className="space-y-2 border-t pt-2">
              <div className="muted font-semibold">Attendance:</div>
              {canEdit && (
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-gray-600">Date</label>
                    <input
                      type="date"
                      className="input-field w-full"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-600">Status</label>
                    <select
                      className="select-field w-full"
                      value={attendanceStatus}
                      onChange={(e) =>
                        setAttendanceStatus(
                          e.target.value as "present" | "absent" | "excused"
                        )
                      }
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="excused">Excused</option>
                    </select>
                  </div>
                  <button
                    className="btn-outline whitespace-nowrap"
                    onClick={() => {
                      if (!attendanceDate) {
                        toast.error("Please select a date");
                        return;
                      }
                      addStudentAttendance(selected.id, {
                        date: attendanceDate,
                        status: attendanceStatus,
                      });
                      setAttendanceDate("");
                      toast.success("Attendance recorded");
                    }}
                  >
                    Add
                  </button>
                </div>
              )}
              <div className="mt-2 max-h-40 overflow-y-auto">
                {selected.attendance.length > 0 ? (
                  <ul className="space-y-1 text-xs">
                    {selected.attendance
                      .slice()
                      .reverse()
                      .map((record, idx) => (
                        <li
                          key={idx}
                          className="flex justify-between items-center p-1 bg-gray-50 rounded"
                        >
                          <span>{record.date}</span>
                          <span
                            className={`chip text-xs ${
                              record.status === "present"
                                ? "bg-green-100 text-green-800"
                                : record.status === "absent"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {record.status}
                          </span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-xs">No attendance records</p>
                )}
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-2 border-t pt-2">
              <div className="flex justify-between items-center">
                <div className="muted font-semibold">Tasks:</div>
                {canEdit && (
                  <button
                    className="btn-outline btn-sm"
                    onClick={() => {
                      resetTask({ title: "", description: "", dueDate: "" });
                      setOpenTaskForm(true);
                    }}
                  >
                    Add Task
                  </button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto">
                {selected.tasks.length > 0 ? (
                  <ul className="space-y-2">
                    {selected.tasks.map((task) => (
                      <li key={task.id} className="p-2 bg-gray-50 rounded">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold">{task.title}</div>
                            <div className="text-xs text-gray-600">
                              {task.description}
                            </div>
                            <div className="text-xs text-gray-500">
                              Due: {task.dueDate}
                            </div>
                            {task.assignedBy && (
                              <div className="text-xs text-gray-500">
                                Assigned by:{" "}
                                {data.teachers.find((t) => t.id === task.assignedBy)
                                  ?.name || task.assignedBy}
                              </div>
                            )}
                          </div>
                          {canEdit && (
                            <div className="flex gap-1">
                              <button
                                className="btn btn-ghost text-xs"
                                onClick={() => {
                                  updateStudentTask(selected.id, task.id, {
                                    completed: !task.completed,
                                  });
                                  toast.success(
                                    task.completed
                                      ? "Task marked incomplete"
                                      : "Task completed"
                                  );
                                }}
                              >
                                {task.completed ? "✓" : "○"}
                              </button>
                              <button
                                className="btn btn-ghost text-red-600 text-xs"
                                onClick={() => {
                                  if (confirm("Delete this task?")) {
                                    deleteStudentTask(selected.id, task.id);
                                    toast.success("Task deleted");
                                  }
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-xs">No tasks assigned</p>
                )}
              </div>
            </div>

            {/* Actions */}
            {(canEdit || canDelete) && (
              <div className="pt-2 flex gap-2 border-t">
                {canEdit && (
                  <button
                    className="btn-outline"
                    onClick={() => {
                      router.push(`/students/${selected.id}/edit`);
                      setSelectedId(null);
                    }}
                  >
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    className="btn btn-ghost text-red-600"
                    onClick={() => {
                      if (confirm("Delete this student?")) {
                        deleteStudent(selected.id);
                        toast.success("Student deleted");
                        setSelectedId(null);
                      }
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>


      {/* Add Task Modal */}
      <Modal
        open={openTaskForm}
        onClose={() => setOpenTaskForm(false)}
        title="Add Task"
      >
        <form
          className="space-y-3"
          onSubmit={handleSubmitTask(async (values) => {
            if (selectedId) {
              addStudentTask(selectedId, {
                title: values.title,
                description: values.description,
                dueDate: values.dueDate,
                completed: false,
              });
              toast.success("Task added");
              setOpenTaskForm(false);
            }
          })}
        >
          <Input label="Title" {...registerTask("title")} />
          {taskErrors.title && (
            <p className="text-sm text-red-600">{taskErrors.title.message}</p>
          )}

          <div>
            <label className="text-sm text-gray-700">Description</label>
            <textarea
              className="input-field w-full"
              rows={3}
              {...registerTask("description")}
            />
          </div>
          {taskErrors.description && (
            <p className="text-sm text-red-600">
              {taskErrors.description.message}
            </p>
          )}

          <Input label="Due Date" type="date" {...registerTask("dueDate")} />
          {taskErrors.dueDate && (
            <p className="text-sm text-red-600">{taskErrors.dueDate.message}</p>
          )}

          <div className="pt-2 flex gap-2 justify-end">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setOpenTaskForm(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingTask}
              className="btn-primary"
            >
              Add Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
