'use server';

import { taskRepository } from '@/features/tasks/actions';
import { listRepository } from '@/features/lists/actions';
import type { TaskFormData, TaskStatus, CreateTaskInput } from '@/features/tasks/types';
import { timeToMinutes } from '@/lib/validators/schema';

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
  
  if (data.deadline) {
    taskInput.deadline = new Date(data.deadline);
  } else if (data.deadline === '') {
    taskInput.deadline = null;
  }
  
  if (data.reminder_time) {
    taskInput.reminder_time = new Date(data.reminder_time);
  } else if (data.reminder_time === '') {
    taskInput.reminder_time = null;
  }
  
  if (data.recurring_end_date) {
    taskInput.recurring_end_date = new Date(data.recurring_end_date);
  } else if (data.recurring_end_date === '') {
    taskInput.recurring_end_date = null;
  }
  
  return await taskRepository.create(taskInput);
}

export async function updateTask(id: number, data: Partial<TaskFormData>) {
  const update: any = { id, ...data };
  if (data.estimated_time) {
    update.estimated_time = timeToMinutes(data.estimated_time);
  }
  if (data.actual_time) {
    update.actual_time = timeToMinutes(data.actual_time);
  }
  if (data.deadline) {
    update.deadline = new Date(data.deadline);
  } else if (data.deadline === '') {
    update.deadline = null;
  }
  if (data.reminder_time) {
    update.reminder_time = new Date(data.reminder_time);
  } else if (data.reminder_time === '') {
    update.reminder_time = null;
  }
  if (data.recurring_end_date) {
    update.recurring_end_date = new Date(data.recurring_end_date);
  } else if (data.recurring_end_date === '') {
    update.recurring_end_date = null;
  }
  return await taskRepository.update(update);
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