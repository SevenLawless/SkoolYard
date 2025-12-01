"use client";

export default function Avatar({ name, src, size = 28 }: { name: string; src?: string; size?: number }) {
	const initials = name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
	return (
		<span
			className="inline-flex items-center justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-medium"
			style={{ width: size, height: size }}
			aria-label={name}
			title={name}
		>
			{src ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img alt={name} src={src} className="rounded-full w-full h-full object-cover" />
			) : (
				<span className="text-[color:var(--color-muted)]">{initials}</span>
			)}
		</span>
	);
}
