"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Avatar from "@/components/ui/Avatar";
import { useState, useEffect } from "react";

const routes = [
  { 
    href: "/dashboard", 
    label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  { 
    href: "/marketing", 
    label: "Financials",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  { 
    href: "/students", 
    label: "Students",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  { 
    href: "/teachers", 
    label: "Teachers",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    href: "/classes-v2", 
    label: "Classes",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )
  },
  { 
    href: "/classrooms", 
    label: "Rooms",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
  { 
    href: "/payments", 
    label: "Payments",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  { 
    href: "/staff", 
    label: "Staff",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isParent, hasPermission } = useAuth();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hide sidebar on login page
  const isLoginPage = pathname === "/";

  // Filter routes based on role and permissions
  const visibleRoutes = routes.filter((route) => {
    // Parents only see parent dashboard
    if (isParent()) return false;
    
    // Check staff permissions
    if (user?.role === "staff") {
      switch (route.href) {
        case "/dashboard":
          return hasPermission("viewDashboard");
        case "/marketing":
          return hasPermission("viewMarketing");
        case "/students":
          return hasPermission("viewStudents");
        case "/teachers":
          return hasPermission("viewTeachers");
        case "/classes-v2":
          return hasPermission("viewClasses");
        case "/classrooms":
          return hasPermission("viewClasses");
        case "/payments":
          return hasPermission("viewPayments");
        case "/staff":
          return hasPermission("viewStaff");
        default:
          return false;
      }
    }
    
    // Admins see everything
    return true;
  });

  // Update body margin based on sidebar state
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const main = document.querySelector('main');
      if (main) {
        // No margin on login page
        if (isLoginPage) {
          main.style.marginLeft = '0';
        } else {
          main.style.marginLeft = collapsed ? '5rem' : '16rem';
        }
      }
    }
  }, [collapsed, isLoginPage]);

  // Hide sidebar on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setMobileOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Don't render sidebar on login page
  if (isLoginPage) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--color-card)] border border-[var(--color-border)] shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-screen bg-[var(--color-card)] border-r border-[var(--color-border)] transition-all duration-300 z-50 flex flex-col shadow-xl ${
        collapsed ? 'w-20' : 'w-64'
      } ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo & Toggle */}
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          {!collapsed && (
            <Link href="/dashboard" className="font-bold text-xl tracking-tight text-[var(--color-primary)]">
              <span className="brand-chip">SchoolYard</span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {isParent() ? (
            // Parent-specific navigation
            <Link
              href="/parent"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                pathname === "/parent"
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                  : "text-[var(--color-muted)] hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-800"
              }`}
              title={collapsed ? "My Students" : undefined}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {!collapsed && <span className="font-medium">My Students</span>}
            </Link>
          ) : (
            // Admin and Staff navigation
            <>
              {visibleRoutes.map((route) => {
                const active = isActive(route.href);
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                      active
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                        : "text-[var(--color-muted)] hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-800"
                    }`}
                    title={collapsed ? route.label : undefined}
                  >
                    <span className={active ? "text-white" : ""}>{route.icon}</span>
                    {!collapsed && (
                      <span className={`font-medium ${active ? 'text-white' : ''}`}>{route.label}</span>
                    )}
                  </Link>
                );
              })}
              {user?.role === "admin" && (
                <Link
                  href="/admin/users"
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                    pathname === "/admin/users"
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                      : "text-[var(--color-muted)] hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-800"
                  }`}
                  title={collapsed ? "User Management" : undefined}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {!collapsed && <span className="font-medium">User Management</span>}
                </Link>
              )}
            </>
          )}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-[var(--color-border)] space-y-3">
          {user ? (
            <>
              {!collapsed && (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--color-surface)]">
                  <Avatar name={user.name} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{user.name}</div>
                    <div className="text-xs text-[var(--color-muted)] truncate capitalize">{user.role}</div>
                  </div>
                </div>
              )}
              {collapsed && (
                <div className="flex justify-center">
                  <Avatar name={user.name} />
                </div>
              )}
              <button
                className={`w-full btn-outline flex items-center justify-center gap-2 ${collapsed ? 'px-2' : ''}`}
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                title={collapsed ? "Logout" : undefined}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {!collapsed && <span>Logout</span>}
              </button>
            </>
          ) : (
            !collapsed && (
              <Link href="/" className="btn-primary w-full text-center block">
                Login
              </Link>
            )
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

export default Sidebar;

