# Project Analysis & Improvement Roadmap

**Project:** Daily Planner
**Last Updated:** 2026-01-13
**Analysis Scope:** Best Practices, Architecture, Performance, UX, and Future Features
**Progress Update:** Error boundaries and toast notifications implemented (2026-01-12), Loading states added (2026-01-12), Time handling with timezone support completed (2026-01-12), Basic accessibility improvements completed (2026-01-13)

---

## Executive Summary

This Daily Planner application demonstrates solid foundational architecture with modern tech stack choices (Next.js 16, TypeScript, SQLite). The codebase follows feature-based organization with repository patterns, type safety throughout, and comprehensive test coverage for core functionality. However, there are significant opportunities for improvement in error handling, performance optimization, accessibility, and user experience enhancements.

---

## Current Best Practices in Use

### Architecture & Design Patterns

✅ **Feature-Based Architecture**
- Clean separation: `features/tasks/`, `features/lists/`, `features/labels/`
- Domain-driven organization instead of purely technical layers
- Repository pattern for data access (`taskRepository`, `listRepository`)

✅ **Type Safety**
- TypeScript strict mode enabled
- Comprehensive type definitions for all entities
- Zod validation schemas for form data
- Generic async database wrappers (`getAsync<T>`, `allAsync<T>`)

✅ **Modern React Patterns**
- Server components by default
- 'use client' directive only for interactive components
- Server actions for mutations (`'use server'` in `app/actions.ts`)
- Proper prop typing with interfaces

✅ **Database Design**
- SQLite with WAL mode for performance
- Foreign keys with CASCADE deletes for referential integrity
- Indexed columns for query optimization
- Change log table for audit trail

✅ **Testing**
- Bun test framework with describe/it/expect
- Proper test isolation with beforeEach/afterEach
- Coverage for repositories and view utilities

✅ **UI/UX Patterns**
- shadcn/ui component library built on Radix UI
- CVA (class-variance-authority) for component variants
- Framer Motion for smooth animations
- Responsive design with Tailwind CSS

✅ **Code Organization**
- Absolute imports with `@/` alias
- Consistent naming conventions (kebab-case files, PascalCase components)
- Utility functions in `lib/` directory
- Centralized validation schemas

---

## Areas for Improvement

### High Priority

#### ✅ 1. Error Handling & User Feedback (COMPLETED 2026-01-12)

**Issues:**
- No error boundaries for graceful failure
- Silent errors in async operations (e.g., `features/tasks/actions.ts:251-255`)
- No toast notifications or user feedback
- No loading states during async operations

**Completed:**
- ✅ Installed `sonner` for toast notifications
- ✅ Created `components/error-boundary.tsx` with React class-based ErrorBoundary
- ✅ Added `Toaster` component to app layout
- ✅ Added toast notifications to create, update, complete, and delete operations
- ✅ Wrapped app with ErrorBoundary component for graceful error handling
- ✅ Added proper error handling with try-catch blocks and user feedback
- ✅ Added loading states for all async operations (task completion, deletion, creation, update)

**Files Modified:**
- `app/layout.tsx` - Added Toaster and ErrorBoundary components
- `components/error-boundary.tsx` - Created new ErrorBoundary component
- `components/tasks/task-list-view.tsx` - Added toast notifications, error handling, and loading states
- `components/tasks/task-form.tsx` - Added loading state for form submission
- `components/tasks/task-item.tsx` - Added loading indicators for checkbox and delete button
- `components/ui/spinner.tsx` - Created new Spinner component

**Impact:** Critical - Users now receive feedback when operations succeed or fail, and app can gracefully recover from errors. Loading states provide visual feedback during async operations, improving UX.

---

---

#### ✅ 2. Time Handling & Date Localization (COMPLETED 2026-01-12)

**Issues:**
- No timezone support
- Date display assumes local time
- No locale-aware formatting
- Time zone issues in recurring tasks

