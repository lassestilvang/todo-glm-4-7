'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar, Clock, Tag, Plus, X, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { taskSchema, type TaskFormData } from '@/lib/validators/schema';
import type { Task, List, Label, Priority, RecurringPattern } from '@/features/tasks/types';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
  task?: Task;
  lists: List[];
  labels: Label[];
}

export function TaskForm({ open, onClose, onSubmit, task, lists, labels }: TaskFormProps) {
  const [selectedLabels, setSelectedLabels] = useState<number[]>([]);
  const [subtasks, setSubtasks] = useState<Array<{ id: string; name: string }>>([]);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: task?.name || '',
      description: task?.description || '',
      list_id: task?.list_id || lists[0]?.id || 0,
      deadline: task?.deadline ? task.deadline.slice(0, 16) : '',
      reminder_time: task?.reminder_time ? task.reminder_time.slice(0, 16) : '',
      estimated_time: task?.estimated_time ? String(Math.floor(task.estimated_time / 60)).padStart(2, '0') + ':' + String(task.estimated_time % 60).padStart(2, '0') : '',
      actual_time: task?.actual_time ? String(Math.floor(task.actual_time / 60)).padStart(2, '0') + ':' + String(task.actual_time % 60).padStart(2, '0') : '',
      priority: task?.priority || 'none',
      labels: [],
      recurring_pattern: task?.recurring_pattern || 'none',
      recurring_end_date: task?.recurring_end_date ? task.recurring_end_date.slice(0, 16) : '',
      subtasks: [],
    },
  });

  useEffect(() => {
    if (task?.labels) {
      setSelectedLabels(task.labels.map(l => l.id));
    }
  }, [task]);

  const handleSubmit = (data: TaskFormData) => {
    onSubmit({
      ...data,
      labels: selectedLabels,
      subtasks: subtasks.map(st => ({
        name: st.name,
        priority: 'none' as Priority,
      })),
    });
    handleClose();
  };

  const handleClose = () => {
    form.reset();
    setSelectedLabels([]);
    setSubtasks([]);
    onClose();
  };

  const toggleLabel = (labelId: number) => {
    setSelectedLabels(prev =>
      prev.includes(labelId) ? prev.filter(id => id !== labelId) : [...prev, labelId]
    );
  };

  const addSubtask = () => {
    setSubtasks(prev => [...prev, { id: Date.now().toString(), name: '' }]);
  };

  const updateSubtask = (id: string, name: string) => {
    setSubtasks(prev => prev.map(st => st.id === id ? { ...st, name } : st));
  };

  const removeSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(st => st.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update your task details below.' : 'Create a new task to get started.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a description (optional)"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="list_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>List</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a list" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lists.map((list) => (
                          <SelectItem key={list.id} value={String(list.id)}>
                            {list.emoji} {list.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reminder_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estimated_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Time (HH:mm)</FormLabel>
                    <FormControl>
                      <Input placeholder="01:30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="actual_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Actual Time (HH:mm)</FormLabel>
                    <FormControl>
                      <Input placeholder="01:30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="recurring_pattern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recurring</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recurrence pattern" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="daily">Every day</SelectItem>
                      <SelectItem value="weekly">Every week</SelectItem>
                      <SelectItem value="weekdays">Every weekday</SelectItem>
                      <SelectItem value="monthly">Every month</SelectItem>
                      <SelectItem value="yearly">Every year</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('recurring_pattern') !== 'none' && (
              <FormField
                control={form.control}
                name="recurring_end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recurring End Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div>
              <FormLabel>Labels</FormLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {labels.map((label) => (
                  <Badge
                    key={label.id}
                    variant={selectedLabels.includes(label.id) ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    style={
                      selectedLabels.includes(label.id)
                        ? { backgroundColor: label.color, color: '#fff' }
                        : { borderColor: label.color, color: label.color }
                    }
                    onClick={() => toggleLabel(label.id)}
                  >
                    {label.emoji} {label.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <FormLabel>Subtasks</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={addSubtask}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Subtask
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2">
                    <Input
                      value={subtask.name}
                      onChange={(e) => updateSubtask(subtask.id, e.target.value)}
                      placeholder="Subtask name"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive"
                      onClick={() => removeSubtask(subtask.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">
                {task ? 'Update Task' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
