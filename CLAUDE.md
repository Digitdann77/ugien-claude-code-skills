# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run setup` — Install deps, generate Prisma client, run migrations
- `npm run dev` — Start dev server (Turbopack, http://localhost:3000)
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm test` — Run Vitest suite (all tests)
- `npx vitest run src/components/chat/__tests__/MessageInput.test.tsx` — Run a single test file
- `npm run db:reset` — Hard reset SQLite database

## Architecture

UIGen is an AI-powered React component generator. Users describe components in a chat, Claude generates code via tool calls, and a live preview renders the result in-browser. All generated files live in an in-memory virtual filesystem (no disk I/O).

### Core Flow

1. User sends message → POST `/src/app/api/chat/route.ts` streams Claude response
2. Claude uses `str_replace_editor` and `file_manager` tools to manipulate files
3. `FileSystemProvider` (`/src/lib/contexts/file-system-context.tsx`) handles tool calls and updates the `VirtualFileSystem` instance
4. Preview iframe compiles App.jsx via Babel standalone and renders it
5. For authenticated users, messages + serialized filesystem are saved to the Project model on stream finish

### Key Layers

- **`src/app/`** — Next.js 15 App Router. `[projectId]/` for per-project routes, `api/chat/` for the AI streaming endpoint.
- **`src/lib/contexts/`** — Two main React contexts: `ChatContext` (wraps Vercel AI SDK `useChat`) and `FileSystemContext` (manages `VirtualFileSystem` + tool call handling).
- **`src/lib/file-system.ts`** — `VirtualFileSystem` class: in-memory file tree with create/read/update/delete/rename/serialize/deserialize.
- **`src/lib/tools/`** — AI tool definitions (`str_replace_editor`, `file_manager`) that map to filesystem operations.
- **`src/lib/prompts/generation.tsx`** — System prompt instructing Claude to generate components. Root component must be `/App.jsx`, use Tailwind for styling, use `@/` import alias.
- **`src/lib/provider.ts`** — Returns Anthropic `claude-haiku-4-5` if `ANTHROPIC_API_KEY` is set, otherwise a `MockLanguageModel` for demo mode.
- **`src/lib/auth.ts`** — JWT session management (jose) with httpOnly cookies, 7-day expiry.
- **`src/actions/`** — Server actions for auth (signUp/signIn/signOut) and project CRUD.
- **`src/components/`** — `chat/` (chat interface), `editor/` (Monaco + file tree), `preview/` (live iframe), `ui/` (Radix/shadcn primitives), `auth/` (dialogs).

### Database

The database schema is defined in `prisma/schema.prisma`. Reference it anytime you need to understand the structure of the data stored in the database.

Prisma with SQLite (`prisma/dev.db`). Two models: `User` (email/password) and `Project` (name, messages as JSON string, data as serialized filesystem JSON). Projects have optional userId to support anonymous users.

Prisma client is generated to `src/generated/prisma/` — after schema changes run `npx prisma generate` and `npx prisma migrate dev`.

### Auth

JWT-based sessions via httpOnly cookies. Middleware (`src/middleware.ts`) protects `/api/projects` and `/api/filesystem` routes. Anonymous users can generate components (persisted in localStorage via `anon-work-tracker.ts`) and migrate work to an account on sign-up.

### Environment

- `ANTHROPIC_API_KEY` — Optional. Without it, the app uses a mock provider returning static code.
- `JWT_SECRET` — For session signing. Falls back to a development default.

## Code Style

- Use comments sparingly. Only comment complex code.

## Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json).

## Testing

Tests use Vitest + React Testing Library + jsdom. Test files live in `__tests__/` directories next to the components they test (e.g., `src/components/chat/__tests__/`).



    