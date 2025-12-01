"use client";

import { useEffect, useState } from "react";
import Input from "@/components/Input";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const { user, login } = useAuth();
  const { data } = useData();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Redirect based on role
      if (user.role === "parent") {
        router.replace("/parent");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = login(username, password, data.users);
    if (!ok) setError("Invalid credentials");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full card p-8 animate-in">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SchoolYard
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-primary)]">Welcome Back</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">Sign in to your account to continue</p>
        </div>
        
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Input
            label="Username"
            placeholder="admin, staff1, or parent1"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" className="mt-2 btn-primary">
            Sign in
          </button>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-900">
            <p className="font-semibold mb-3">Demo Credentials:</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Admin:</span>
                <code className="bg-white px-2 py-1 rounded text-xs">admin / password</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Staff:</span>
                <code className="bg-white px-2 py-1 rounded text-xs">staff1 / password</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Parent:</span>
                <code className="bg-white px-2 py-1 rounded text-xs">parent1 / password</code>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
