import type { Editor } from "@tiptap/react"
import { cn } from "@/lib/utils"
import {
	Bold,
	Italic,
	Underline,
	Heading1,
	Heading2,
	Heading3,
	List,
	ListOrdered,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

function ToolbarButton({
	onClick,
	isActive,
	children,
	title,
}: {
	onClick: () => void
	isActive: boolean
	children: React.ReactNode
	title: string
}) {
	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={onClick}
			title={title}
			className={cn(
				"h-8 w-8 p-0",
				isActive && "bg-[#d0bcff]/20 text-[#d0bcff]",
			)}
		>
			{children}
		</Button>
	)
}

export function EditorToolbar({ editor }: { editor: Editor | null }) {
	if (!editor) return null

	return (
		<div className="flex items-center gap-0.5 overflow-x-auto border-b border-border px-2 py-1">
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleBold().run()}
				isActive={editor.isActive("bold")}
				title="Bold"
			>
				<Bold className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleItalic().run()}
				isActive={editor.isActive("italic")}
				title="Italic"
			>
				<Italic className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleUnderline().run()}
				isActive={editor.isActive("underline")}
				title="Underline"
			>
				<Underline className="h-4 w-4" />
			</ToolbarButton>

			<Separator orientation="vertical" className="mx-1 h-6" />

			<ToolbarButton
				onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
				isActive={editor.isActive("heading", { level: 1 })}
				title="Heading 1"
			>
				<Heading1 className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				isActive={editor.isActive("heading", { level: 2 })}
				title="Heading 2"
			>
				<Heading2 className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
				isActive={editor.isActive("heading", { level: 3 })}
				title="Heading 3"
			>
				<Heading3 className="h-4 w-4" />
			</ToolbarButton>

			<Separator orientation="vertical" className="mx-1 h-6" />

			<ToolbarButton
				onClick={() => editor.chain().focus().toggleBulletList().run()}
				isActive={editor.isActive("bulletList")}
				title="Bullet List"
			>
				<List className="h-4 w-4" />
			</ToolbarButton>
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
				isActive={editor.isActive("orderedList")}
				title="Ordered List"
			>
				<ListOrdered className="h-4 w-4" />
			</ToolbarButton>
		</div>
	)
}
