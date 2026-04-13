import { createFileRoute } from "@tanstack/react-router"
import { db } from "@/db"
import { documents } from "@/db/schema"
import { generateTxId, parseDates } from "@/db/utils"
import { eq } from "drizzle-orm"

export const Route = createFileRoute("/api/documents/mutate")({
	// @ts-expect-error — server.handlers types lag behind runtime support
	server: {
		handlers: {
			POST: async ({ request }: { request: Request }) => {
				const data = parseDates(await request.json())
				let txid: number
				const result = await db.transaction(async (tx) => {
					txid = await generateTxId(tx)
					const { created_at, updated_at, ...rest } = data
					const rows = await tx.insert(documents).values(rest).returning()
					return rows[0]
				})
				return Response.json({ ...result, txid: txid! })
			},
			PUT: async ({ request }: { request: Request }) => {
				const data = parseDates(await request.json())
				let txid: number
				await db.transaction(async (tx) => {
					txid = await generateTxId(tx)
					const { id, created_at, ...rest } = data
					await tx.update(documents).set({ ...rest, updated_at: new Date() }).where(eq(documents.id, id))
				})
				return Response.json({ txid: txid! })
			},
			DELETE: async ({ request }: { request: Request }) => {
				const { id } = await request.json()
				let txid: number
				await db.transaction(async (tx) => {
					txid = await generateTxId(tx)
					await tx.delete(documents).where(eq(documents.id, id))
				})
				return Response.json({ txid: txid! })
			},
		},
	},
})
