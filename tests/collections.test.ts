import { describe, it, expect } from "vitest"
import { generateValidRow } from "./helpers/schema-test-utils"
import { parseDates } from "@/db/utils"
import { documentSelectSchema } from "@/db/zod-schemas"

describe("document collection validation", () => {
	it("validates a complete document row", () => {
		const row = generateValidRow(documentSelectSchema)
		expect(documentSelectSchema.safeParse(row).success).toBe(true)
	})

	it("JSON round-trip: parseDates restores dates for valid row", () => {
		const row = generateValidRow(documentSelectSchema)
		const roundTripped = parseDates(JSON.parse(JSON.stringify(row)))
		expect(documentSelectSchema.safeParse(roundTripped).success).toBe(true)
	})

	it("rejects a document without id", () => {
		const row = generateValidRow(documentSelectSchema)
		delete (row as Record<string, unknown>).id
		expect(documentSelectSchema.safeParse(row).success).toBe(false)
	})
})