**Completed:**
- ✅ Installed `date-fns-tz` for comprehensive timezone support
- ✅ Created centralized time utility module `lib/utils/time.ts` with timezone-aware functions
- ✅ Implemented `getUserTimezone()` to auto-detect user's timezone
- ✅ Implemented `toUTC()` and `fromUTC()` for timezone conversion
- ✅ Implemented `formatDateDisplay()` for user-friendly date display
- ✅ Implemented `formatDateInput()` for form input formatting
- ✅ Implemented `parseDateInput()` for parsing user input to UTC
- ✅ Implemented `isToday()`, `isPast()`, `isFuture()` for date comparison
- ✅ Implemented `isOverdue()` with timezone-aware overdue checking
- ✅ Updated `components/tasks/task-item.tsx` to use timezone-aware date formatting
- ✅ Updated `components/tasks/task-form.tsx` to use timezone-aware input/output
- ✅ Updated `app/actions.ts` server actions to store dates in UTC
- ✅ Updated `features/tasks/views.ts` to use timezone-aware date comparisons
- ✅ Added `timeToMinutes()` and `minutesToTime()` to `lib/utils/time.ts` for time duration handling

**Files Modified:**
- `lib/utils/time.ts` - Created new timezone-aware utility module
- `components/tasks/task-item.tsx` - Updated to use `formatDateDisplay()` and `isOverdue()`
- `components/tasks/task-form.tsx` - Updated to use `formatDateInput()` and `minutesToTime()`
- `app/actions.ts` - Updated to use `parseDateInput()` for timezone-aware date parsing
- `features/tasks/views.ts` - Updated to use `toUTC()` and `fromUTC()` for timezone conversions
- `package.json` - Added `date-fns-tz` dependency

**Impact:** High - All dates are now stored in UTC in the database and displayed in the user's local timezone. This resolves timezone issues for users in different time zones and ensures consistent behavior across the application.

---

---

#### 3. State Management & Data Synchronization

**Issues:**
- Client state not updated after server actions (`components/tasks/task-list-view.tsx:54`)
- No optimistic UI updates
- Race conditions possible with rapid actions
- `router.refresh()` causes full page reload

**Recommendations:**
```typescript
// Use React Query (TanStack Query) for server state
import { useMutation, useQueryClient } from '@tanstack/react-query';

const mutation = useMutation({
  mutationFn: (data) => updateTask(taskId, data),
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['tasks'] });
    const previous = queryClient.getQueryData(['tasks']);
    queryClient.setQueryData(['tasks'], old => 
      updateTaskOptimistically(old, taskId, newData)
    );
    return { previous };
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['tasks'], context.previous);
    toast.error('Update failed');
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }
});
```

**Impact:** High - Improves perceived performance and reduces network requests

---

#### 3. Performance Optimizations

**Issues:**
- No memoization for expensive computations
- Large lists render all items without virtualization
- Repeated calculations in render cycles
- No image optimization for attachments

**Recommendations:**
```typescript
// Memoize expensive operations
import { useMemo } from 'react';

const filteredTasks = useMemo(() => 
  tasks.filter(task => {
    const query = searchQuery.toLowerCase();
    return task.name.toLowerCase().includes(query) ||
           task.description?.toLowerCase().includes(query);
  }), 
  [tasks, searchQuery]
);

// Use react-window or TanStack Virtual for large lists
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: tasks.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 100,
});
```

**Impact:** High - App remains responsive with large datasets

---

#### ✅ 4. Accessibility (A11y) (COMPLETED 2026-01-13)

**Issues:**
- Missing ARIA labels in TaskItem component
- No focus trap in dialogs
- Incomplete keyboard navigation
- No screen reader announcements for task completion

**Completed:**
- ✅ Added `.sr-only` utility class to globals.css for screen-reader-only content
- ✅ Added ARIA labels to all interactive elements in TaskItem component (checkbox, expand button, task title, edit/delete buttons)
- ✅ Added `role="listitem"` and descriptive `aria-label` to task cards
- ✅ Added `aria-expanded` to expand/collapse subtask buttons
- ✅ Added keyboard navigation to task title (Enter and Space keys)
- ✅ Added live region (`aria-live="polite"`) to TaskListView for screen reader announcements
- ✅ Screen reader announcements for task completion, creation, update, and deletion
- ✅ Added ARIA labels to search input and show completed toggle
- ✅ Added proper form labels with `htmlFor` and `id` attributes to TaskForm
- ✅ Added `aria-required` to required form fields
- ✅ Added `aria-describedby` for form field hints (estimated/actual time)
- ✅ Added `aria-hidden="true"` to decorative icons
- ✅ Dialog already has proper focus management from Radix UI
- ✅ Added `id` to DialogDescription and linked via `aria-describedby` on DialogContent

