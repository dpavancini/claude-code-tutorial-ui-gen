# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in a chat interface, and Claude generates React code that renders in real-time in an iframe preview.

## Commands

```bash
npm run setup    # Install deps, generate Prisma client, run migrations
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm test         # Run tests with Vitest
```

Run a single test file:
```bash
npx vitest src/lib/__tests__/file-system.test.ts
```

Database commands:
```bash
npx prisma generate     # Regenerate Prisma client after schema changes
npx prisma migrate dev  # Create and apply migrations
npm run db:reset        # Reset database (destructive)
```

## Architecture

### Core Flow
1. User sends message via chat → `/api/chat` route handles with Vercel AI SDK
2. Claude generates code using `str_replace_editor` and `file_manager` tools
3. Tool calls update the `VirtualFileSystem` (in-memory, nothing written to disk)
4. `FileSystemContext` syncs tool results to React state
5. `PreviewFrame` transforms JSX with Babel and renders in sandboxed iframe

### Key Abstractions

**VirtualFileSystem** (`src/lib/file-system.ts`): In-memory file tree with path normalization, CRUD operations, and serialization. Used both server-side (in API route) and client-side (via context).

**AI Tools** (`src/lib/tools/`):
- `str_replace_editor`: File creation, string replacement, line insertion
- `file_manager`: Rename and delete operations

**JSX Transformer** (`src/lib/transform/jsx-transformer.ts`): Converts JSX/TSX to browser-runnable JavaScript using Babel standalone. Creates import maps with blob URLs and handles missing imports by generating placeholder modules.

### State Management
- `FileSystemContext`: Manages virtual file system state and handles tool call side effects
- `ChatContext`: Manages chat messages using Vercel AI SDK's `useChat` hook
- Project persistence: Authenticated users get messages and files saved to SQLite via Prisma

### Authentication
JWT-based auth with `jose` library. Sessions stored in cookies. Anonymous users can use the app but data isn't persisted.

## Tech Stack Notes

- Next.js 15 with App Router and Turbopack
- React 19
- Tailwind CSS v4 (uses `@tailwindcss/postcss`)
- SQLite via Prisma (Prisma client output: `src/generated/prisma`)
- Vercel AI SDK with Anthropic provider
- Monaco Editor for code editing
- shadcn/ui components in `src/components/ui/`

## Environment

`ANTHROPIC_API_KEY`: Optional. Without it, the app returns static mock responses instead of calling Claude.
