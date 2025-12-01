"use client";

import { useId } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  description?: string;
  error?: string;
};

export default function Input({ label, description, error, id, className = "", ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="flex flex-col gap-1 w-full animate-in">
      {label ? (
        <label htmlFor={inputId} className="text-sm text-gray-700">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={`input-field ${error ? "ring-2 ring-red-500" : ""} ${className}`}
        {...props}
      />
      {description ? <p className="text-xs text-gray-500">{description}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}


