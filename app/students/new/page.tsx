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
  address: z.string().min(3, "Address must be at least 3 characters"),
  dob: z.string().min(4, "Please enter a valid date"),
  hasDiscount: z.boolean(),
  discountPercentage: z.number().min(0).max(100).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewStudentPage() {
  const { addStudent } = useData();
  const router = useRouter();
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({ 
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      dob: "",
      hasDiscount: false,
      discountPercentage: undefined,
    }
  });

  const hasDiscount = watch("hasDiscount");

  const onSubmit = async (values: FormValues) => {
    const studentData = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      address: values.address,
      dob: values.dob,
      hasDiscount: values.hasDiscount,
      discountPercentage: values.hasDiscount ? values.discountPercentage : undefined,
      classes: [],
      attendance: [],
      tasks: [],
    };
    
    addStudent(studentData);
    toast.success(`${values.name} created successfully!`);
    router.push("/students");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Breadcrumbs items={[
          { href: "/dashboard", label: "Dashboard" }, 
          { href: "/students", label: "Students" },
          { label: "Create New Student" }
        ]} />
        <div className="flex items-center gap-4 mt-4">
          <BackButton href="/students" />
          <h1 className="section-title text-gradient">Create New Student</h1>
        </div>
        <p className="muted text-sm">Add a new student to the system</p>
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
              <Input label="Date of Birth" type="date" {...register("dob")} />
              {errors.dob && <p className="text-sm text-red-600 mt-1">{errors.dob.message}</p>}
            </div>

            <div className="md:col-span-2">
              <Input label="Address" {...register("address")} placeholder="Street address" />
              {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>}
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
                <div className="text-xs text-gray-500">Enable discount for this student</div>
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
            onClick={() => router.push("/students")}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting ? "Creating..." : "Create Student"}
          </button>
        </div>
      </form>
    </div>
  );
}

