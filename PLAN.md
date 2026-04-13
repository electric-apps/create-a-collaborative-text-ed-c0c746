# PLAN.md — Collaborative Text Editor

## App Description

A real-time collaborative rich-text editor where multiple users can edit the same document simultaneously, with live cursors, user presence indicators, and a document library for managing multiple documents. Built on Yjs CRDTs over Durable Streams for conflict-free concurrent editing.

---

## User Flows

### 1. Home — Document Library
1. User opens the app at `/`.
2. They see a list of existing documents (title, last-modified timestamp, created-by display name).
3. A "New Document" button creates a blank document and navigates to the editor.
4. Clicking any document row navigates to `/doc/$id`.

### 2. Editor — Collaborative Editing
1. User lands on `/doc/$id`.
2. The rich-text editor loads with the document's current content (synced via Yjs).
3. The user can type, format text (bold, italic, underline, heading levels, bullet/ordered lists), and the changes propagate to all other connected clients within ~100 ms.
4. Other users' cursors and selections are rendered with distinct colors and name labels (Yjs Awareness).
5. A presence bar at the top of the editor shows avatars/initials for all currently-connected users with their assigned cursor color.
6. The document title is editable inline at the top; changes sync to Postgres via a debounced server mutation.
7. A back arrow navigates back to the document list (`/`).

### 3. User Identity
1. On first visit (no name set), a modal prompts the user to enter a display name.
2. The name is stored in `localStorage` and used for Yjs Awareness presence data.
3. No authentication required — display name only.

---

## Data Model

