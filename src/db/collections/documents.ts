import { createCollection } from "@tanstack/react-db"
import { electricCollectionOptions } from "@tanstack/electric-db-collection"
import { absoluteApiUrl } from "@/lib/client-url"
import { documentSelectSchema } from "@/db/zod-schemas"

export const documentsCollection = createCollection(
	electricCollectionOptions({
		id: "documents",
		schema: documentSelectSchema,
		getKey: (row) => row.id,
		shapeOptions: {
			url: absoluteApiUrl("/api/documents"),
			parser: {
				timestamptz: (v: string) => new Date(v),
			},
		},
		onInsert: async ({ transaction }) => {
			const { modified: doc } = transaction.mutations[0]
			const res = await fetch("/api/documents/mutate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(doc),
			})
			const { txid } = await res.json()
			return { txid }
		},
		onUpdate: async ({ transaction }) => {
			const { modified: doc } = transaction.mutations[0]
			const res = await fetch("/api/documents/mutate", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(doc),
			})
			const { txid } = await res.json()
			return { txid }
		},
		onDelete: async ({ transaction }) => {
			const { original: doc } = transaction.mutations[0]
			const res = await fetch("/api/documents/mutate", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: doc.id }),
			})
			const { txid } = await res.json()
			return { txid }
		},
	}),
)
