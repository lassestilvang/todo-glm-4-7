# AGENTS.md

This file contains guidelines for agentic coding agents working in this repository.

## Build/Lint/Test Commands

### Core Commands
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run all tests with Bun

### Running Single Tests
- `bun test tests/tasks.test.ts` - Run specific test file
- `bun test -t "should create"` - Run tests matching regex pattern
- `bun test -t "Task Repository"` - Run specific test suite

### Testing Notes
- Tests are located in `tests/` directory
- Use Bun test framework with `describe`, `it`, `expect`, `beforeEach`, `afterEach`
- Clean up database state in `beforeEach` and `afterEach` hooks

## Code Style Guidelines

### Imports
- Use `@/` alias for absolute imports (e.g., `@/lib/db`, `@/features/tasks/types`)
- External dependencies first, then internal dependencies
- Prefer named imports; default imports only for React components

### Formatting
- 2-space indentation
- Use `cn()` utility from `@/lib/utils` for conditional classnames (combines clsx and tailwind-merge)
- Use CVA (class-variance-authority) for component variants

### Types
- TypeScript strict mode enabled
- Use `interface` for object shapes, `type` for unions/primitives
- Type unions for enums (e.g., `type Priority = 'high' | 'medium' | 'low' | 'none'`)
- Repository functions return typed promises: `Promise<Task[]>`, `Promise<Task | null>`
- Generic type parameters for reusable functions: `getAsync<T>()`, `allAsync<T>()`

### Naming Conventions
- Files: kebab-case (e.g., `task-item.tsx`, `list-form.tsx`)
- Components: PascalCase functions, export named (e.g., `export function TaskItem()`)
- Functions: camelCase (e.g., `findById`, `createTask`)
- Constants: camelCase for module-level, UPPER_SNAKE_CASE for global
- Database columns: snake_case (e.g., `list_id`, `created_at`)
- Database tables: snake_case (e.g., `task_labels`)
- Variables: camelCase

### Error Handling
- Throw `Error` objects for expected failures (e.g., `'Task not found'`, `'Cannot delete Inbox list'`)
- Use try-catch for async operations with database
- Console.error for unexpected errors (e.g., file deletion failures)
- Don't silence errors without logging

### Project Structure
```
app/              - Next.js app router pages and server actions
  actions.ts      - Server actions (use 'use server' directive)
components/       - React components
  ui/            - Reusable shadcn/ui components
  tasks/         - Task-specific components
  sidebar/       - Sidebar components
features/        - Domain logic organized by feature
  tasks/
    actions.ts   - Repository functions for tasks
    types.ts     - Type definitions
    views.ts     - Query/view functions
  lists/         - List feature
  labels/        - Label feature
lib/             - Utilities and shared code
  db/            - Database setup and async wrappers
  utils.ts       - General utilities (cn, etc.)
  validators/    - Zod schemas
tests/           - Bun test files
```

### Component Patterns
- Server components by default, `'use client'` for interactive components
- Server actions in `app/actions.ts` marked with `'use server'`
- Optional callback props for parent communication (e.g., `onComplete?`, `onDelete?`)
- Use proper TypeScript interfaces for props (e.g., `interface TaskItemProps`)

### Database Patterns
- Repository pattern: `export const taskRepository = { findAll, findById, create, update, delete }`
- Async wrappers from `@/lib/db`: `runAsync`, `getAsync`, `allAsync`
- Use parameterized queries to prevent SQL injection
- `runAsync` returns `{ lastID, changes }` for INSERT/UPDATE
- `getAsync<T>` returns single row or `undefined`, convert to `null` for consistency
- `allAsync<T>` returns array of rows
- Date fields stored as ISO strings in SQLite

### UI Components
- Use shadcn/ui patterns from `components/ui/`
- Radix UI primitives with proper composition
- CVA for variant management (e.g., `buttonVariants`)
- Tailwind utility classes for all styling
- Use data attributes for component variants (e.g., `data-variant`, `data-size`)

### Validation
- Zod schemas in `lib/validators/schema.ts`
- Use type inference: `export type TaskFormData = z.infer<typeof taskSchema>`
- Validate form inputs on client, validate on server in server actions
- Use `.optional()` for optional fields, `.or(z.literal(''))` for empty strings
- Custom validators with `.regex()` for patterns (e.g., time format `HH:mm`)

### Additional Notes
- Database: SQLite3 with WAL mode enabled
- State management: React hooks, no external state library
- Animations: Framer Motion for UI transitions
- Forms: react-hook-form with Zod resolvers
- Icons: lucide-react
- Time tracking: Convert time strings to minutes in DB, back to HH:mm for display