```ts
// src/db/schema.ts

import { pgTable, text, uuid, timestamp } from "drizzle-orm/pg-core";

export const documents = pgTable("documents", {
  id:         uuid("id").primaryKey().defaultRandom(),
  title:      text("title").notNull().default("Untitled"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

> **Note:** Document *content* is stored entirely in the Yjs CRDT state (Durable Streams), not in Postgres. Only document metadata (title, timestamps) lives in the database.

---

## Key Technical Decisions

| Problem | Product | Package |
|---|---|---|
| Document metadata (list, title, timestamps) — live-synced to all clients | Electric SQL shapes + TanStack DB | `@electric-sql/client` + `@tanstack/db` + `@tanstack/react-db` |
| Concurrent rich-text editing with CRDT conflict resolution | Y-Durable-Streams (Yjs provider) | `@durable-streams/y-durable-streams` |
| Live presence (cursors, selections, who's online) | Yjs Awareness (built into `@durable-streams/y-durable-streams`) | `@durable-streams/y-durable-streams` |
| Schema definition and migrations | Drizzle ORM | `drizzle-orm` + `drizzle-kit` |
| API routes and server-side mutations | TanStack Start | `@tanstack/react-start` |
| UI components | shadcn/ui + Tailwind | `@/components/ui/*` |
| Rich-text editor | TipTap (with Yjs collaboration extension) | `@tiptap/react` + `@tiptap/extension-collaboration` + `@tiptap/extension-collaboration-cursor` |

**Why Y-Durable-Streams over Electric for content:** Document content needs concurrent CRDT editing — multiple users typing simultaneously in the same paragraph. Electric shapes are for CRUD entities with last-write-wins semantics and would produce conflicting overwrites. Yjs handles this at the character-level via CRDTs.

**Why Electric for metadata:** Document titles, created_at, and updated_at are simple scalar fields edited by one user at a time. Electric shapes + TanStack DB give a live-synced document list with optimistic updates.

**Why Yjs Awareness for presence:** Cursors and user-online state are ephemeral (don't need to survive a page refresh). Yjs Awareness is co-located with the Yjs provider already in use — zero extra infrastructure.

> **Credential requirement:** Before the first stream operation, the coder must follow the Electric CLI flow in the `room-messaging` skill and store the resulting Yjs service URL + secret via `set_secret`.

---

## Implementation Tasks

### Phase 1: Project Setup & Schema

- [ ] Run the Electric CLI provisioning flow (follow `skills/room-messaging/SKILL.md` "Electric CLI — Provisioning External Services") to create a Yjs/Durable Streams service; store the service URL and secret via `set_secret`.
- [ ] Define the `documents` table in `src/db/schema.ts` using Drizzle (see Data Model above).
- [ ] Generate and run the initial migration with `drizzle-kit`.
- [ ] Add a `drizzle-zod` insert schema for `documents` for server-side validation.

### Phase 2: Document List (Home Route `/`)

- [ ] Create a TipTap-compatible Yjs service proxy route at `src/routes/api/yjs-proxy.ts` that injects the `Authorization: Bearer <secret>` header and forwards to the Durable Streams Yjs service. Follow the canonical proxy pattern from `skills/create-app/SKILL.md` "Pattern: Yjs service proxy" (forward `stream-next-offset`; strip `content-encoding`).
- [ ] Create an Electric shape proxy route for the `documents` table at `src/routes/api/shape-proxy.ts`.
- [ ] Define a TanStack DB collection for `documents` pointing at the shape proxy.
  - Include `z.coerce.date()` in the collection schema for `created_at` / `updated_at`.
  - Include a `timestamptz` parser in `shapeOptions` for the same columns.
- [ ] Build the home route `src/routes/index.tsx` with `ssr: false`:
  - Use a live query to display the document list sorted by `updated_at` descending.
  - Each row shows: document title, relative "last modified" time, a delete icon button.
  - "New Document" button calls a server function that inserts a blank document and returns the new ID, then navigates to `/doc/$id`.
  - Delete button calls a server function that deletes the document by ID.

### Phase 3: Editor Route `/doc/$id`

- [ ] Create `src/routes/doc.$id.tsx` with `ssr: false`.
- [ ] On mount (client-side only), initialize a `Y.Doc` keyed to the document ID and connect it to the Yjs service via `@durable-streams/y-durable-streams`, routing through the server-side proxy route (so the secret is never exposed to the browser).
- [ ] Set up Yjs Awareness on the provider with the user's display name and a randomly-assigned color (seeded from the user's name for consistency within a session).
- [ ] Wire up TipTap with:
  - The `Collaboration` extension backed by the Y.Doc.
  - The `CollaborationCursor` extension backed by the Yjs Awareness instance.
  - Extensions for: `Bold`, `Italic`, `Underline`, `Heading` (levels 1–3), `BulletList`, `OrderedList`, `Paragraph`, `Document`, `Text`.
- [ ] Render the TipTap editor with a clean prose styling (Tailwind `prose` class or equivalent).
- [ ] Render a toolbar above the editor with buttons for: Bold, Italic, Underline, H1/H2/H3, Bullet list, Ordered list. Buttons show active state when the current selection has the format.
- [ ] Render a presence bar that reads from Yjs Awareness: show a colored avatar/initial chip for each connected user (excluding self). Cap display at 5 avatars + "+N more" overflow.
- [ ] Render an editable inline title at the top of the page that:
  - Reads the current title from the TanStack DB `documents` collection (live query by ID).
  - On blur, calls a server function to update `documents.title` and `documents.updated_at` in Postgres.
- [ ] Add a back arrow (`←`) that navigates to `/`.
- [ ] On unmount (route leave), destroy the Yjs provider to clean up the stream subscription.

### Phase 4: User Identity Modal

- [ ] On app startup (`src/routes/__root.tsx`), check `localStorage` for a saved display name.
- [ ] If absent, show a centered modal (shadcn `Dialog`) prompting "Enter your display name" with a text input and a "Join" button.
- [ ] On submit, save the name to `localStorage` and close the modal.
- [ ] Expose the display name via a React context so the editor route can read it for Yjs Awareness.

### Phase 5: Polish & UX

- [ ] Use a consistent color palette for user cursors — assign colors from a fixed palette (e.g., 8 distinct colors) by hashing the user's display name so the same user always gets the same color within a session.
- [ ] Add a loading skeleton for the editor while the Yjs provider is connecting (show a pulsing placeholder text area).
- [ ] Add a subtle "connected" / "connecting…" status indicator in the editor header.
- [ ] Ensure the TipTap editor area fills the available viewport height (minus toolbar + title) with a scrollable overflow.
- [ ] On mobile (< 640 px), collapse the toolbar into a single-row scrollable strip.

### Phase 6: README

- [ ] Write `README.md` documenting: project description, how to run locally (`npm install`, `npm run dev`), environment variables needed, and a brief explanation of the tech stack choices.

---

## File Layout (Target)

```
src/
  routes/
    __root.tsx          — root layout, user-identity modal, display-name context
    index.tsx           — document list (ssr: false)
    doc.$id.tsx         — collaborative editor (ssr: false)
    api/
      shape-proxy.ts    — Electric shape proxy for documents
      yjs-proxy.ts      — Yjs / Durable Streams proxy (injects auth header)
      documents.ts      — mutation routes: create, delete, update title
  db/
    schema.ts           — Drizzle pgTable definitions
    index.ts            — Drizzle client export
  collections/
    documents.ts        — TanStack DB collection for documents
  components/
    EditorToolbar.tsx   — TipTap formatting toolbar
    PresenceBar.tsx     — Yjs Awareness presence chips
    UserIdentityModal.tsx — display name prompt dialog
    DocumentRow.tsx     — row component for document list
  lib/
    user-color.ts       — deterministic color assignment from display name hash
```
