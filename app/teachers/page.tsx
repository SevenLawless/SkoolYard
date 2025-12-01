"use client";

import { useMemo, useState, useEffect } from "react";
import { useData } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import SearchBar from "@/components/SearchBar";
import DataTable from "@/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import Modal from "@/components/Modal";
import toast from "react-hot-toast";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";

export default function TeachersPage() {
  const { data, addTeacher, updateTeacher, deleteTeacher, setClassTeacher, addTeacherAttendance } = useData();
  const router = useRouter();
  const { hasPermission, isParent } = useAuth();
  const canView = hasPermission("viewTeachers");
  const canEdit = hasPermission("editTeachers");
  const canDelete = hasPermission("deleteTeachers");

  useEffect(() => {
    if (isParent()) {
      router.push("/parent");
      return;
    }
    if (!canView) {
      router.push("/dashboard");
      toast.error("You don't have permission to view teachers");
    }
  }, [canView, isParent, router]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [classSelection, setClassSelection] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState<"present" | "absent" | "excused">("present");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return data.teachers.filter(
      (t) => t.name.toLowerCase().includes(q) || t.qualifications.toLowerCase().includes(q)
    );
  }, [data.teachers, query]);

  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page]);

  const columns = useMemo<ColumnDef<typeof filtered[number]>[]>(() => [
    { 
      header: "Name",
      cell: ({ row }) => (
        <button
          className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-left"
          onClick={() => router.push(`/teachers/${row.original.id}`)}
        >
          {row.original.name}
        </button>
      ),
    },
    {
      header: "Teaching",
      cell: ({ row }) => {
        const teacherClasses = data.classes.filter(c => c.teacherId === row.original.id);
        const totalStudents = teacherClasses.reduce((sum, cls) => sum + cls.studentIds.length, 0);
        
        return (
          <div className="flex flex-col gap-1">
            {teacherClasses.length > 0 ? (
              <>
                <span className="text-sm font-medium">{teacherClasses.length} {teacherClasses.length === 1 ? 'class' : 'classes'}</span>
                <span className="text-xs text-gray-600 truncate max-w-xs">
                  {teacherClasses.map(c => c.subject).join(', ')}
                </span>
                <span className="text-xs text-gray-500">{totalStudents} students</span>
              </>
            ) : (
              <span className="text-xs text-gray-400">No classes</span>
            )}
          </div>
        );
      },
    },
    {
      header: "Salary",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.salary.toFixed(0)} DH/month</span>
      ),
    },
    {
      header: "Info",
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap">
          {row.original.hasDiscount && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-medium">
              {row.original.discountPercentage}% discount
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
              onClick={() => {
                const t = row.original;
                router.push(`/teachers/${t.id}/edit`);
              }}
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              className="btn btn-sm btn-ghost text-red-600"
              onClick={() => {
                if (confirm("Delete this teacher?")) {
                  deleteTeacher(row.original.id);
                  toast.success("Teacher deleted");
                }
              }}
            >
              Delete
            </button>
          )}
        </div>
      ),
    },
  ], [router, canEdit, canDelete, deleteTeacher]);

  const selected = selectedId
    ? data.teachers.find((t) => t.id === selectedId) ?? null
    : null;

  return (
    <div className="space-y-4">
      <div>
        <Breadcrumbs items={[{ href: "/", label: "Dashboard" }, { label: "Teachers" }]} />
        <h1 className="section-title text-gradient">Teachers</h1>
        <p className="muted text-sm">Manage instructors, subjects, and class assignments</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar placeholder="Search by name or qualification" delayMs={0} onChange={(v) => { setPage(1); setQuery(v); }} />
        </div>
        {canEdit && (
          <button
            className="btn-primary"
            onClick={() => router.push("/teachers/new")}
          >
            Add Teacher
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No teachers found"
          description="Try a different search or add a new teacher."
          action={<button className="btn-primary btn-lg" onClick={() => router.push("/teachers/new")}>Add Teacher</button>}
        />
      ) : (
        <>
          <DataTable data={paged} columns={columns} globalFilter={query} />
          <Pagination total={filtered.length} page={page} pageSize={pageSize} onPageChange={setPage} />
        </>
      )}

      <Modal open={!!selected} onClose={() => setSelectedId(null)} title="Teacher details">
        {selected ? (
          <div className="space-y-3 text-sm">
            <div><span className="muted">Name:</span> {selected.name}</div>
            <div><span className="muted">Email:</span> {selected.email}</div>
            <div><span className="muted">Phone:</span> {selected.phone}</div>
            <div><span className="muted">Qualifications:</span> {selected.qualifications}</div>
            <div><span className="muted">Subjects:</span> {selected.subjects.join(", ")}</div>
            <div><span className="muted">Salary:</span> {selected.salary} DH</div>
            <div>
              <span className="muted">Discount:</span> {selected.hasDiscount ? `Yes (${selected.discountPercentage}%)` : "No"}
            </div>

            <div className="space-y-2 border-t pt-2">
              <div className="muted font-semibold">Students Teaching:</div>
              <div className="text-sm">
                {(() => {
                  const studentIds = new Set<string>();
                  selected.classes.forEach((cid) => {
                    const cls = data.classes.find((c) => c.id === cid);
                    if (cls) {
                      cls.studentIds.forEach((sid) => studentIds.add(sid));
                    }
                  });
                  const students = Array.from(studentIds).map((sid) => 
                    data.students.find((s) => s.id === sid)
                  ).filter(Boolean);
                  return students.length > 0 ? (
                    <ul className="list-disc ml-5">
                      {students.map((s) => (
                        <li key={s!.id}>{s!.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500">No students assigned</span>
                  );
                })()}
              </div>
            </div>

            <div className="space-y-2 border-t pt-2">
              <div className="muted font-semibold">Classes:</div>
              <ul className="list-disc ml-5 space-y-1">
                {selected.classes.map((cid) => {
                  const cls = data.classes.find((c) => c.id === cid);
                  return (
                    <li key={cid} className="flex items-center justify-between gap-2">
                      <span>{cls ? cls.subject : cid}</span>
                      <button
                        className="btn btn-ghost text-red-600"
                        onClick={() => {
                          if (data.classes.find((c) => c.id === cid)?.teacherId === selected.id) {
                            setClassTeacher(cid, "");
                            toast.success("Class unassigned from teacher");
                          }
                        }}
                      >
                        Unassign
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="flex items-center gap-2 pt-1">
                <select
                  className="select-field"
                  value={classSelection}
                  onChange={(e) => setClassSelection(e.target.value)}
                >
                  <option value="">Select class</option>
                  {data.classes
                    .filter((c) => c.teacherId !== selected.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.subject}</option>
                    ))}
                </select>
                <button
                  className="btn-outline btn-lg whitespace-nowrap"
                  onClick={() => {
                    if (!classSelection) return;
                    setClassTeacher(classSelection, selected.id);
                    setClassSelection("");
                    toast.success("Class assigned to teacher");
                  }}
                  disabled={!classSelection}
                >
                  Assign class
                </button>
              </div>
            </div>

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
                    addTeacherAttendance(selected.id, { date: attendanceDate, status: attendanceStatus });
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
          </div>
        ) : null}
      </Modal>

    </div>
  );
}


