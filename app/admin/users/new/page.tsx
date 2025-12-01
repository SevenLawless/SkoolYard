"use client";

import { useState } from "react";
import { useData } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import toast from "react-hot-toast";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import BackButton from "@/components/ui/BackButton";
import Input from "@/components/Input";
import type { User, StaffPermissions } from "@/lib/data";

export default function NewUserPage() {
  const { data, addUser } = useData();
  const router = useRouter();
  const { isAdmin } = useAuth();
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "staff" as "admin" | "staff" | "parent",
    name: "",
    email: "",
    phone: "",
    staffId: "",
    studentIds: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isAdmin()) {
    router.push("/dashboard");
    return null;
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Check for duplicate username
    const existingUser = data.users.find((u) => u.username === formData.username);
    if (existingUser) {
      newErrors.username = "Username already exists";
    }

    if (formData.role === "parent" && formData.studentIds.length === 0) {
      newErrors.studentIds = "Please select at least one student";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    const userData: Omit<User, "id"> = {
      username: formData.username.trim(),
      password: formData.password,
      role: formData.role,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
    };

    if (formData.role === "staff") {
      userData.staffId = formData.staffId || undefined;
      userData.permissions = {
        viewStudents: true,
        editStudents: true,
        deleteStudents: false,
        viewTeachers: true,
        editTeachers: false,
        deleteTeachers: false,
        viewClasses: true,
        editClasses: true,
        deleteClasses: false,
        viewPayments: true,
        editPayments: true,
        deletePayments: false,
        viewStaff: true,
        editStaff: false,
        deleteStaff: false,
        viewMarketing: true,
        editMarketing: false,
        deleteMarketing: false,
        viewDashboard: true,
      } as StaffPermissions;
    }

    if (formData.role === "parent") {
      userData.studentIds = formData.studentIds;
    }

    addUser(userData);
    toast.success("User created successfully!");
    router.push("/admin/users");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <Breadcrumbs items={[
          { href: "/dashboard", label: "Dashboard" }, 
          { href: "/admin/users", label: "User Management" },
          { label: "Create New User" }
        ]} />
        <div className="flex items-center gap-4 mt-4">
          <BackButton href="/admin/users" />
          <h1 className="section-title text-gradient">Create New User</h1>
        </div>
        <p className="muted text-sm">Add a new user account to the system</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Account Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className={`input-field w-full ${errors.username ? 'border-red-500' : ''}`}
                placeholder="e.g., jsmith"
              />
              {errors.username && <p className="text-xs text-red-600 mt-1">{errors.username}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`input-field w-full ${errors.password ? 'border-red-500' : ''}`}
                placeholder="••••••••"
              />
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Personal Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`input-field w-full ${errors.name ? 'border-red-500' : ''}`}
                placeholder="e.g., John Smith"
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`input-field w-full ${errors.email ? 'border-red-500' : ''}`}
                placeholder="john@example.com"
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field w-full"
                placeholder="+212 6 12 34 56 78"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as "admin" | "staff" | "parent", staffId: "", studentIds: [] })}
                className="select-field w-full"
              >
                <option value="admin">Admin - Full system access</option>
                <option value="staff">Staff - Configurable permissions</option>
                <option value="parent">Parent - View student information only</option>
              </select>
            </div>
          </div>
        </div>

        {formData.role === "staff" && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Staff Link (Optional)
            </h2>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label className="block text-sm font-semibold mb-2">Link to Staff Member</label>
              <select
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                className="select-field w-full"
              >
                <option value="">-- Select Staff Member --</option>
                {data.staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - {s.email}
                  </option>
                ))}
              </select>
              <p className="text-xs text-blue-700 mt-2">Link this user account to an existing staff member record</p>
            </div>
          </div>
        )}

        {formData.role === "parent" && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Linked Students <span className="text-red-500">*</span>
            </h2>
            <div className={`p-4 border rounded-lg ${errors.studentIds ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-300 rounded p-3 bg-white">
                {data.students.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No students available</p>
                ) : (
                  data.students.map((s) => (
                    <label key={s.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.studentIds.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, studentIds: [...formData.studentIds, s.id] });
                          } else {
                            setFormData({
                              ...formData,
                              studentIds: formData.studentIds.filter((id) => id !== s.id),
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{s.name}</div>
                        <div className="text-xs text-gray-500">{s.email}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
              {errors.studentIds && <p className="text-xs text-red-600 mt-2">{errors.studentIds}</p>}
              <p className="text-xs text-green-700 mt-2">Select the students this parent can access</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border">
          <button
            type="button"
            className="btn btn-outline flex-1"
            onClick={() => router.push("/admin/users")}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary flex-1"
          >
            Create User
          </button>
        </div>
      </form>
    </div>
  );
}

