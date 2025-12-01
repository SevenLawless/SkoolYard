"use client";

import { useState } from "react";
import { useData } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/Input";
import toast from "react-hot-toast";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import BackButton from "@/components/ui/BackButton";

const schema = z.object({
  amount: z.number().min(0),
  status: z.enum(["paid", "pending", "cancelled"]),
  type: z.enum(["student", "teacher", "staff"]),
  studentId: z.string().optional(),
  teacherId: z.string().optional(),
  staffId: z.string().optional(),
  classId: z.string().optional(),
}).refine((data) => {
  if (data.type === "student") return !!data.studentId;
  if (data.type === "teacher") return !!data.teacherId;
  if (data.type === "staff") return !!data.staffId;
  return false;
}, {
  message: "Please select a student, teacher, or staff member",
  path: ["studentId"],
});

type FormValues = z.infer<typeof schema>;

export default function NewPaymentPage() {
  const { data, addPayment } = useData();
  const router = useRouter();
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({ 
    resolver: zodResolver(schema),
    defaultValues: {
      amount: 0,
      status: "pending",
      type: "student",
      studentId: "",
      teacherId: "",
      staffId: "",
      classId: "",
    }
  });
  
  const paymentType = watch("type");

  const onSubmit = async (values: FormValues) => {
    const paymentData: any = {
      amount: values.amount,
      status: values.status,
      type: values.type,
    };
    
    if (values.type === "student") {
      paymentData.studentId = values.studentId;
      paymentData.classId = values.classId;
    } else if (values.type === "teacher") {
      paymentData.teacherId = values.teacherId;
    } else if (values.type === "staff") {
      paymentData.staffId = values.staffId;
    }
    
    addPayment(paymentData);
    toast.success("Payment added successfully!");
    router.push("/payments");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Breadcrumbs items={[
          { href: "/dashboard", label: "Dashboard" }, 
          { href: "/payments", label: "Payments" },
          { label: "Create New Payment" }
        ]} />
        <div className="flex items-center gap-4 mt-4">
          <BackButton href="/payments" />
          <h1 className="section-title text-gradient">Create New Payment</h1>
        </div>
        <p className="muted text-sm">Record a new payment transaction</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Payment Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input label="Amount (DH)" type="number" step="0.01" {...register("amount", { valueAsNumber: true })} placeholder="0.00" />
              {errors.amount?.message && <p className="text-sm text-red-600 mt-1">{String(errors.amount.message)}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
              <select className="select-field w-full" {...register("status")}>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {errors.status ? <p className="text-sm text-red-600 mt-1">{errors.status.message}</p> : null}
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">Payment Type</label>
              <select className="select-field w-full" {...register("type")}>
                <option value="student">Student Payment</option>
                <option value="teacher">Teacher Payment</option>
                <option value="staff">Staff Payment</option>
              </select>
              {errors.type ? <p className="text-sm text-red-600 mt-1">{errors.type.message}</p> : null}
            </div>
          </div>
        </div>

        {paymentType === "student" && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Student Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Student</label>
                <select className="select-field w-full" {...register("studentId")}>
                  <option value="">Select a student</option>
                  {data.students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {errors.studentId ? <p className="text-sm text-red-600 mt-1">{errors.studentId.message}</p> : null}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Class (Optional)</label>
                <select className="select-field w-full" {...register("classId")}>
                  <option value="">No class</option>
                  {data.classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.subject}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {paymentType === "teacher" && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Teacher Information
            </h2>
            
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Teacher</label>
              <select className="select-field w-full" {...register("teacherId")}>
                <option value="">Select a teacher</option>
                {data.teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              {errors.teacherId ? <p className="text-sm text-red-600 mt-1">{errors.teacherId.message}</p> : null}
            </div>
          </div>
        )}

        {paymentType === "staff" && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Staff Information
            </h2>
            
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Staff</label>
              <select className="select-field w-full" {...register("staffId")}>
                <option value="">Select a staff member</option>
                {data.staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.staffId ? <p className="text-sm text-red-600 mt-1">{errors.staffId.message}</p> : null}
            </div>
          </div>
        )}

        <div className="flex gap-3 sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border">
          <button
            type="button"
            className="btn btn-outline flex-1"
            onClick={() => router.push("/payments")}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting ? "Creating..." : "Create Payment"}
          </button>
        </div>
      </form>
    </div>
  );
}

