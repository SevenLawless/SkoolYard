"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Avatar from "@/components/ui/Avatar";
import ThemeToggle from "@/components/ui/ThemeToggle";

const routes = [
  { href: "/", label: "Dashboard" },
  { href: "/students", label: "Students" },
  { href: "/teachers", label: "Teachers" },
  { href: "/staff", label: "Staff" },
  { href: "/classes", label: "Classes" },
  { href: "/payments", label: "Payments" },
];

export function Nav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
	return (
		<nav className="w-full sticky top-0 z-40 border-b border-[var(--color-border)]/50 bg-[var(--color-card)]/90 backdrop-blur-lg supports-[backdrop-filter]:bg-[var(--color-card)]/80 shadow-lg">
			<div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
				<span className="font-bold text-lg tracking-tight text-[var(--color-primary)]">
					<span className="brand-chip">SchoolYard</span>
				</span>
				<ul className="flex items-center gap-1 text-sm">
          {routes.map((r) => {
            const active = pathname === r.href;
            return (
              <li key={r.href}>
                <Link
                  href={r.href}
									className={`px-3 py-2 rounded-lg transition-all duration-300 ${
										active
											? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-semibold shadow-sm border border-blue-200"
											: "hover:bg-gradient-to-r hover:from-[var(--color-surface)] hover:to-[color-mix(in_oklab,var(--color-surface),var(--color-primary)_8%)] text-[color:var(--color-muted)] hover:text-[var(--color-foreground)] hover:scale-105"
									}`}
                >
                  {r.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <ThemeToggle />
          {user ? (
            <>
							<div className="flex items-center gap-2">
								<Avatar name={user.username} />
								<span className="text-gray-600">{user.username} ({user.role})</span>
							</div>
              <button
                className="btn-outline"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
              >
                Logout
              </button>
            </>
          ) : (
						<Link href="/" className="btn-primary">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Nav;


