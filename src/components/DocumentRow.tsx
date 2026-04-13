import { Link } from "@tanstack/react-router"
import { Trash2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Document } from "@/db/zod-schemas"

function timeAgo(date: Date): string {
	const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
	if (seconds < 60) return "just now"
	const minutes = Math.floor(seconds / 60)
	if (minutes < 60) return `${minutes}m ago`
	const hours = Math.floor(minutes / 60)
	if (hours < 24) return `${hours}h ago`
	const days = Math.floor(hours / 24)
	return `${days}d ago`
}

export function DocumentRow({
	doc,
	onDelete,
}: {
	doc: Document
	onDelete: (id: string) => void
}) {
	return (
		<Link
			to="/doc/$id"
			params={{ id: doc.id }}
			className="group flex items-center gap-4 rounded-xl border border-border p-4 transition-colors hover:border-[#d0bcff]/30"
		>
			<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d0bcff]/10">
				<FileText className="h-5 w-5 text-[#d0bcff]" />
			</div>
			<div className="flex-1 min-w-0">
				<p className="truncate font-medium">{doc.title}</p>
				<p className="text-xs text-muted-foreground">{timeAgo(doc.updated_at)}</p>
			</div>
			<Button
				variant="ghost"
				size="sm"
				className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
				onClick={(e) => {
					e.preventDefault()
					e.stopPropagation()
					onDelete(doc.id)
				}}
			>
				<Trash2 className="h-4 w-4" />
			</Button>
		</Link>
	)
}
