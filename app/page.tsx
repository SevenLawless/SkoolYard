"use client";

import { useEffect, useState } from "react";
import Input from "@/components/Input";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getPasswordRequirements } from "@/lib/auth/passwordValidation";

export default function Home() {
  const router = useRouter();
  const { user, login, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get CSRF token on mount
  useEffect(() => {
    fetch('/api/auth/csrf')
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.token))
      .catch((err) => console.error('Failed to get CSRF token:', err));
  }, []);

  useEffect(() => {
    if (user && !loading) {
      // Redirect based on role
      if (user.role === "parent") {
        router.replace("/parent");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, loading, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    if (!csrfToken) {
      setError("CSRF token not loaded. Please refresh the page.");
      return;
    }

    setIsSubmitting(true);
    const result = await login(username, password, csrfToken);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || "Invalid credentials");
    }
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
          <button 
            type="submit" 
            className="mt-2 btn-primary"
            disabled={isSubmitting || !csrfToken}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
          <div className="mt-2 text-xs text-[var(--color-muted)]">
            <p className="font-semibold mb-1">Password Requirements:</p>
            <p>{getPasswordRequirements()}</p>
          </div>
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
