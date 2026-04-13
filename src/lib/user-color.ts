const COLORS = [
	"#d0bcff", // purple
	"#75fbfd", // cyan
	"#ff8c3b", // orange
	"#f85149", // red
	"#9ecbff", // blue
	"#d29922", // yellow
	"#00d2a0", // green
	"#e88de8", // pink
]

export function getUserColor(name: string): string {
	let hash = 0
	for (let i = 0; i < name.length; i++) {
		hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
	}
	return COLORS[Math.abs(hash) % COLORS.length]
}
