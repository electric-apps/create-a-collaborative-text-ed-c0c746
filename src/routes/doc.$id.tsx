import { createFileRoute, Link } from "@tanstack/react-router"
import { useLiveQuery, eq } from "@tanstack/react-db"
import { useEffect, useRef, useState, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Collaboration from "@tiptap/extension-collaboration"
import CollaborationCaret from "@tiptap/extension-collaboration-caret"
import Underline from "@tiptap/extension-underline"
import Placeholder from "@tiptap/extension-placeholder"
import * as Y from "yjs"
import { Awareness } from "y-protocols/awareness"
import { YjsProvider } from "@durable-streams/y-durable-streams"
import { absoluteApiUrl } from "@/lib/client-url"
import { documentsCollection } from "@/db/collections/documents"
import { useDisplayName } from "@/routes/__root"
import { getUserColor } from "@/lib/user-color"
import { EditorToolbar } from "@/components/EditorToolbar"
import { PresenceBar } from "@/components/PresenceBar"
import { ArrowLeft, Wifi, WifiOff } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"

export const Route = createFileRoute("/doc/$id")({
	ssr: false,
	component: EditorPage,
})

function EditorPage() {
	const { id } = Route.useParams()
	const displayName = useDisplayName()
	const [ydoc] = useState(() => new Y.Doc())
	const [awareness] = useState(() => new Awareness(ydoc))
	const providerRef = useRef<YjsProvider | null>(null)
	const [synced, setSynced] = useState(false)
	const [connectionStatus, setConnectionStatus] = useState<string>("connecting")

	const { data: docs } = useLiveQuery((q) =>
		q.from({ doc: documentsCollection }).where(({ doc }) => eq(doc.id, id)),
	)
	const currentDoc = docs[0]

	// Connect Yjs provider
	useEffect(() => {
		const provider = new YjsProvider({
			doc: ydoc,
			baseUrl: absoluteApiUrl("/api/yjs"),
			docId: id,
			awareness,
		})

		provider.on("synced", (s: boolean) => {
			setSynced(s)
			if (s) setConnectionStatus("connected")
		})
		provider.on("status", (status: string) => {
			setConnectionStatus(status)
		})

		providerRef.current = provider

		return () => {
			provider.destroy()
			providerRef.current = null
		}
	}, [id, ydoc, awareness])

	// Set awareness state when display name is ready
	useEffect(() => {
		if (!displayName) return
		const color = getUserColor(displayName)
		awareness.setLocalStateField("user", {
			name: displayName,
			color,
		})
	}, [displayName, awareness])

	const editor = useEditor(
		{
			extensions: [
				StarterKit.configure({
					history: false,
				}),
				Underline,
				Placeholder.configure({
					placeholder: "Start writing...",
				}),
				Collaboration.configure({
					document: ydoc,
				}),
				CollaborationCaret.configure({
					provider: { awareness },
				}),
			],
			editorProps: {
				attributes: {
					class: "prose prose-invert max-w-none focus:outline-none min-h-[calc(100vh-220px)] px-6 py-4",
				},
			},
		},
		[ydoc],
	)

	// Debounced title update
	const titleTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
	const handleTitleChange = useCallback(
		(newTitle: string) => {
			if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current)
			titleTimeoutRef.current = setTimeout(() => {
				if (currentDoc) {
					documentsCollection.update(currentDoc.id, (draft) => {
						draft.title = newTitle
						draft.updated_at = new Date()
					})
				}
			}, 500)
		},
		[currentDoc],
	)

	return (
		<main className="flex flex-1 flex-col">
			{/* Header */}
			<div className="flex items-center gap-3 border-b border-border px-4 py-3">
				<Link to="/" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
					<ArrowLeft className="h-5 w-5" />
				</Link>

				<Input
					value={currentDoc?.title ?? ""}
					onChange={(e) => handleTitleChange(e.target.value)}
					className="h-8 border-none bg-transparent text-lg font-semibold shadow-none focus-visible:ring-0 px-2"
					placeholder="Untitled"
				/>

				<div className="ml-auto flex items-center gap-3">
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						{connectionStatus === "connected" ? (
							<>
								<Wifi className="h-3.5 w-3.5 text-[#d0bcff]" />
								<span>Connected</span>
							</>
						) : (
							<>
								<WifiOff className="h-3.5 w-3.5" />
								<span className="capitalize">{connectionStatus}</span>
							</>
						)}
					</div>
					<PresenceBar awareness={awareness} currentName={displayName} />
				</div>
			</div>

			{/* Toolbar */}
			<EditorToolbar editor={editor} />

			{/* Editor */}
			{!synced ? (
				<div className="flex-1 px-6 py-4">
					<Skeleton className="mb-4 h-8 w-2/3" />
					<Skeleton className="mb-2 h-4 w-full" />
					<Skeleton className="mb-2 h-4 w-5/6" />
					<Skeleton className="mb-2 h-4 w-4/6" />
					<Skeleton className="h-4 w-3/6" />
				</div>
			) : (
				<EditorContent editor={editor} className="flex-1" />
			)}
		</main>
	)
}
