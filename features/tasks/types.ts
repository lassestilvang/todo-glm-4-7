export type Priority = 'high' | 'medium' | 'low' | 'none';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type RecurringPattern = 'none' | 'daily' | 'weekly' | 'weekdays' | 'monthly' | 'yearly' | 'custom';

export interface List {
  id: number;
  name: string;
  emoji: string;
  color: string;
  is_inbox: boolean;
  created_at: string;
  updated_at: string;
}

export interface Label {
  id: number;
  name: string;
  emoji: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  name: string;
  description: string | null;
  list_id: number;
  deadline: string | null;
  reminder_time: string | null;
  estimated_time: number | null;
  actual_time: number | null;
  priority: Priority;
  status: TaskStatus;
  completed_at: string | null;
  recurring_pattern: RecurringPattern;
  recurring_end_date: string | null;
  recurrence_count: number | null;
  parent_task_id: number | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface TaskWithDetails extends Task {
  list: List;
  labels: Label[];
  attachments: TaskAttachment[];
  subtasks: TaskWithDetails[];
  change_logs: ChangeLog[];
  change_log_count?: number;
}

export interface TaskAttachment {
  id: number;
  task_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface ChangeLog {
  id: number;
  task_id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
}

export type ViewType = 'today' | 'next_7_days' | 'upcoming' | 'all';

export interface TaskFormData {
  name: string;
  description?: string;
  list_id: number;
  deadline?: string;
  reminder_time?: string;
  estimated_time?: string;
  actual_time?: string;
  priority: Priority;
  labels: number[];
  recurring_pattern: RecurringPattern;
  recurring_end_date?: string;
  subtasks: Omit<TaskFormData, 'subtasks' | 'list_id' | 'labels'>[];
}

export interface CreateTaskInput {
  name: string;
  description?: string;
  list_id: number;
  deadline?: Date | null;
  reminder_time?: Date | null;
  estimated_time?: number | null;
  actual_time?: number | null;
  priority?: Priority;
  labels?: number[];
  recurring_pattern?: RecurringPattern;
  recurring_end_date?: Date | null;
  recurrence_count?: number | null;
  parent_task_id?: number | null;
  position?: number;
}

export interface UpdateTaskInput extends Partial<Omit<CreateTaskInput, 'list_id' | 'parent_task_id'>> {
  id: number;
  status?: TaskStatus;
}
