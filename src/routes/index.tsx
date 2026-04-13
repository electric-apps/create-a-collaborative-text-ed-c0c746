import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useLiveQuery } from "@tanstack/react-db"
import { documentsCollection } from "@/db/collections/documents"
import { DocumentRow } from "@/components/DocumentRow"
import { Button } from "@/components/ui/button"
import { Plus, FileText } from "lucide-react"

export const Route = createFileRoute("/")({
	ssr: false,
	component: HomePage,
})

function HomePage() {
	const navigate = useNavigate()
	const { data: documents } = useLiveQuery((q) =>
		q.from({ doc: documentsCollection }).orderBy(({ doc }) => doc.updated_at, "desc"),
	)

	const handleNewDocument = async () => {
		const id = crypto.randomUUID()
		documentsCollection.insert({
			id,
			title: "Untitled",
			created_at: new Date(),
			updated_at: new Date(),
		})
		navigate({ to: "/doc/$id", params: { id } })
	}

	const handleDelete = (id: string) => {
		documentsCollection.delete(id)
	}

	return (
		<main className="flex-1">
			<div className="container mx-auto max-w-3xl px-4 py-12">
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Documents</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							Collaborative text editing in real-time
						</p>
					</div>
					<Button onClick={handleNewDocument} className="gap-2">
						<Plus className="h-4 w-4" />
						New Document
					</Button>
				</div>

				{documents.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-xl border border-border py-16">
						<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d0bcff]/10 mb-4">
							<FileText className="h-8 w-8 text-[#d0bcff]" />
						</div>
						<h3 className="text-lg font-medium mb-1">No documents yet</h3>
						<p className="text-sm text-muted-foreground mb-4">
							Create your first document to get started
						</p>
						<Button onClick={handleNewDocument} variant="outline" className="gap-2">
							<Plus className="h-4 w-4" />
							New Document
						</Button>
					</div>
				) : (
					<div className="flex flex-col gap-2">
						{documents.map((doc) => (
							<DocumentRow key={doc.id} doc={doc} onDelete={handleDelete} />
						))}
					</div>
				)}
			</div>
		</main>
	)
}
