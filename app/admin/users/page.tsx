"use client";

import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import type { User, StaffPermissions } from "@/lib/data";
import toast from "react-hot-toast";
import Modal from "@/components/Modal";

export default function UserManagement() {
  const { user, isAdmin } = useAuth();
  const { data, updateUser, deleteUser } = useData();
  const router = useRouter();
  
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "staff" | "parent">("all");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch users from database
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.users) {
          setUsers(result.users);
        }
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && isAdmin()) {
      fetchUsers();
    }
  }, [user, isAdmin, fetchUsers]);

  // Refresh users when page becomes visible (e.g., after returning from another page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && isAdmin()) {
        fetchUsers();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, isAdmin, fetchUsers]);

  useEffect(() => {
    if (!user) {
      router.push("/");
    } else if (!isAdmin()) {
      router.push("/dashboard");
      toast.error("Access denied: Admin only");
    }
  }, [user, isAdmin, router]);

  // Refresh users from database (alias for fetchUsers, but doesn't set loading)
  const refreshUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.users) {
          setUsers(result.users);
        }
      }
    } catch (error) {
      console.error('Error refreshing users:', error);
    }
  }, []);

  // Filter users based on search and role
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.role === "admin").length,
    staff: users.filter(u => u.role === "staff").length,
    parents: users.filter(u => u.role === "parent").length,
  }), [users]);

  if (!user || !isAdmin()) {
    return null;
  }

  const handleAddUser = () => {
    router.push("/admin/users/new");
  };

  const handleEditUser = (userToEdit: User) => {
    router.push(`/admin/users/${userToEdit.id}/edit`);
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user.id) {
      toast.error("You cannot delete your own account");
      return;
    }
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        // TODO: Add DELETE endpoint for users
        // For now, just refresh the list
        await refreshUsers();
        toast.success("User list refreshed");
      } catch (error) {
        toast.error("Failed to refresh user list");
      }
    }
  };

  const handleManagePermissions = (userToEdit: User) => {
    if (userToEdit.role !== "staff") {
      toast.error("Only staff users have configurable permissions");
      return;
    }
    setSelectedUserForPermissions(userToEdit);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case "staff":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "parent":
        return "bg-green-100 text-green-800 border border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-primary)]">User Management</h1>
          <p className="text-[var(--color-muted)] mt-1">Manage system users, roles, and permissions</p>
        </div>
        <button onClick={handleAddUser} className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Total Users</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="card p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Admins</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{stats.admins}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-4 bg-gradient-to-br from-blue-50 to-indigo-100 border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-800">Staff Members</p>
              <p className="text-3xl font-bold text-indigo-900 mt-1">{stats.staff}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Parents</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{stats.parents}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users by name, username, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input w-full pl-10"
              />
              <svg 
                className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="md:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as "all" | "admin" | "staff" | "parent")}
              className="input w-full"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="parent">Parent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
            <p className="text-[var(--color-muted)] mt-4">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-[var(--color-muted)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-lg font-semibold text-[var(--color-primary)] mb-2">No users found</h3>
            <p className="text-[var(--color-muted)]">
              {searchQuery || roleFilter !== "all" 
                ? "Try adjusting your search or filters" 
                : "Get started by adding your first user"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-surface)] border-b-2 border-[var(--color-border)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)] bg-white">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--color-surface)] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-[var(--color-primary)]">{u.name}</div>
                          <div className="text-xs text-[var(--color-muted)]">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[var(--color-primary)]">@{u.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-bold rounded-full ${getRoleBadgeColor(u.role)}`}>
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[var(--color-muted)]">{u.phone || "—"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-[var(--color-muted)]">
                        {u.role === "staff" && u.staffId && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Linked
                          </span>
                        )}
                        {u.role === "parent" && u.studentIds && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            {u.studentIds.length} {u.studentIds.length === 1 ? 'Student' : 'Students'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.role === "staff" && (
                          <button
                            onClick={() => handleManagePermissions(u)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Manage Permissions"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleEditUser(u)}
                          className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            u.id === user.id 
                              ? "text-gray-300 cursor-not-allowed" 
                              : "text-red-600 hover:text-red-900 hover:bg-red-50"
                          }`}
                          title={u.id === user.id ? "Cannot delete yourself" : "Delete User"}
                          disabled={u.id === user.id}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Permissions Modal */}
      <PermissionsModal
        isOpen={!!selectedUserForPermissions}
        user={selectedUserForPermissions}
        onClose={() => setSelectedUserForPermissions(null)}
        onSave={async (permissions) => {
          if (selectedUserForPermissions) {
            updateUser(selectedUserForPermissions.id, { permissions });
            await refreshUsers();
            toast.success("Permissions updated successfully!");
            setSelectedUserForPermissions(null);
          }
        }}
      />
    </div>
  );
}

// Permissions Modal Component
function PermissionsModal({
  isOpen,
  user,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (permissions: StaffPermissions) => void;
}) {
  const [permissions, setPermissions] = useState<StaffPermissions>({
    viewStudents: false,
    editStudents: false,
    deleteStudents: false,
    viewTeachers: false,
    editTeachers: false,
    deleteTeachers: false,
    viewClasses: false,
    editClasses: false,
    deleteClasses: false,
    viewPayments: false,
    editPayments: false,
    deletePayments: false,
    viewStaff: false,
    editStaff: false,
    deleteStaff: false,
    viewMarketing: false,
    editMarketing: false,
    deleteMarketing: false,
    viewDashboard: false,
  });

  // Update permissions when user changes
  useEffect(() => {
    if (user?.permissions) {
      setPermissions(user.permissions);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const permissionGroups = [
    { 
      key: "Dashboard", 
      icon: "📊",
      permissions: ["viewDashboard"],
      description: "Access to main dashboard and analytics"
    },
    { 
      key: "Students", 
      icon: "👨‍🎓",
      permissions: ["viewStudents", "editStudents", "deleteStudents"],
      description: "Manage student records and information"
    },
    { 
      key: "Teachers", 
      icon: "👨‍🏫",
      permissions: ["viewTeachers", "editTeachers", "deleteTeachers"],
      description: "Manage teacher profiles and assignments"
    },
    { 
      key: "Classes", 
      icon: "📚",
      permissions: ["viewClasses", "editClasses", "deleteClasses"],
      description: "Manage class schedules and details"
    },
    { 
      key: "Payments", 
      icon: "💳",
      permissions: ["viewPayments", "editPayments", "deletePayments"],
      description: "Handle payment records and transactions"
    },
    { 
      key: "Staff", 
      icon: "👥",
      permissions: ["viewStaff", "editStaff", "deleteStaff"],
      description: "Manage staff member information"
    },
    { 
      key: "Marketing", 
      icon: "📈",
      permissions: ["viewMarketing", "editMarketing", "deleteMarketing"],
      description: "Access marketing and financial data"
    },
  ];

  const handleToggleAll = (groupPermissions: string[], value: boolean) => {
    const newPermissions = { ...permissions };
    groupPermissions.forEach((perm) => {
      newPermissions[perm as keyof StaffPermissions] = value;
    });
    setPermissions(newPermissions);
  };

  const isGroupFullyEnabled = (groupPermissions: string[]) => {
    return groupPermissions.every((perm) => permissions[perm as keyof StaffPermissions]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(permissions);
  };

  const formatPermissionName = (perm: string) => {
    return perm.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
  };

  return (
    <Modal open={isOpen} onClose={onClose} title={`Permissions for ${user.name}`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Configure access levels</strong> for <span className="font-semibold">{user.name}</span>. 
            Enable or disable specific permissions to control what they can view and modify in the system.
          </p>
        </div>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {permissionGroups.map((group) => {
            const allEnabled = isGroupFullyEnabled(group.permissions);
            
            return (
              <div key={group.key} className="border-2 border-[var(--color-border)] rounded-lg overflow-hidden">
                <div className="bg-[var(--color-surface)] p-4 border-b border-[var(--color-border)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{group.icon}</span>
                      <div>
                        <h3 className="font-bold text-[var(--color-primary)]">{group.key}</h3>
                        <p className="text-xs text-[var(--color-muted)] mt-0.5">{group.description}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleAll(group.permissions, !allEnabled)}
                      className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
                        allEnabled 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {allEnabled ? '✓ All Enabled' : 'Enable All'}
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-3 bg-white">
                  {group.permissions.map((perm) => (
                    <label 
                      key={perm} 
                      className="flex items-center gap-3 cursor-pointer p-3 hover:bg-[var(--color-surface)] rounded-lg transition-colors group"
                    >
                      <input
                        type="checkbox"
                        checked={permissions[perm as keyof StaffPermissions]}
                        onChange={(e) =>
                          setPermissions({ ...permissions, [perm]: e.target.checked })
                        }
                        className="w-5 h-5 rounded border-2 border-gray-300 checked:bg-blue-600 checked:border-blue-600 transition-all"
                      />
                      <span className="text-sm font-medium group-hover:text-[var(--color-primary)] transition-colors">
                        {formatPermissionName(perm)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t-2 border-[var(--color-border)]">
          <button type="button" onClick={onClose} className="btn-outline px-6">
            Cancel
          </button>
          <button type="submit" className="btn-primary px-6">
            Save Permissions
          </button>
        </div>
      </form>
    </Modal>
  );
}
