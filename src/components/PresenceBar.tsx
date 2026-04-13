import { useEffect, useState } from "react"
import type { Awareness } from "y-protocols/awareness"
import { getUserColor } from "@/lib/user-color"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface AwarenessUser {
	name: string
	color: string
}

export function PresenceBar({
	awareness,
	currentName,
}: {
	awareness: Awareness | null
	currentName: string
}) {
	const [users, setUsers] = useState<AwarenessUser[]>([])

	useEffect(() => {
		if (!awareness) return

		const update = () => {
			const states = awareness.getStates()
			const others: AwarenessUser[] = []
			states.forEach((state, clientId) => {
				if (clientId === awareness.clientID) return
				if (state.user?.name) {
					others.push({
						name: state.user.name,
						color: state.user.color || getUserColor(state.user.name),
					})
				}
			})
			setUsers(others)
		}

		awareness.on("change", update)
		update()
		return () => {
			awareness.off("change", update)
		}
	}, [awareness])

	if (users.length === 0) return null

	const visible = users.slice(0, 5)
	const overflow = users.length - 5

	return (
		<TooltipProvider>
			<div className="flex items-center gap-1.5">
				{visible.map((user, i) => (
					<Tooltip key={`${user.name}-${i}`}>
						<TooltipTrigger asChild>
							<div
								className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium"
								style={{ backgroundColor: user.color, color: "#1b1b1f" }}
							>
								{user.name[0].toUpperCase()}
							</div>
						</TooltipTrigger>
						<TooltipContent>{user.name}</TooltipContent>
					</Tooltip>
				))}
				{overflow > 0 && (
					<div className="flex h-7 items-center rounded-full bg-muted px-2 text-xs text-muted-foreground">
						+{overflow}
					</div>
				)}
			</div>
		</TooltipProvider>
	)
}
