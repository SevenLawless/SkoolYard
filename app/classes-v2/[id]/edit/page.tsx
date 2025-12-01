"use client";

import { useState, useMemo, useEffect } from "react";
import { useData } from "@/lib/store";
import { useRouter, useParams } from "next/navigation";
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

export default function EditClassV2Page() {
  const { data, updateClass, enrollStudentInClass, unenrollStudentFromClass } = useData();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [enrollmentSearchQuery, setEnrollmentSearchQuery] = useState("");

  const selectedClass = useMemo(() => {
    return data.classes.find(c => c.id === id);
  }, [data.classes, id]);

  const classStudents = useMemo(() => {
    if (!selectedClass) return [];
    return data.students.filter(s => selectedClass.studentIds.includes(s.id));
  }, [selectedClass, data.students]);

  const availableStudents = useMemo(() => {
    if (!selectedClass) return [];
    return data.students.filter(s => {
      const isEnrolled = selectedClass.studentIds.includes(s.id);
      const matchesSearch = enrollmentSearchQuery.trim() === "" || 
        s.name.toLowerCase().includes(enrollmentSearchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(enrollmentSearchQuery.toLowerCase());
      return !isEnrolled && matchesSearch;
    });
  }, [selectedClass, data.students, enrollmentSearchQuery]);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ 
    resolver: zodResolver(schema),
    defaultValues: {
      subject: "",
      teacherId: "",
      duration: "",
      fees: 0,
      feeType: "monthly",
      daysOfWeek: [],
      time: "10:00",
      teacherShare: 70,
      centerShare: 30,
      socialMediaActive: false,
      providesCertification: false,
    }
  });

  useEffect(() => {
    if (selectedClass) {
      reset({
        subject: selectedClass.subject,
        teacherId: selectedClass.teacherId,
        duration: "1.5 hours", // Default as we don't store this yet
        fees: selectedClass.fees,
        feeType: "monthly",
        daysOfWeek: (selectedClass.daysOfWeek ?? []).map(String),
        time: selectedClass.time ?? "10:00",
        teacherShare: 70,
        centerShare: 30,
        socialMediaActive: selectedClass.socialMediaActive,
        providesCertification: selectedClass.providesCertification,
        classroomId: selectedClass.classroomId || "",
      });
    }
  }, [selectedClass, reset]);

  const teacherShare = watch("teacherShare");
  const centerShare = watch("centerShare");

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
      classroomId: values.classroomId || undefined,
    };
    
    updateClass(id, classData);
    toast.success("Class updated successfully!");
    router.push(`/classes-v2/${id}`);
  };

  if (!selectedClass) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Breadcrumbs items={[
          { href: "/dashboard", label: "Dashboard" }, 
          { href: "/classes-v2", label: "Classes v2" },
          { href: `/classes-v2/${id}`, label: selectedClass.subject },
          { label: "Edit" }
        ]} />
        <div className="flex items-center gap-4 mt-4">
          <BackButton href={`/classes-v2/${id}`} />
          <h1 className="section-title text-gradient">Edit {selectedClass.subject}</h1>
        </div>
        <p className="muted text-sm">Update class details, manage students, and adjust settings</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Student Management Section */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Enrolled Students ({classStudents.length})
          </h2>

          {/* Add Student */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search students to enroll..."
                value={enrollmentSearchQuery}
                onChange={(e) => setEnrollmentSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {enrollmentSearchQuery && (
                <button
                  type="button"
                  onClick={() => setEnrollmentSearchQuery("")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              )}
            </div>
            {availableStudents.length > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {availableStudents.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      enrollStudentInClass(s.id, id);
                      toast.success(`${s.name} enrolled`);
                      setEnrollmentSearchQuery("");
                    }}
                    className="w-full text-left p-3 bg-white hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{s.name}</div>
                      <div className="text-sm text-gray-500">{s.email}</div>
                    </div>
                    <span className="text-blue-600 group-hover:text-blue-800 font-medium">+ Enroll</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                {enrollmentSearchQuery ? "No students found matching your search" : "All students are enrolled"}
              </div>
            )}
          </div>

          {/* Students List */}
          {classStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No students enrolled yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {classStudents.map((student) => (
                <div key={student.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-xs text-gray-600">{student.email}</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost text-red-600"
                    onClick={() => {
                      if (confirm(`Remove ${student.name}?`)) {
                        unenrollStudentFromClass(student.id, id);
                        toast.success("Student removed");
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rest of the form - similar to create page */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input label="Class Name" {...register("subject")} />
              {errors.subject && <p className="text-sm text-red-600 mt-1">{errors.subject.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Teacher</label>
              <select className="select-field w-full" {...register("teacherId")}>
                {data.teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} - {t.subjects.join(", ")}</option>
                ))}
              </select>
            </div>
            <div>
              <Input label="Duration" {...register("duration")} />
            </div>
            <div>
              <Input label="Fees (DH)" type="number" step="0.01" {...register("fees", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Room</label>
              <select className="select-field w-full" {...register("classroomId")}>
                <option value="">No room assigned</option>
                {data.classrooms.map((room) => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule</h2>
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
                  <label key={day.value} className="flex items-center gap-2 p-3 border-2 rounded-lg hover:bg-blue-50 cursor-pointer">
                    <input type="checkbox" value={day.value} {...register("daysOfWeek")} className="w-5 h-5" />
                    <span className="text-sm font-medium">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Input label="Class Time" type="time" {...register("time")} />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Options</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 border-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" {...register("socialMediaActive")} className="w-5 h-5" />
              <div>
                <div className="font-medium text-gray-900">Social Media Advertising 📱</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-4 border-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" {...register("providesCertification")} className="w-5 h-5" />
              <div>
                <div className="font-medium text-gray-900">Provides Certification 🎓</div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" className="btn btn-outline flex-1" onClick={() => router.push(`/classes-v2/${id}`)}>
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

