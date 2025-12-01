"use client";

export default function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
	return (
		<div className="card p-8 text-center animate-in">
			<div className="mx-auto mb-3 h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">☆</div>
			<h3 className="font-semibold mb-1">{title}</h3>
			{description ? <p className="muted text-sm mb-3">{description}</p> : null}
			{action}
		</div>
	);
}
