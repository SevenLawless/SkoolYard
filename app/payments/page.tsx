"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/store";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import DataTable from "@/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import toast from "react-hot-toast";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import EmptyState from "@/components/ui/EmptyState";
import { generateInvoicePDF } from "@/lib/invoice";

export default function PaymentsPage() {
  const { data, deletePayment } = useData();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("");


  // Filter payments based on search and status
  const filteredPayments = useMemo(() => {
    const q = query.toLowerCase();
    return data.payments.filter((p) => {
      let name = "";
      if (p.type === "student" && p.studentId) {
        name = data.students.find((s) => s.id === p.studentId)?.name ?? "";
      } else if (p.type === "teacher" && p.teacherId) {
        name = data.teachers.find((t) => t.id === p.teacherId)?.name ?? "";
      } else if (p.type === "staff" && p.staffId) {
        name = data.staff.find((s) => s.id === p.staffId)?.name ?? "";
      }
      const text = `${p.id} ${p.amount} ${p.status} ${p.type} ${name} ${p.invoiceNumber ?? ""}`.toLowerCase();
      const matchesQuery = text.includes(q);
      const matchesStatus = status ? p.status === status : true;
      return matchesQuery && matchesStatus;
    });
  }, [data.payments, data.students, data.teachers, data.staff, query, status]);

  const handleDownloadInvoice = (payment: typeof filteredPayments[number]) => {
    let payerName = "";
    const additionalInfo: Record<string, string> = {};
    
    if (payment.type === "student" && payment.studentId) {
      const student = data.students.find((s) => s.id === payment.studentId);
      payerName = student?.name || "Unknown Student";
      if (payment.classId) {
        const cls = data.classes.find((c) => c.id === payment.classId);
        if (cls) additionalInfo.classSubject = cls.subject;
      }
    } else if (payment.type === "teacher" && payment.teacherId) {
      const teacher = data.teachers.find((t) => t.id === payment.teacherId);
      payerName = teacher?.name || "Unknown Teacher";
      additionalInfo.teacherName = payerName;
    } else if (payment.type === "staff" && payment.staffId) {
      const staffMember = data.staff.find((s) => s.id === payment.staffId);
      payerName = staffMember?.name || "Unknown Staff";
      additionalInfo.staffName = payerName;
    }
    
    generateInvoicePDF(payment, payerName, additionalInfo);
    toast.success("Invoice downloaded");
  };

  const columns = useMemo<ColumnDef<typeof filteredPayments[number]>[]>(
    () => [
      { header: "ID", accessorKey: "id" },
      { 
        header: "Amount", 
        cell: ({ row }) => `${row.original.amount} DH`
      },
      {
        header: "Type",
        cell: ({ row }) => {
          const type = row.original.type;
          const cls = type === "student" ? "badge badge-info" : type === "teacher" ? "badge badge-warning" : "badge badge-secondary";
          return <span className={cls}>{type}</span>;
        },
      },
      {
        header: "Status",
        cell: ({ row }) => {
          const s = row.original.status;
          const cls = s === "paid" ? "badge badge-success" : s === "pending" ? "badge badge-warning" : s === "cancelled" ? "badge badge-secondary" : "badge";
          return <span className={cls}>{s}</span>;
        },
      },
      {
        header: "Payer/Payee",
        cell: ({ row }) => {
          const p = row.original;
          if (p.type === "student" && p.studentId) {
            return data.students.find((s) => s.id === p.studentId)?.name ?? "-";
          } else if (p.type === "teacher" && p.teacherId) {
            return data.teachers.find((t) => t.id === p.teacherId)?.name ?? "-";
          } else if (p.type === "staff" && p.staffId) {
            return data.staff.find((s) => s.id === p.staffId)?.name ?? "-";
          }
          return "-";
        },
      },
      {
        header: "Class",
        cell: ({ row }) => {
          const cls = data.classes.find((c) => c.id === row.original.classId);
          return cls ? cls.subject : row.original.classId ?? "-";
        },
      },
      {
        header: "Invoice",
        cell: ({ row }) => {
          const p = row.original;
          if (p.status === "paid" && p.invoiceNumber) {
            return (
              <button
                className="btn btn-sm btn-outline"
                onClick={() => handleDownloadInvoice(p)}
              >
                Download
              </button>
            );
          }
          return <span className="text-gray-400 text-sm">-</span>;
        },
      },
      {
        header: "Actions",
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex gap-3">
              <button
                className="btn btn-sm btn-outline"
                onClick={() => router.push(`/payments/${p.id}/edit`)}
              >
                Edit
              </button>
              <button
                className="btn btn-sm btn-ghost text-red-600"
                onClick={() => {
                  if (confirm("Delete this payment?")) {
                    deletePayment(row.original.id);
                    toast.success("Payment deleted");
                  }
                }}
              >
                Delete
              </button>
            </div>
          );
        },
      },
    ],
    [data.students, data.teachers, data.staff, data.classes]
  );

  return (
    <div className="space-y-4">
      <div>
        <Breadcrumbs items={[{ href: "/", label: "Dashboard" }, { label: "Payments" }]} />
        <h1 className="section-title text-gradient">Payments</h1>
        <p className="muted text-sm">Track invoices, filter by status, and edit payments</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar placeholder="Search payments or student" delayMs={0} onChange={setQuery} />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="select-field max-w-40"
        >
          <option value="">All</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          className="btn-primary"
          onClick={() => router.push("/payments/new")}
        >
          Add Payment
        </button>
      </div>
      {filteredPayments.length === 0 ? (
        <EmptyState
          title="No payments found"
          description="Change the filters or add a new payment."
          action={<button className="btn-primary btn-lg" onClick={() => router.push("/payments/new")}>Add Payment</button>}
        />
      ) : (
        <DataTable data={filteredPayments} columns={columns} globalFilter={query} />
      )}
    </div>
  );
}


