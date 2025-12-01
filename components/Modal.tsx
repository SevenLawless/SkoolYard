"use client";

import { useEffect } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 modal-backdrop animate-in" onClick={onClose} />
      <div className="relative card-glass w-full max-w-xl mx-4 p-6 animate-scale-in shadow-2xl">
        <button
          aria-label="Close"
          className="absolute right-2 top-2 btn btn-ghost"
          onClick={onClose}
        >
          ✕
        </button>
        {title ? <h2 className="font-semibold text-lg mb-3 pr-8">{title}</h2> : null}
        {children}
      </div>
    </div>
  );
}