**Impact:** High - Required for WCAG compliance and inclusive design. All major interactive elements now have proper ARIA labels, keyboard navigation works for essential actions, and screen reader users receive announcements for all task operations.

---

#### 5. Code Quality & Duplication

**Issues:**
- `taskFormSchema` duplicated in `task-form.tsx:36` and `schema.ts:6`
- Time format conversion logic scattered throughout
- Inconsistent error messages
- No ESLint rules configured

**Recommendations:**
```typescript
// Centralize in lib/validators/schema.ts only
export const taskFormSchema = z.object({...});

// Create time utility module
// lib/utils/time.ts
export const timeToMinutes = (timeStr: string): number => {...};
export const minutesToTime = (minutes: number): string => {...};

// Configure ESLint
// .eslintrc.js
module.exports = {
  extends: ['next/core-web-vitals', 'prettier'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  }
};
```

**Impact:** Medium - Improves maintainability and reduces bugs

---

### Medium Priority

#### 6. Database Operations & Data Integrity

**Issues:**
- No transaction support for multi-step operations
- No database migration system
- No backup/restore mechanism
- SQLite file stored in project root (should be in `data/`)

**Recommendations:**
```typescript
// Use transactions for related operations
db.serialize(() => {
  db.run('BEGIN TRANSACTION');
  try {
    db.run('INSERT INTO tasks...');
    db.run('INSERT INTO change_logs...');
    db.run('COMMIT');
  } catch (err) {
    db.run('ROLLBACK');
    throw err;
  }
});

// Add migration system
// lib/db/migrations.ts
export const migrations = [
  { version: 1, sql: 'CREATE TABLE...' },
  { version: 2, sql: 'ALTER TABLE tasks ADD COLUMN...' },
];

// Move database
const dbPath = path.join(process.cwd(), 'data', 'planner.db');
```

**Impact:** Medium - Prevents data corruption and enables schema evolution

---

#### 7. Testing Coverage

**Issues:**
- No E2E tests
- No component integration tests
- Missing tests for edge cases in recurring tasks
- No visual regression tests

**Recommendations:**
```typescript
// Add Playwright for E2E
import { test, expect } from '@playwright/test';

test('user can create and complete a task', async ({ page }) => {
  await page.goto('/today');
  await page.click('button:has-text("New Task")');
  await page.fill('input[name="name"]', 'Test Task');
  await page.click('button:has-text("Create Task")');
  await expect(page.locator('text=Test Task')).toBeVisible();
});

// Add component testing
import { render, screen } from '@testing-library/react';
import { TaskItem } from './task-item';

test('displays task details correctly', () => {
  render(<TaskItem task={mockTask} />);
  expect(screen.getByText('Test Task')).toBeInTheDocument();
});
```

**Impact:** Medium - Catches regressions and validates user flows

---

#### 8. Security Considerations

**Issues:**
- No rate limiting on server actions
- File upload validation incomplete
- No CSRF protection beyond Next.js defaults
- Password fields not masked in logs

**Recommendations:**
```typescript
// Add rate limiting
import { Ratelimit } from '@unkey/ratelimit';

const ratelimit = new Ratelimit({...});

export async function createTask(data: TaskFormData) {
  const identifier = 'user-id'; // Add authentication
  const { success } = await ratelimit.limit(identifier);
  if (!success) {
    throw new Error('Too many requests');
  }
  // ...
}

// Validate file uploads
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

if (!ALLOWED_MIME_TYPES.includes(file.mimeType)) {
  throw new Error('Invalid file type');
}
if (file.fileSize > MAX_FILE_SIZE) {
  throw new Error('File too large');
}
```

**Impact:** Medium - Prevents abuse and protects user data

---

#### ✅ 9. Time Handling & Date Localization (COMPLETED 2026-01-12)

**Issues:**
- No timezone support
- Date display assumes local time
- No locale-aware formatting
- Time zone issues in recurring tasks

