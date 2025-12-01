"use client";

export default function Pagination({ total, page, pageSize, onPageChange }: { total: number; page: number; pageSize: number; onPageChange: (p: number) => void }) {
	const pages = Math.max(1, Math.ceil(total / pageSize));
	if (total <= pageSize) return null;
	return (
		<div className="flex items-center justify-between mt-3">
			<span className="muted text-sm">Page {page} of {pages}</span>
			<div className="flex items-center gap-2">
				<button type="button" className="btn btn-outline btn-sm" onClick={(e) => { e.preventDefault(); onPageChange(Math.max(1, page - 1)); }} disabled={page === 1}>Previous</button>
				<button type="button" className="btn btn-outline btn-sm" onClick={(e) => { e.preventDefault(); onPageChange(Math.min(pages, page + 1)); }} disabled={page === pages}>Next</button>
			</div>
		</div>
	);
}
