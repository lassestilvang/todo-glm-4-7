# Daily Planner

A modern, professional daily planner web application built with Next.js, TypeScript, and SQLite.

## Features

### Core Features
- **Lists**: Create custom task lists with custom names, colors, and emojis
- **Tasks**: Comprehensive task management with:
  - Name, description, deadline, and reminder time
  - Time tracking (estimated and actual time)
  - Priority levels (High, Medium, Low, None)
  - Labels with icons
  - Subtasks support
  - Recurring tasks (Daily, Weekly, Weekdays, Monthly, Yearly, Custom)
  - File attachments
  - Complete change log history

### Views
- **Today**: Tasks scheduled for today
- **Next 7 Days**: Tasks for the next week
- **Upcoming**: All future tasks
- **All Tasks**: Complete task list

### Task Management
- Sidebar navigation
- Subtasks and checklists
- Overdue task highlighting
- Fast fuzzy search
- Toggle completed tasks visibility

## Tech Stack

- **Runtime**: Bun
- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Animations**: Framer Motion
- **Database**: SQLite (better-sqlite3)
- **Forms**: React Hook Form + Zod validation
- **Date Handling**: date-fns
- **Testing**: Bun Test

## Getting Started

### Prerequisites
- Bun installed on your system

### Installation

1. Navigate to project directory:
```bash
cd todo-planner
```

2. Install dependencies (already done):
```bash
bun install
```

3. Run the development server:
```bash
bun run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Running Tests

Run all tests:
```bash
bun test
```

## Project Structure

```
todo-planner/
├── app/                      # Next.js App Router pages
│   ├── today/               # Today view
│   ├── next-7-days/         # Next 7 days view
│   ├── upcoming/            # Upcoming view
│   └── all/                 # All tasks view
├── components/              # React components
│   ├── ui/                 # shadcn/ui components
│   ├── sidebar/            # Sidebar navigation
│   └── tasks/              # Task-related components
├── features/               # Feature-based modules
│   ├── tasks/              # Task management
│   ├── lists/              # List management
│   ├── labels/             # Label management
│   └── audit-log/          # Change logging
├── lib/                    # Utilities
│   ├── db/                 # Database schema and setup
│   ├── validators/         # Zod validation schemas
│   └── utils/              # Helper functions
├── public/                 # Static assets
│   └── uploads/            # File attachments
└── tests/                  # Test files
```

## Database Schema

The application uses SQLite with the following tables:

- `lists`: Task lists (including Inbox)
- `tasks`: Main tasks with all properties
- `labels`: Custom labels
- `task_labels`: Many-to-many relationship between tasks and labels
- `task_attachments`: File attachments for tasks
- `change_logs`: Complete history of all task changes

## Features Implementation

### Recurring Tasks
The application supports multiple recurring patterns:
- Daily: Every day
- Weekly: Every week
- Weekdays: Monday through Friday
- Monthly: Same day each month
- Yearly: Same day each year
- Custom: Every N weeks

### Change Logging
All changes to tasks are automatically logged, tracking:
- What field changed
- Old value
- New value
- When the change occurred

### Priority Levels
Tasks can have four priority levels:
- **High**: Urgent tasks
- **Medium**: Important but not urgent
- **Low**: Nice to do
- **None**: No specific priority

## Development

### Adding New Features

1. **Database Changes**: Update `lib/db/schema.ts`
2. **Type Definitions**: Update `features/*/types.ts`
3. **Business Logic**: Update `features/*/actions.ts`
4. **UI Components**: Add to `components/`
5. **Tests**: Add to `tests/`

### Code Style

- TypeScript strict mode enabled
- No comments in code (as requested)
- Follow existing patterns and conventions
- Use shadcn/ui components when available

## Production Build

```bash
bun run build
bun run start
```

## License

Private project