**Completed:**
- ✅ Installed `date-fns-tz` for comprehensive timezone support
- ✅ Created centralized time utility module `lib/utils/time.ts`
- ✅ Implemented auto-detection of user's timezone via `Intl.DateTimeFormat()`
- ✅ Implemented timezone conversion utilities (`toUTC`, `fromUTC`)
- ✅ Implemented timezone-aware date formatting (`formatDateDisplay`, `formatDateInput`)
- ✅ Implemented timezone-aware date parsing (`parseDateInput`)
- ✅ Implemented timezone-aware date comparison (`isToday`, `isPast`, `isFuture`, `isOverdue`)
- ✅ Updated all components to use timezone-aware utilities
- ✅ Updated server actions to store dates in UTC
- ✅ Updated view utilities to use timezone-aware comparisons
- ✅ Centralized time-to-minutes conversion logic

**Files Modified:**
- `lib/utils/time.ts` - Created new timezone-aware utility module
- `components/tasks/task-item.tsx` - Updated for timezone-aware display
- `components/tasks/task-form.tsx` - Updated for timezone-aware input
- `app/actions.ts` - Updated to store dates in UTC
- `features/tasks/views.ts` - Updated for timezone-aware comparisons
- `package.json` - Added `date-fns-tz` dependency

**Impact:** Medium - Critical for users in different time zones. All dates are now consistently stored in UTC and displayed in the user's local timezone, preventing timezone-related bugs and confusion.

---

#### ✅ 10. Accessibility (A11y) (COMPLETED 2026-01-13)

**Issues:**
- Missing ARIA labels in TaskItem component
- No focus trap in dialogs
- Incomplete keyboard navigation
- No screen reader announcements for task completion

**Completed:**
- ✅ Added `.sr-only` utility class to globals.css for screen-reader-only content
- ✅ Added ARIA labels to all interactive elements in TaskItem component (checkbox, expand button, task title, edit/delete buttons)
- ✅ Added `role="listitem"` and descriptive `aria-label` to task cards
- ✅ Added `aria-expanded` to expand/collapse subtask buttons
- ✅ Added keyboard navigation to task title (Enter and Space keys)
- ✅ Added live region (`aria-live="polite"`) to TaskListView for screen reader announcements
- ✅ Screen reader announcements for task completion, creation, update, and deletion
- ✅ Added ARIA labels to search input and show completed toggle
- ✅ Added proper form labels with `htmlFor` and `id` attributes to TaskForm
- ✅ Added `aria-required` to required form fields
- ✅ Added `aria-describedby` for form field hints (estimated/actual time)
- ✅ Added `aria-hidden="true"` to decorative icons
- ✅ Dialog already has proper focus management from Radix UI
- ✅ Added `id` to DialogDescription and linked via `aria-describedby` on DialogContent

**Files Modified:**
- `app/globals.css` - Added `.sr-only` class for screen-reader-only content
- `components/tasks/task-item.tsx` - Added ARIA labels, keyboard navigation, role attributes
- `components/tasks/task-list-view.tsx` - Added live region for announcements, ARIA labels to controls
- `components/tasks/task-form.tsx` - Added proper form labels, ARIA attributes to inputs

**Impact:** High - Required for WCAG compliance and inclusive design. All major interactive elements now have proper ARIA labels, keyboard navigation works for essential actions, and screen reader users receive announcements for all task operations.

---

### Low Priority

#### 10. Documentation & Developer Experience

**Issues:**
- No API documentation
- Limited inline code comments
- No deployment guide
- No contributing guidelines

**Recommendations:**
- Add JSDoc comments to repository functions
- Create API documentation with TypeDoc
- Write deployment guide for Vercel/Docker
- Add CONTRIBUTING.md with development setup

**Impact:** Low - Improves onboarding for new developers

---

## Feature Roadmap

### Phase 1: Core Enhancements (Immediate)

#### 1.1 Advanced Search & Filtering
**User Value:** ⭐⭐⭐⭐⭐  
**Effort:** Medium

```typescript
// features/tasks/filters.ts
export type FilterOperator = 'equals' | 'contains' | 'greater' | 'less' | 'between';

export interface TaskFilter {
  field: 'name' | 'description' | 'priority' | 'status' | 'deadline';
  operator: FilterOperator;
  value: unknown;
}

export interface SavedFilter {
  id: number;
  name: string;
  filters: TaskFilter[];
}
```

