import { useState } from "react"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function UserIdentityModal({
	open,
	onJoin,
}: {
	open: boolean
	onJoin: (name: string) => void
}) {
	const [name, setName] = useState("")

	return (
		<Dialog open={open}>
			<DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
				<DialogHeader>
					<DialogTitle>Welcome to CollabEdit</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<Label htmlFor="display-name">Enter your display name</Label>
						<Input
							id="display-name"
							placeholder="Your name..."
							value={name}
							onChange={(e) => setName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && name.trim()) onJoin(name.trim())
							}}
							autoFocus
						/>
					</div>
					<Button
						onClick={() => name.trim() && onJoin(name.trim())}
						disabled={!name.trim()}
					>
						Join
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
