import { runAsync, getAsync, allAsync } from '@/lib/db';
import type { 
  Task, 
  TaskWithDetails, 
  List, 
  Label, 
  TaskAttachment, 
  ChangeLog,
  CreateTaskInput,
  UpdateTaskInput,
  TaskStatus
} from './types';

const taskColumns = [
  'id', 'name', 'description', 'list_id', 'deadline', 'reminder_time',
  'estimated_time', 'actual_time', 'priority', 'status', 'completed_at',
  'recurring_pattern', 'recurring_end_date', 'recurrence_count', 
  'parent_task_id', 'position', 'created_at', 'updated_at'
].join(', ');

export const taskRepository = {
  findAll: async (): Promise<Task[]> => {
    return allAsync<Task>(`SELECT ${taskColumns} FROM tasks ORDER BY position, created_at`);
  },

  findById: async (id: number): Promise<Task | null> => {
    const result = await getAsync<Task>(`SELECT ${taskColumns} FROM tasks WHERE id = ?`, [id]);
    return result || null;
  },

  findWithDetails: async (id: number): Promise<TaskWithDetails | null> => {
    const task = await taskRepository.findById(id);
    if (!task) return null;

    const list = await getAsync<any>('SELECT * FROM lists WHERE id = ?', [task.list_id]);
    if (!list) return null;
    
    const labels = await allAsync<Label>(`
      SELECT l.* FROM labels l
      JOIN task_labels tl ON l.id = tl.label_id
      WHERE tl.task_id = ?
    `, [id]);

    const attachments = await allAsync<TaskAttachment>('SELECT * FROM task_attachments WHERE task_id = ? ORDER BY created_at', [id]);

    const subtasks = await allAsync<Task>(`SELECT ${taskColumns} FROM tasks WHERE parent_task_id = ? ORDER BY position`, [id]);

    const changeLogs = await allAsync<ChangeLog>('SELECT * FROM change_logs WHERE task_id = ? ORDER BY changed_at DESC LIMIT 50', [id]);

    return {
      ...task,
      list,
      labels,
      attachments,
      subtasks: subtasks.map(st => ({
        ...st,
        list,
        labels: [],
        attachments: [],
        subtasks: [],
        change_logs: []
      })),
      change_logs: changeLogs
    };
  },

  findByList: async (listId: number): Promise<Task[]> => {
    return allAsync<Task>(`
      SELECT ${taskColumns} FROM tasks 
      WHERE list_id = ? AND parent_task_id IS NULL
      ORDER BY position, created_at
    `, [listId]);
  },

  findByStatus: async (status: TaskStatus): Promise<Task[]> => {
    return allAsync<Task>(`
      SELECT ${taskColumns} FROM tasks 
      WHERE status = ?
      ORDER BY position, created_at
    `, [status]);
  },

  findOverdue: async (): Promise<Task[]> => {
    return allAsync<Task>(`
      SELECT ${taskColumns} FROM tasks 
      WHERE deadline < datetime('now') AND status != 'done'
      ORDER BY deadline
    `);
  },

  findByDeadlineRange: async (start: Date, end: Date): Promise<Task[]> => {
    return allAsync<Task>(`
      SELECT ${taskColumns} FROM tasks 
      WHERE deadline >= ? AND deadline <= ?
      ORDER BY deadline
    `, [start.toISOString(), end.toISOString()]);
  },

  findBySubtasks: async (parentId: number): Promise<Task[]> => {
    return allAsync<Task>(`
      SELECT ${taskColumns} FROM tasks 
      WHERE parent_task_id = ?
      ORDER BY position
    `, [parentId]);
  },

  create: async (input: CreateTaskInput): Promise<Task> => {
    const result = await runAsync(`
      INSERT INTO tasks (
        name, description, list_id, deadline, reminder_time,
        estimated_time, actual_time, priority, recurring_pattern,
        recurring_end_date, recurrence_count, parent_task_id, position
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      input.name,
      input.description || null,
      input.list_id,
      input.deadline?.toISOString() || null,
      input.reminder_time?.toISOString() || null,
      input.estimated_time || null,
      input.actual_time || null,
      input.priority || 'none',
      input.recurring_pattern || 'none',
      input.recurring_end_date?.toISOString() || null,
      input.recurrence_count || null,
      input.parent_task_id || null,
      input.position || 0
    ]);

    const task = await taskRepository.findById(result.lastID)!;

    if (input.labels && input.labels.length > 0) {
      await taskRepository.addLabels(result.lastID, input.labels);
    }

    return task!;
  },

  update: async (input: UpdateTaskInput): Promise<Task> => {
    const existingTask = await taskRepository.findById(input.id);
    if (!existingTask) {
      throw new Error('Task not found');
    }

    const changes: Array<{ field: string; old: string | null; new: string | null }> = [];
    
    if (input.name !== undefined && input.name !== existingTask.name) {
      changes.push({ field: 'name', old: existingTask.name, new: input.name });
    }
    if (input.description !== undefined && input.description !== existingTask.description) {
      changes.push({ field: 'description', old: existingTask.description, new: input.description || null });
    }
    if (input.deadline !== undefined) {
      const old = existingTask.deadline;
      const newVal = input.deadline?.toISOString() || null;
      if (old !== newVal) {
        changes.push({ field: 'deadline', old, new: newVal });
      }
    }
    if (input.reminder_time !== undefined) {
      const old = existingTask.reminder_time;
      const newVal = input.reminder_time?.toISOString() || null;
      if (old !== newVal) {
        changes.push({ field: 'reminder_time', old, new: newVal });
      }
    }
    if (input.estimated_time !== undefined && input.estimated_time !== existingTask.estimated_time) {
      changes.push({ field: 'estimated_time', old: existingTask.estimated_time?.toString() || null, new: input.estimated_time?.toString() || null });
    }
    if (input.actual_time !== undefined && input.actual_time !== existingTask.actual_time) {
      changes.push({ field: 'actual_time', old: existingTask.actual_time?.toString() || null, new: input.actual_time?.toString() || null });
    }
    if (input.priority !== undefined && input.priority !== existingTask.priority) {
      changes.push({ field: 'priority', old: existingTask.priority, new: input.priority });
    }
    if (input.status !== undefined && input.status !== existingTask.status) {
      changes.push({ field: 'status', old: existingTask.status, new: input.status });
    }
    if (input.recurring_pattern !== undefined && input.recurring_pattern !== existingTask.recurring_pattern) {
      changes.push({ field: 'recurring_pattern', old: existingTask.recurring_pattern, new: input.recurring_pattern });
    }
    if (input.recurring_end_date !== undefined) {
      const old = existingTask.recurring_end_date;
      const newVal = input.recurring_end_date?.toISOString() || null;
      if (old !== newVal) {
        changes.push({ field: 'recurring_end_date', old, new: newVal });
      }
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name); }
    if (input.description !== undefined) { fields.push('description = ?'); values.push(input.description); }
    if (input.deadline !== undefined) { fields.push('deadline = ?'); values.push(input.deadline?.toISOString() || null); }
    if (input.reminder_time !== undefined) { fields.push('reminder_time = ?'); values.push(input.reminder_time?.toISOString() || null); }
    if (input.estimated_time !== undefined) { fields.push('estimated_time = ?'); values.push(input.estimated_time); }
    if (input.actual_time !== undefined) { fields.push('actual_time = ?'); values.push(input.actual_time); }
    if (input.priority !== undefined) { fields.push('priority = ?'); values.push(input.priority); }
    if (input.status !== undefined) { 
      fields.push('status = ?'); 
      values.push(input.status);
      if (input.status === 'done') {
        fields.push('completed_at = ?');
        values.push(new Date().toISOString());
      }
    }
    if (input.recurring_pattern !== undefined) { fields.push('recurring_pattern = ?'); values.push(input.recurring_pattern); }
    if (input.recurring_end_date !== undefined) { fields.push('recurring_end_date = ?'); values.push(input.recurring_end_date?.toISOString() || null); }
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(input.id);

    if (fields.length > 1) {
      await runAsync(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    for (const change of changes) {
      await taskRepository.logChange(input.id, change.field, change.old, change.new);
    }

    return (await taskRepository.findById(input.id))!;
  },

  delete: async (id: number): Promise<void> => {
    await runAsync('DELETE FROM tasks WHERE id = ?', [id]);
  },

  addLabels: async (taskId: number, labelIds: number[]): Promise<void> => {
    for (const labelId of labelIds) {
      await runAsync('INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)', [taskId, labelId]);
    }
  },

  removeLabel: async (taskId: number, labelId: number): Promise<void> => {
    await runAsync('DELETE FROM task_labels WHERE task_id = ? AND label_id = ?', [taskId, labelId]);
  },

  addAttachment: async (taskId: number, fileName: string, filePath: string, fileSize: number, mimeType: string): Promise<TaskAttachment> => {
    const result = await runAsync(`
      INSERT INTO task_attachments (task_id, file_name, file_path, file_size, mime_type)
      VALUES (?, ?, ?, ?, ?)
    `, [taskId, fileName, filePath, fileSize, mimeType]);
    return (await getAsync<TaskAttachment>('SELECT * FROM task_attachments WHERE id = ?', [result.lastID]))!;
  },

  deleteAttachment: async (attachmentId: number): Promise<void> => {
    const attachment = await getAsync<TaskAttachment>('SELECT * FROM task_attachments WHERE id = ?', [attachmentId]);
    if (attachment) {
      const fs = await import('fs');
      try {
        fs.unlinkSync(attachment.file_path);
      } catch (err) {
        console.error('Failed to delete file:', err);
      }
      await runAsync('DELETE FROM task_attachments WHERE id = ?', [attachmentId]);
    }
  },

  logChange: async (taskId: number, fieldName: string, oldValue: string | null, newValue: string | null): Promise<void> => {
    await runAsync(`
      INSERT INTO change_logs (task_id, field_name, old_value, new_value)
      VALUES (?, ?, ?, ?)
    `, [taskId, fieldName, oldValue, newValue]);
  },

  getChangeLogs: async (taskId: number): Promise<ChangeLog[]> => {
    return allAsync<ChangeLog>('SELECT * FROM change_logs WHERE task_id = ? ORDER BY changed_at DESC', [taskId]);
  }
};
