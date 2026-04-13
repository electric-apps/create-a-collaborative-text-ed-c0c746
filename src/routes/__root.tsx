import { createContext, useContext, useState, useEffect } from "react"
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router"
import appCss from "../styles.css?url"
import { UserIdentityModal } from "@/components/UserIdentityModal"

const DisplayNameContext = createContext<string>("")

export function useDisplayName() {
	return useContext(DisplayNameContext)
}

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "CollabEdit" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	shellComponent: RootDocument,
	component: RootComponent,
})

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark">
			<head>
				<HeadContent />
			</head>
			<body className="min-h-screen bg-background text-foreground antialiased">
				{children}
				<Scripts />
			</body>
		</html>
	)
}

function RootComponent() {
	const [displayName, setDisplayName] = useState<string>("")
	const [showModal, setShowModal] = useState(false)

	useEffect(() => {
		const stored = localStorage.getItem("collab-display-name")
		if (stored) {
			setDisplayName(stored)
		} else {
			setShowModal(true)
		}
	}, [])

	const handleJoin = (name: string) => {
		localStorage.setItem("collab-display-name", name)
		setDisplayName(name)
		setShowModal(false)
	}

	return (
		<DisplayNameContext.Provider value={displayName}>
			<div className="flex min-h-screen flex-col">
				<Outlet />
				<footer className="border-t border-[#2a2c34] py-6 mt-auto">
					<div className="container mx-auto max-w-5xl px-4 flex items-center justify-between text-xs text-muted-foreground">
						<div className="flex items-center gap-2">
							<svg className="h-4 w-4" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg">
								<path d="M106.992 16.1244C107.711 15.4029 108.683 15 109.692 15H170L84.0082 101.089C83.2888 101.811 82.3171 102.213 81.3081 102.213H21L106.992 16.1244Z" fill="#d0bcff" />
								<path d="M96.4157 104.125C96.4157 103.066 97.2752 102.204 98.331 102.204H170L96.4157 176V104.125Z" fill="#d0bcff" />
							</svg>
							<span>Built with <a href="https://electric-sql.com" target="_blank" rel="noopener noreferrer" className="text-[#d0bcff] hover:underline">Electric</a></span>
						</div>
						<span>&copy; {new Date().getFullYear()} Electric SQL</span>
					</div>
				</footer>
			</div>
			<UserIdentityModal open={showModal} onJoin={handleJoin} />
		</DisplayNameContext.Provider>
	)
}
