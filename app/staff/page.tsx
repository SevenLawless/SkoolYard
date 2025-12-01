"use client";

import { useMemo, useState, useEffect } from "react";
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
  title: z.string().min(2),
  description: z.string(),
  dueDate: z.string(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

export default function StaffPage() {
  const { data, addStaff, updateStaff, deleteStaff, addStaffTask, updateStaffTask, deleteStaffTask, addStaffAttendance } = useData();
  const router = useRouter();
  const { hasPermission, isParent } = useAuth();
  const canView = hasPermission("viewStaff");
  const canEdit = hasPermission("editStaff");
  const canDelete = hasPermission("deleteStaff");

  useEffect(() => {
    if (isParent()) {
      router.push("/parent");
      return;
    }
    if (!canView) {
      router.push("/dashboard");
      toast.error("You don't have permission to view staff");
    }
  }, [canView, isParent, router]);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openTaskForm, setOpenTaskForm] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState<"present" | "absent" | "excused">("present");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  const {
    register: registerTask,
    handleSubmit: handleSubmitTask,
    reset: resetTask,
    formState: { errors: taskErrors, isSubmitting: isSubmittingTask },
  } = useForm<TaskFormValues>({ resolver: zodResolver(taskSchema) });

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return data.staff.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
    );
  }, [data.staff, query]);

  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page]);

  const columns = useMemo<ColumnDef<typeof filtered[number]>[]>(() => [
    { 
      header: "Name",
      cell: ({ row }) => (
        <button
          className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-left"
          onClick={() => router.push(`/staff/${row.original.id}`)}
        >
          {row.original.name}
        </button>
      ),
    },
    { 
      header: "Salary",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.salary.toFixed(0)} DH/month</span>
      ),
    },
    {
      header: "Tasks",
      cell: ({ row }) => {
        const tasks = row.original.tasks || [];
        const pending = tasks.filter(t => !t.completed);
        const overdue = pending.filter(t => new Date(t.dueDate) < new Date());
        
        return (
          <div className="flex gap-1 flex-wrap">
            {pending.length > 0 ? (
              <>
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  overdue.length > 0 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {pending.length} {pending.length === 1 ? 'task' : 'tasks'}
                </span>
                {overdue.length > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
                    {overdue.length} overdue
                  </span>
                )}
              </>
            ) : (
              <span className="text-xs text-gray-400">No tasks</span>
            )}
          </div>
        );
      },
    },
    {
      header: "Attendance",
      cell: ({ row }) => {
        const attendance = row.original.attendance || [];
        const present = attendance.filter(a => a.status === "present").length;
        
        return (
          <div className="flex gap-1">
            {present > 0 ? (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                {present} {present === 1 ? 'day' : 'days'}
              </span>
            ) : (
              <span className="text-xs text-gray-400">No records</span>
            )}
          </div>
        );
      },
    },
    {
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          {canEdit && (
            <button
              className="btn btn-sm btn-outline"
              onClick={() => {
                const s = row.original;
                router.push(`/staff/${s.id}/edit`);
              }}
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              className="btn btn-sm btn-ghost text-red-600"
              onClick={() => {
                if (confirm("Delete this staff member?")) {
                  deleteStaff(row.original.id);
                  toast.success("Staff member deleted");
                }
              }}
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ], [router, canEdit, canDelete, deleteStaff]);

  const selected = selectedId
    ? data.staff.find((s) => s.id === selectedId) ?? null
    : null;

  return (
    <div className="space-y-4">
      <div>
        <Breadcrumbs items={[{ href: "/", label: "Dashboard" }, { label: "Staff" }]} />
        <h1 className="section-title text-gradient">Staff</h1>
        <p className="muted text-sm">Manage staff members, salaries, tasks, and attendance</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar placeholder="Search by name or email" delayMs={0} onChange={(v) => { setPage(1); setQuery(v); }} />
        </div>
        {canEdit && (
          <button
            className="btn-primary"
            onClick={() => router.push("/staff/new")}
          >
            Add Staff Member
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No staff members found"
          description="Try a different search or add a new staff member."
          action={<button className="btn-primary btn-lg" onClick={() => router.push("/staff/new")}>Add Staff Member</button>}
        />
      ) : (
        <>
          <DataTable data={paged} columns={columns} globalFilter={query} />
          <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} />
        </>
      )}

      <Modal open={!!selected} onClose={() => setSelectedId(null)} title="Staff details">
        {selected ? (
          <div className="space-y-3 text-sm max-h-[80vh] overflow-y-auto">
            <div><span className="muted">Name:</span> {selected.name}</div>
            <div><span className="muted">Email:</span> {selected.email}</div>
            <div><span className="muted">Phone:</span> {selected.phone}</div>
            <div><span className="muted">Salary:</span> {selected.salary} DH</div>

            <div className="space-y-2 border-t pt-2">
              <div className="muted font-semibold">Attendance:</div>
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
                    onChange={(e) => setAttendanceStatus(e.target.value as "present" | "absent" | "excused")}
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
                    addStaffAttendance(selected.id, { date: attendanceDate, status: attendanceStatus });
                    setAttendanceDate("");
                    toast.success("Attendance recorded");
                  }}
                >
                  Add
                </button>
              </div>
              <div className="mt-2 max-h-40 overflow-y-auto">
                {selected.attendance.length > 0 ? (
                  <ul className="space-y-1 text-xs">
                    {selected.attendance.slice().reverse().map((record, idx) => (
                      <li key={idx} className="flex justify-between items-center p-1 bg-gray-50 rounded">
                        <span>{record.date}</span>
                        <span className={`chip text-xs ${
                          record.status === "present" ? "bg-green-100 text-green-800" :
                          record.status === "absent" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
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

            <div className="space-y-2 border-t pt-2">
              <div className="flex justify-between items-center">
                <div className="muted font-semibold">Tasks:</div>
                <button
                  className="btn-outline btn-sm"
                  onClick={() => {
                    resetTask({ title: "", description: "", dueDate: "" });
                    setOpenTaskForm(true);
                  }}
                >
                  Add Task
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {selected.tasks.length > 0 ? (
                  <ul className="space-y-2">
                    {selected.tasks.map((task) => (
                      <li key={task.id} className="p-2 bg-gray-50 rounded">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold">{task.title}</div>
                            <div className="text-xs text-gray-600">{task.description}</div>
                            <div className="text-xs text-gray-500">Due: {task.dueDate}</div>
                          </div>
                          {canEdit && (
                            <div className="flex gap-1">
                              <button
                                className="btn btn-ghost text-xs"
                                onClick={() => {
                                  updateStaffTask(selected.id, task.id, { completed: !task.completed });
                                  toast.success(task.completed ? "Task marked incomplete" : "Task completed");
                                }}
                              >
                                {task.completed ? "✓" : "○"}
                              </button>
                              <button
                                className="btn btn-ghost text-red-600 text-xs"
                                onClick={() => {
                                  if (confirm("Delete this task?")) {
                                    deleteStaffTask(selected.id, task.id);
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

            {(canEdit || canDelete) && (
              <div className="pt-2 flex gap-2 border-t">
                {canEdit && (
                  <button
                    className="btn-outline"
                    onClick={() => {
                      router.push(`/staff/${selected.id}/edit`);
                    }}
                  >
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    className="btn btn-ghost text-red-600"
                    onClick={() => {
                      if (confirm("Delete this staff member?")) {
                        deleteStaff(selected.id);
                        toast.success("Staff member deleted");
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
        ) : null}
      </Modal>


      <Modal open={openTaskForm} onClose={() => setOpenTaskForm(false)} title="Add Task">
        <form
          className="space-y-3"
          onSubmit={handleSubmitTask(async (values) => {
            if (selectedId) {
              addStaffTask(selectedId, {
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
          {taskErrors.title ? <p className="text-sm text-red-600">{taskErrors.title.message}</p> : null}
          <div>
            <label className="text-sm text-gray-700">Description</label>
            <textarea className="input-field w-full" rows={3} {...registerTask("description")} />
          </div>
          {taskErrors.description ? <p className="text-sm text-red-600">{taskErrors.description.message}</p> : null}
          <Input label="Due Date" type="date" {...registerTask("dueDate")} />
          {taskErrors.dueDate ? <p className="text-sm text-red-600">{taskErrors.dueDate.message}</p> : null}
          <div className="pt-2 flex gap-2 justify-end">
            <button type="button" className="btn btn-ghost" onClick={() => setOpenTaskForm(false)}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmittingTask} className="btn-primary">
              Add
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


