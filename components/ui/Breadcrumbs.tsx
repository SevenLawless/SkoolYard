"use client";

import Link from "next/link";

export type Crumb = { href?: string; label: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
	return (
		<nav aria-label="Breadcrumb" className="text-sm mb-2">
			<ol className="flex items-center gap-1 text-[color:var(--color-muted)]">
				{items.map((c, i) => (
					<li key={`${c.label}-${i}`} className="inline-flex items-center gap-1">
						{i > 0 ? <span className="text-[color:var(--color-muted)]">/</span> : null}
						{c.href ? (
							<Link href={c.href} className="hover:underline">
								{c.label}
							</Link>
						) : (
							<span className="text-[var(--color-foreground)]">{c.label}</span>
						)}
					</li>
				))}
			</ol>
		</nav>
	);
}
