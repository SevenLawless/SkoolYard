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
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone must be at least 5 characters"),
  qualifications: z.string().min(2, "Qualifications required"),
  subjects: z.string().min(2, "At least one subject required"),
  salary: z.number().min(0, "Salary must be positive"),
  hasDiscount: z.boolean(),
  discountPercentage: z.number().min(0).max(100).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewTeacherPage() {
  const { addTeacher } = useData();
  const router = useRouter();
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({ 
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      qualifications: "",
      subjects: "",
      salary: 0,
      hasDiscount: false,
      discountPercentage: undefined,
    }
  });

  const hasDiscount = watch("hasDiscount");

  const onSubmit = async (values: FormValues) => {
    const parsedSubjects = values.subjects.split(",").map((s: string) => s.trim()).filter(Boolean);
    const teacherData = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      qualifications: values.qualifications,
      subjects: parsedSubjects,
      salary: values.salary,
      hasDiscount: values.hasDiscount,
      discountPercentage: values.hasDiscount ? values.discountPercentage : undefined,
      classes: [],
      attendance: [],
    };
    
    addTeacher(teacherData);
    toast.success(`${values.name} created successfully!`);
    router.push("/teachers");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Breadcrumbs items={[
          { href: "/dashboard", label: "Dashboard" }, 
          { href: "/teachers", label: "Teachers" },
          { label: "Create New Teacher" }
        ]} />
        <div className="flex items-center gap-4 mt-4">
          <BackButton href="/teachers" />
          <h1 className="section-title text-gradient">Create New Teacher</h1>
        </div>
        <p className="muted text-sm">Add a new teacher to the system</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Personal Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input label="Name" {...register("name")} placeholder="Full name" />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Input label="Email" type="email" {...register("email")} placeholder="email@example.com" />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Input label="Phone" {...register("phone")} placeholder="+212 6 12 34 56 78" />
              {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <Input label="Qualifications" {...register("qualifications")} placeholder="e.g., Master's in Mathematics" />
              {errors.qualifications && <p className="text-sm text-red-600 mt-1">{errors.qualifications.message}</p>}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Teaching Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input label="Subjects (comma separated)" {...register("subjects")} placeholder="e.g., Mathematics, Physics" />
              {errors.subjects && <p className="text-sm text-red-600 mt-1">{errors.subjects.message}</p>}
            </div>

            <div>
              <Input label="Salary (DH)" type="number" step="0.01" {...register("salary", { valueAsNumber: true })} placeholder="2000" />
              {errors.salary && <p className="text-sm text-red-600 mt-1">{errors.salary.message}</p>}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Discount Information
          </h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3 p-4 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all">
              <input type="checkbox" {...register("hasDiscount")} className="w-5 h-5" />
              <div>
                <div className="font-medium text-gray-900">Has Discount</div>
                <div className="text-xs text-gray-500">Enable discount for this teacher</div>
              </div>
            </label>

            {hasDiscount && (
              <div>
                <Input
                  label="Discount Percentage"
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  {...register("discountPercentage", { valueAsNumber: true })}
                  placeholder="0-100"
                />
                {errors.discountPercentage?.message && (
                  <p className="text-sm text-red-600 mt-1">{String(errors.discountPercentage.message)}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border">
          <button
            type="button"
            className="btn btn-outline flex-1"
            onClick={() => router.push("/teachers")}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting ? "Creating..." : "Create Teacher"}
          </button>
        </div>
      </form>
    </div>
  );
}

