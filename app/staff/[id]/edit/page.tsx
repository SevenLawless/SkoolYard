"use client";

import { useMemo, useEffect } from "react";
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
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone must be at least 5 characters"),
  salary: z.number().min(0, "Salary must be positive"),
});

type FormValues = z.infer<typeof schema>;

export default function EditStaffPage() {
  const { data, updateStaff } = useData();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const staff = useMemo(() => {
    return data.staff.find(s => s.id === id);
  }, [data.staff, id]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ 
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      salary: 0,
    }
  });

  useEffect(() => {
    if (staff) {
      reset({
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        salary: staff.salary,
      });
    }
  }, [staff, reset]);

  const onSubmit = async (values: FormValues) => {
    const staffData = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      salary: values.salary,
    };
    
    updateStaff(id, staffData);
    toast.success("Staff member updated successfully!");
    router.push(`/staff/${id}`);
  };

  if (!staff) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ href: "/dashboard", label: "Dashboard" }, { href: "/staff", label: "Staff" }, { label: "Edit" }]} />
        <div className="card p-8 text-center">
          <p className="text-gray-500">Staff member not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Breadcrumbs items={[
          { href: "/dashboard", label: "Dashboard" }, 
          { href: "/staff", label: "Staff" },
          { href: `/staff/${id}`, label: staff.name },
          { label: "Edit" }
        ]} />
        <div className="flex items-center gap-4 mt-4">
          <BackButton href={`/staff/${id}`} />
          <h1 className="section-title text-gradient">Edit {staff.name}</h1>
        </div>
        <p className="muted text-sm">Update staff member information</p>
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
              <Input label="Name" {...register("name")} />
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Input label="Email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Input label="Phone" {...register("phone")} />
              {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <Input label="Salary (DH)" type="number" step="0.01" {...register("salary", { valueAsNumber: true })} />
              {errors.salary && <p className="text-sm text-red-600 mt-1">{errors.salary.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex gap-3 sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border">
          <button
            type="button"
            className="btn btn-outline flex-1"
            onClick={() => router.push(`/staff/${id}`)}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