**Features:**
- Multi-criteria filtering (AND/OR logic)
- Save custom filters for quick access
- Filter by date ranges, priority, status, labels
- Quick filter presets (e.g., "High priority & Overdue")
- Advanced search with regex support

---

#### 1.2 Task Dependencies
**User Value:** ⭐⭐⭐⭐⭐  
**Effort:** High

```typescript
export interface TaskDependency {
  id: number;
  dependent_task_id: number;
  prerequisite_task_id: number;
  type: 'blocks' | 'suggested' | 'related';
}
```

**Features:**
- Define prerequisite tasks (task B can't start until A is done)
- Visual dependency graph in task details
- Warning when completing tasks that block others
- Auto-complete dependent tasks when parent is done
- Drag-and-drop to create dependencies in Gantt view

---

#### 1.3 Time Tracking with Timer
**User Value:** ⭐⭐⭐⭐⭐  
**Effort:** Medium

**Features:**
- Built-in timer for tracking actual time spent
- Start/pause/stop timer from task item
- Auto-pause when switching tasks
- Manual time entry for retrospective logging
- Time tracking reports (daily/weekly/monthly)
- Export time logs to CSV

---

#### 1.4 Smart Suggestions
**User Value:** ⭐⭐⭐⭐  
**Effort:** High

**Features:**
- AI-powered task suggestions based on patterns
- "You usually do this on Tuesdays - add to today?"
- Suggest labels based on task content
- Recommend priority based on deadlines
- Detect similar tasks and suggest merging

---

### Phase 2: Collaboration Features (Short-term)

#### 2.1 Sharing & Export
**User Value:** ⭐⭐⭐⭐  
**Effort:** Medium

**Features:**
- Share lists via generated link
- Export to PDF/CSV/Markdown
- Email daily summary
- Calendar sync (Google Calendar, Outlook)
- Print-friendly task views

---

#### 2.2 Comments & Notes
**User Value:** ⭐⭐⭐  
**Effort:** Medium

```typescript
export interface TaskComment {
  id: number;
  task_id: number;
  content: string;
  author: string;
  created_at: string;
  attachments: Attachment[];
}
```

**Features:**
- Add notes/comments to tasks
- Rich text editor for comments
- @mention other tasks
- Comment history in change log
- Pin important comments

---

#### 2.3 Templates & Checklists
**User Value:** ⭐⭐⭐⭐  
**Effort:** Low

**Features:**
- Save task templates for recurring workflows
- Pre-built templates (e.g., "Weekly Review", "Onboarding")
- Quick-add from template with auto-filled fields
- Checklist templates for multi-step tasks
- Template library with categories

---

### Phase 3: Advanced Features (Medium-term)

#### 3.1 Calendar View
**User Value:** ⭐⭐⭐⭐  
**Effort:** High

**Features:**
- Full calendar view (month/week/day)
- Drag tasks to reschedule
- Time blocks showing scheduled tasks
- Conflict detection for overlapping tasks
- Multiple calendar views (Kanban, Timeline, Gantt)

---

#### 3.2 Goals & Milestones
**User Value:** ⭐⭐⭐⭐  
**Effort:** High

```typescript
export interface Goal {
  id: number;
  name: string;
  description: string;
  target_date: Date;
  progress: number;
  tasks: Task[];
  categories: string[];
}
```

**Features:**
- Set goals with target dates
- Link tasks to goals
- Track progress toward goals
- Milestone markers
- Goal dashboard with visual progress

---

#### 3.3 Focus Mode
**User Value:** ⭐⭐⭐⭐  
**Effort:** Medium

**Features:**
- Zen mode - single task view, minimal distractions
- Pomodoro timer integration
- Block distractions (hide sidebar, notifications)
- Ambient sounds (white noise, nature sounds)
- Session statistics

---

#### 3.4 Analytics & Insights
**User Value:** ⭐⭐⭐  
**Effort:** High

**Features:**
- Productivity dashboard
- Task completion trends over time
- Time distribution by category/label
- Peak productivity hours detection
- Burndown charts for projects
- Export reports

---

### Phase 4: Power User Features (Long-term)

#### 4.1 Automation & Workflows
**User Value:** ⭐⭐⭐  
**Effort:** Very High

**Features:**
- Custom triggers and actions
- "When task is marked done, move to Completed list"
- Auto-assign labels based on rules
- Scheduled actions (e.g., archive old tasks weekly)
- Webhook integrations

---

#### 4.2 AI Integration
**User Value:** ⭐⭐⭐  
**Effort:** Very High

**Features:**
- Natural language task creation ("Add meeting with John tomorrow at 3pm")
- AI task breakdown (suggest subtasks)
- Smart deadline suggestions
- Summarize task history
- Priority recommendations

---

#### 4.3 Mobile Apps
**User Value:** ⭐⭐⭐⭐  
**Effort:** Very High

**Features:**
- Native iOS and Android apps
- Offline support with sync
- Push notifications for reminders
- Quick-add widget
- Siri/Google Assistant shortcuts

---

#### 4.4 Multi-tenant & Team Features
**User Value:** ⭐⭐  
**Effort:** Very High

**Features:**
- Team workspaces
- Assign tasks to team members
- Permission levels (view, edit, admin)
- Team activity feed
- Real-time collaboration (like Google Docs for tasks)

---

### Phase 5: Integrations & Ecosystem

#### 5.1 Third-Party Integrations
**User Value:** ⭐⭐⭐  
**Effort:** Medium

**Integration Targets:**
- Notion, Obsidian (bidirectional sync)
- Slack, Microsoft Teams (notifications)
- GitHub, GitLab (track tasks in PRs)
- Zapier, Make (automation)
- Evernote, OneNote (sync notes)

---

#### 5.2 Plugin System
**User Value:** ⭐⭐  
**Effort:** High

**Features:**
- Extensible plugin architecture
- Plugin marketplace
- Custom field types
- UI customization plugins
- Export/import plugins

---

## Technical Debt & Technical Improvements

### 1. Database Schema Enhancements

```sql
-- Add soft delete support
ALTER TABLE tasks ADD COLUMN deleted_at DATETIME;
ALTER TABLE lists ADD COLUMN deleted_at DATETIME;

-- Add task grouping
ALTER TABLE tasks ADD COLUMN group_id INTEGER REFERENCES task_groups(id);

-- Add tags system (many-to-many)
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#8b5cf6'
);

CREATE TABLE task_tags (
  task_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (task_id, tag_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Add full-text search
CREATE VIRTUAL TABLE tasks_fts USING fts5(name, description, content='tasks', content_rowid='id');

-- Add audit log for all operations
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  old_data JSON,
  new_data JSON,
  user_id TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2. Performance Optimizations

```typescript
// Implement Redis caching for frequent queries
import { Redis } from '@upstash/redis';

const redis = new Redis({...});

export async function getTasksCached(): Promise<Task[]> {
  const cached = await redis.get('tasks:all');
  if (cached) return cached as Task[];
  
  const tasks = await taskRepository.findAll();
  await redis.setex('tasks:all', 60, JSON.stringify(tasks));
  return tasks;
}

// Implement GraphQL for flexible data fetching
// Use Apollo Server with Next.js API routes
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';

const typeDefs = `#graphql
  type Task {
    id: ID!
    name: String!
    description: String
    priority: Priority
    labels: [Label!]!
  }
  
  type Query {
    tasks: [Task!]!
    task(id: ID!): Task
  }
`;
```

---

### 3. Infrastructure Improvements

```yaml
# docker-compose.yml for local development
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_URL=sqlite:///data/planner.db
  
  # PostgreSQL for production
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Security & Compliance Checklist

### Must Implement
- [ ] Content Security Policy (CSP)
- [ ] Rate limiting on all server actions
- [ ] Input sanitization for user content
- [ ] File upload validation (type, size, content)
- [ ] SQL injection prevention (already done with parameterized queries ✅)
- [ ] XSS prevention (React does this ✅)
- [ ] HTTPS enforcement in production

### Nice to Have
- [ ] Two-factor authentication (when user accounts are added)
- [ ] GDPR compliance tools (data export, deletion)
- [ ] Audit log export for compliance
- [ ] Security headers configuration

---

## Metrics & Monitoring

### Recommended Implementation

```typescript
// Add analytics with Plausible or Umami
// lib/analytics.ts
export const trackEvent = (event: string, properties?: Record<string, unknown>) => {
  if (typeof window !== 'undefined') {
    window.plausible?.(event, { props: properties });
  }
};

// Track key events
trackEvent('task_created', { has_deadline: !!task.deadline });
trackEvent('task_completed', { time_to_complete: timeDiff });

// Add error tracking with Sentry
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Key Metrics to Track
- Task creation/completion rates
- Time spent in different views
- Feature usage (labels, subtasks, attachments)
- Error rates and types
- Performance metrics (page load, interaction latency)

---

## Next Steps (Immediate Action Items)

1. **Week 1-2: Critical Fixes** (4/4 Complete)
    - ✅ Implement error boundaries and toast notifications (COMPLETED 2026-01-12)
    - ✅ Add loading states for all async operations (COMPLETED 2026-01-12)
    - ✅ Fix time handling issues (COMPLETED 2026-01-12)
    - ✅ Add basic accessibility improvements (COMPLETED 2026-01-13)

2. **Week 3-4: Performance & UX**
   - Implement React Query for state management
   - Add virtual scrolling for large lists
   - Optimize bundle size (code splitting)
   - Add comprehensive ARIA labels

3. **Month 2: Feature Enhancements**
   - Build advanced search and filtering
   - Add task dependencies
   - Implement time tracking timer
   - Create task templates

4. **Month 3: Collaboration & Analytics**
   - Add sharing and export features
   - Build analytics dashboard
   - Implement calendar view
   - Add comments and notes

---

## Conclusion

This Daily Planner application has a solid foundation with modern architecture and good practices in place. The codebase demonstrates thoughtful organization and type safety. However, significant improvements are needed in error handling, performance, accessibility, and state management to reach production-ready quality.

The feature roadmap presents exciting opportunities to enhance the user experience, with advanced search, task dependencies, and time tracking offering the highest value for users. Implementing these in phases will allow for continuous improvement while maintaining stability.

**Overall Assessment:** 7/10  
- Strong: Architecture, type safety, testing
- Needs work: Error handling, performance, a11y
- Great potential for: Collaboration features, AI integration

---

## Appendix: File Inventory

### Core Application Files
```
app/
├── actions.ts                    # Server actions for mutations
├── layout.tsx                    # Root layout with fonts
├── page.tsx                      # Redirects to /today
├── today/page.tsx                # Today view
├── next-7-days/page.tsx          # Next 7 days view
├── upcoming/page.tsx              # Upcoming view
├── all/page.tsx                  # All tasks view
├── lists/[id]/page.tsx           # List detail view
└── globals.css                   # Tailwind + custom styles

components/
├── tasks/
│   ├── task-item.tsx             # Individual task component
│   ├── task-form.tsx             # Task creation/edit form
│   ├── task-list-view.tsx        # Task list container
│   └── subtask-item.tsx          # Subtask component
├── sidebar/
│   ├── sidebar.tsx               # Main navigation sidebar
│   └── list-form.tsx             # List creation form
└── ui/                           # shadcn/ui components (24 files)

features/
├── tasks/
│   ├── actions.ts                # Task repository (CRUD operations)
│   ├── types.ts                  # Task-related type definitions
│   └── views.ts                  # View query functions
├── lists/
│   └── actions.ts                # List repository
├── labels/
│   └── actions.ts                # Label repository
└── audit-log/
    └── actions.ts                # Change log repository

lib/
├── db/
│   ├── index.ts                  # Database connection & async wrappers
│   └── schema.ts                 # Database schema & migrations
├── validators/
│   └── schema.ts                 # Zod validation schemas
└── utils.ts                      # Utility functions (cn, etc.)

tests/
├── tasks.test.ts                 # Task repository tests
├── lists.test.ts                 # List repository tests
├── labels.test.ts                # Label repository tests
├── views.test.ts                 # View utility tests
└── recurring.test.ts            # Recurring task tests
```

---

*This document is a living resource and should be updated as the project evolves.*
