"use client";

import { useEffect, useMemo, useState } from "react";
import { useData } from "@/lib/store";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/Input";
import toast from "react-hot-toast";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

export default function EditClassPage() {
  const { data, updateMarketingClass } = useData();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const marketingClass = useMemo(() => {
    return data.marketingClasses.find((c) => c.id === id) ?? null;
  }, [data.marketingClasses, id]);

  const schema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    fees: z.number().min(0, "Fees must be positive"),
    profitSharingPercentage: z.number().min(0).max(100, "Must be between 0-100"),
    daysOfWeek: z.array(z.string()).optional(),
    time: z.string().optional(),
  });

  type FormValues = z.infer<typeof schema>;
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (marketingClass) {
      reset({
        name: marketingClass.name,
        description: marketingClass.description,
        fees: marketingClass.fees,
        profitSharingPercentage: marketingClass.profitSharingPercentage,
        daysOfWeek: (marketingClass.daysOfWeek ?? []).map(String),
        time: marketingClass.time ?? "10:00",
      });
    } else if (id) {
      toast.error("Class not found");
      router.push("/marketing");
    }
  }, [marketingClass, id, router, reset]);

  const profitSharing = watch("profitSharingPercentage");

  const onSubmit = async (values: FormValues) => {
    if (!marketingClass) return;

    const parsedDays = values.daysOfWeek?.map((d: string) => Number(d)).filter((n: number) => !Number.isNaN(n)) ?? [];
    
    updateMarketingClass(marketingClass.id, { 
      name: values.name,
      description: values.description,
      fees: values.fees,
      profitSharingPercentage: values.profitSharingPercentage,
      centerPercentage: 100 - values.profitSharingPercentage,
      daysOfWeek: parsedDays.length > 0 ? parsedDays : undefined,
      time: values.time || undefined,
    });

    toast.success("Class updated successfully!");
    router.push(`/marketing/${marketingClass.id}`);
  };

  if (!marketingClass) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-700">Class not found</h2>
          <p className="text-gray-500 mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Breadcrumbs 
          items={[
            { href: "/dashboard", label: "Dashboard" }, 
            { href: "/marketing", label: "Financials" },
            { href: `/marketing/${id}`, label: marketingClass.name },
            { label: "Edit" }
          ]} 
        />
        <h1 className="section-title text-gradient">Edit Class</h1>
        <p className="text-gray-600 mt-2">
          Update the class details below. Note: Students, teachers, and expenses are managed from the class details page.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information Section */}
        <div className="card-glass p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Basic Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <Input 
                label="Class Name *" 
                placeholder="e.g., Digital Marketing Bootcamp - Partnership with TechCorp"
                {...register("name")} 
              />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="text-sm text-gray-700 font-medium">Description *</label>
              <textarea
                className="input-field w-full min-h-[120px] mt-1"
                placeholder="Detailed description of the class..."
                {...register("description")}
              />
              {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
            </div>
          </div>
        </div>

        {/* Financial Details Section */}
        <div className="card-glass p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Financial Details & Profit Sharing
          </h2>

          <div className="space-y-6">
            <div>
              <Input 
                label="Fees per Student (DH) *" 
                type="number" 
                step="0.01"
                placeholder="e.g., 2500"
                {...register("fees", { valueAsNumber: true })} 
              />
              {errors.fees && <p className="text-sm text-red-600 mt-1">{errors.fees.message}</p>}
            </div>

            <div>
              <label className="text-sm text-gray-700 font-medium mb-3 block">
                Profit Sharing Agreement *
              </label>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200 mb-3">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-center flex-1">
                    <div className="text-3xl font-bold text-blue-600">{100 - (profitSharing || 0)}%</div>
                    <div className="text-xs text-gray-600 font-medium">Learning Center</div>
                  </div>
                  <div className="text-2xl text-gray-400 mx-4">⇄</div>
                  <div className="text-center flex-1">
                    <div className="text-3xl font-bold text-purple-600">{profitSharing || 0}%</div>
                    <div className="text-xs text-gray-600 font-medium">Teacher(s)</div>
                  </div>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className="w-full h-3 bg-gradient-to-r from-blue-300 to-purple-300 rounded-lg appearance-none cursor-pointer"
                  {...register("profitSharingPercentage", { valueAsNumber: true })}
                />
                
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>← More for Center</span>
                  <span>Teacher Percentage: {profitSharing || 0}%</span>
                  <span>More for Teachers →</span>
                </div>
              </div>
              
              {errors.profitSharingPercentage && <p className="text-sm text-red-600">{errors.profitSharingPercentage.message}</p>}
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="card-glass p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Class Schedule
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-700 font-medium">Days of the Week</label>
              <select 
                className="select-field mt-1" 
                multiple 
                size={7} 
                {...register("daysOfWeek")}
              >
                <option value="0">Sunday</option>
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
                <option value="6">Saturday</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple days</p>
            </div>

            <div>
              <label className="text-sm text-gray-700 font-medium">Class Time</label>
              <Input type="time" className="mt-1" {...register("time")} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={() => router.push(`/marketing/${id}`)}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="btn-primary btn-lg"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

