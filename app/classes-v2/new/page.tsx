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
  subject: z.string().min(2, "Class name must be at least 2 characters"),
  teacherId: z.string().min(1, "Please select a teacher"),
  duration: z.string().min(1, "Duration is required"),
  fees: z.number().min(0, "Fees must be positive"),
  feeType: z.enum(["monthly", "agreed"]),
  daysOfWeek: z.array(z.string()).min(1, "Select at least one day"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  teacherShare: z.number().min(0).max(100, "Must be between 0-100"),
  centerShare: z.number().min(0).max(100, "Must be between 0-100"),
  socialMediaActive: z.boolean(),
  providesCertification: z.boolean(),
  classroomId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewClassV2Page() {
  const { data, addClass } = useData();
  const router = useRouter();
  
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({ 
    resolver: zodResolver(schema),
    defaultValues: {
      subject: "",
      teacherId: data.teachers[0]?.id ?? "",
      duration: "",
      fees: 0,
      feeType: "monthly",
      daysOfWeek: [],
      time: "10:00",
      teacherShare: 70,
      centerShare: 30,
      socialMediaActive: false,
      providesCertification: false,
      classroomId: "",
    }
  });

  const teacherShare = watch("teacherShare");
  const centerShare = watch("centerShare");

  // Auto-adjust shares to total 100%
  const handleTeacherShareChange = (value: number) => {
    setValue("teacherShare", value);
    setValue("centerShare", 100 - value);
  };

  const handleCenterShareChange = (value: number) => {
    setValue("centerShare", value);
    setValue("teacherShare", 100 - value);
  };

  const onSubmit = async (values: FormValues) => {
    const parsedDays = values.daysOfWeek.map((d: string) => Number(d)).filter((n: number) => !Number.isNaN(n));
    
    const classData = {
      subject: values.subject,
      teacherId: values.teacherId,
      fees: values.fees,
      daysOfWeek: parsedDays,
      time: values.time,
      socialMediaActive: values.socialMediaActive,
      providesCertification: values.providesCertification,
      studentIds: [],
      schedule: [],
      adExpenses: [],
      classroomId: values.classroomId || undefined,
    };
    
    addClass(classData);
    toast.success(`${values.subject} created successfully!`);
    router.push("/classes-v2");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Breadcrumbs items={[
          { href: "/dashboard", label: "Dashboard" }, 
          { href: "/classes-v2", label: "Classes v2" },
          { label: "Create New Class" }
        ]} />
        <div className="flex items-center gap-4 mt-4">
          <BackButton href="/classes-v2" />
          <h1 className="section-title text-gradient">Create New Class</h1>
        </div>
        <p className="muted text-sm">Set up a comprehensive class with all details, schedule, and financial arrangements</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input label="Class Name" {...register("subject")} placeholder="e.g., Advanced Mathematics" />
              {errors.subject && <p className="text-sm text-red-600 mt-1">{errors.subject.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Teacher</label>
              <select className="select-field w-full" {...register("teacherId")}>
                <option value="">Select a teacher</option>
                {data.teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} - {t.subjects.join(", ")}</option>
                ))}
              </select>
              {errors.teacherId && <p className="text-sm text-red-600 mt-1">{errors.teacherId.message}</p>}
            </div>

            <div>
              <Input label="Class Duration" {...register("duration")} placeholder="e.g., 1.5 hours, 90 minutes" />
              {errors.duration && <p className="text-sm text-red-600 mt-1">{errors.duration.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Room</label>
              <select className="select-field w-full" {...register("classroomId")}>
                <option value="">No room assigned</option>
                {data.classrooms.map((room) => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>
              {errors.classroomId && <p className="text-sm text-red-600 mt-1">{errors.classroomId.message}</p>}
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Financial Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Input label="Fees (DH)" type="number" step="0.01" {...register("fees", { valueAsNumber: true })} placeholder="500" />
              {errors.fees && <p className="text-sm text-red-600 mt-1">{errors.fees.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Fee Type</label>
              <select className="select-field w-full" {...register("feeType")}>
                <option value="monthly">Monthly Payment</option>
                <option value="agreed">Agreed Upon Amount (One-time/Custom)</option>
              </select>
              {errors.feeType && <p className="text-sm text-red-600 mt-1">{errors.feeType.message}</p>}
            </div>
          </div>

          {/* Revenue Split */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Revenue Split</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-purple-700 block mb-2">Teacher Share (%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={teacherShare}
                  onChange={(e) => handleTeacherShareChange(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-2xl font-bold text-purple-900">{teacherShare}%</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={teacherShare}
                    onChange={(e) => handleTeacherShareChange(Number(e.target.value))}
                    className="input-field w-20 text-center"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-pink-700 block mb-2">Learning Center Share (%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={centerShare}
                  onChange={(e) => handleCenterShareChange(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-2xl font-bold text-pink-900">{centerShare}%</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={centerShare}
                    onChange={(e) => handleCenterShareChange(Number(e.target.value))}
                    className="input-field w-20 text-center"
                  />
                </div>
              </div>
            </div>
            {(teacherShare + centerShare) !== 100 && (
              <p className="text-sm text-red-600 mt-2">⚠️ Shares must total 100%</p>
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Class Days</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: "0", label: "Sunday" },
                  { value: "1", label: "Monday" },
                  { value: "2", label: "Tuesday" },
                  { value: "3", label: "Wednesday" },
                  { value: "4", label: "Thursday" },
                  { value: "5", label: "Friday" },
                  { value: "6", label: "Saturday" },
                ].map((day) => (
                  <label key={day.value} className="flex items-center gap-2 p-3 border-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-all">
                    <input
                      type="checkbox"
                      value={day.value}
                      {...register("daysOfWeek")}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium">{day.label}</span>
                  </label>
                ))}
              </div>
              {errors.daysOfWeek && <p className="text-sm text-red-600 mt-2">{errors.daysOfWeek.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input label="Class Time" type="time" {...register("time")} />
                {errors.time && <p className="text-sm text-red-600 mt-1">{errors.time.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Options */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Additional Options
          </h2>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all">
              <input type="checkbox" {...register("socialMediaActive")} className="w-5 h-5" />
              <div>
                <div className="font-medium text-gray-900">Social Media Advertising 📱</div>
                <div className="text-xs text-gray-500">Enable marketing campaigns for this class</div>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all">
              <input type="checkbox" {...register("providesCertification")} className="w-5 h-5" />
              <div>
                <div className="font-medium text-gray-900">Provides Certification 🎓</div>
                <div className="text-xs text-gray-500">Students receive a certificate upon completion</div>
              </div>
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border">
          <button
            type="button"
            className="btn btn-outline flex-1"
            onClick={() => router.push("/classes-v2")}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (teacherShare + centerShare) !== 100}
            className="btn-primary flex-1"
          >
            {isSubmitting ? "Creating..." : "Create Class"}
          </button>
        </div>
      </form>
    </div>
  );
}

