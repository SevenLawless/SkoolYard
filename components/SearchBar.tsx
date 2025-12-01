"use client";

import { useEffect, useState } from "react";
import Input from "@/components/Input";

export default function SearchBar({
  placeholder = "Search...",
  onChange,
  delayMs = 250,
}: {
  placeholder?: string;
  onChange: (value: string) => void;
  delayMs?: number;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (delayMs <= 0) {
      onChange(value);
      return;
    }
    const id = setTimeout(() => onChange(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs, onChange]);

  return (
    <div className="w-full relative">
      <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-[color:var(--color-muted)]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 3.473 9.8l3.113 3.113a.75.75 0 1 0 1.06-1.06l-3.113-3.114A5.5 5.5 0 0 0 9 3.5Zm-4 5.5a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" clipRule="evenodd" />
        </svg>
      </span>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-8"
      />
    </div>
  );
}


