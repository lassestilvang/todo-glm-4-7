'use server';

import { taskRepository } from '@/features/tasks/actions';
import { listRepository } from '@/features/lists/actions';
import type { TaskFormData, TaskStatus, CreateTaskInput, UpdateTaskInput } from '@/features/tasks/types';
import { timeToMinutes, parseDateInput } from '@/lib/utils/time';

export async function createTask(data: TaskFormData) {
  const taskInput: CreateTaskInput = {
    name: data.name,
    description: data.description,
    list_id: data.list_id,
    priority: data.priority,
    labels: data.labels,
    recurring_pattern: data.recurring_pattern,
    estimated_time: data.estimated_time ? timeToMinutes(data.estimated_time) : undefined,
    actual_time: data.actual_time ? timeToMinutes(data.actual_time) : undefined,
  };

  taskInput.deadline = parseDateInput(data.deadline || '');

  taskInput.reminder_time = parseDateInput(data.reminder_time || '');

  taskInput.recurring_end_date = parseDateInput(data.recurring_end_date || '');

  return await taskRepository.create(taskInput);
}

export async function updateTask(id: number, data: Partial<TaskFormData>) {
  const update: Record<string, unknown> = { id };
  if (data.name !== undefined) update.name = data.name;
  if (data.description !== undefined) update.description = data.description;
  if (data.list_id !== undefined) update.list_id = data.list_id;
  if (data.estimated_time) {
    update.estimated_time = timeToMinutes(data.estimated_time);
  }
  if (data.actual_time) {
    update.actual_time = timeToMinutes(data.actual_time);
  }
  update.deadline = parseDateInput(data.deadline || '');
  update.reminder_time = parseDateInput(data.reminder_time || '');
  update.recurring_end_date = parseDateInput(data.recurring_end_date || '');
  if (data.priority !== undefined) update.priority = data.priority;
  if (data.labels !== undefined) update.labels = data.labels;
  if (data.recurring_pattern !== undefined) update.recurring_pattern = data.recurring_pattern;
  return await taskRepository.update(update as unknown as UpdateTaskInput);
}

export async function completeTask(taskId: number, status: TaskStatus) {
  return await taskRepository.update({ id: taskId, status });
}

export async function deleteTask(taskId: number) {
  return await taskRepository.delete(taskId);
}

export async function createList(name: string, emoji: string, color: string) {
  return await listRepository.create(name, emoji, color);
}