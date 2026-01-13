'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
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
import { type Task, List } from '@/features/tasks/types';
import { formatDateInput, minutesToTime } from '@/lib/utils/time';
import { taskSchema } from '@/lib/validators/schema';

const taskFormSchema = taskSchema.pick({
  name: true,
  description: true,
  list_id: true,
  deadline: true,
  reminder_time: true,
  estimated_time: true,
  actual_time: true,
  priority: true,
  recurring_pattern: true,
  recurring_end_date: true,
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormValues) => void;
  task?: Task;
  lists: List[];
  isSubmitting?: boolean;
}

export function TaskForm({ open, onClose, onSubmit, task, lists, isSubmitting = false }: TaskFormProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: '',
      description: '',
      list_id: lists[0]?.id || 0,
      deadline: '',
      reminder_time: '',
      estimated_time: '',
      actual_time: '',
      priority: 'none',
      recurring_pattern: 'none',
      recurring_end_date: '',
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        name: task.name || '',
        description: task.description || '',
        list_id: task.list_id || lists[0]?.id || 0,
        deadline: task.deadline ? formatDateInput(task.deadline) : '',
        reminder_time: task.reminder_time ? formatDateInput(task.reminder_time) : '',
        estimated_time: task.estimated_time ? minutesToTime(task.estimated_time) : '',
        actual_time: task.actual_time ? minutesToTime(task.actual_time) : '',
        priority: task.priority || 'none',
        recurring_pattern: task.recurring_pattern || 'none',
        recurring_end_date: task.recurring_end_date ? formatDateInput(task.recurring_end_date) : '',
      });
    } else {
      form.reset({
        name: '',
        description: '',
        list_id: lists[0]?.id || 0,
        deadline: '',
        reminder_time: '',
        estimated_time: '',
        actual_time: '',
        priority: 'none',
        recurring_pattern: 'none',
        recurring_end_date: '',
      });
    }
  }, [task, lists, form]);

  const handleSubmit = (data: TaskFormValues) => {
    onSubmit(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="task-description">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'New Task'}</DialogTitle>
          <DialogDescription id="task-description">
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
                  <FormLabel htmlFor="task-name">Task Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter task name"
                      {...field}
                      id="task-name"
                      aria-required="true"
                    />
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
                  <FormLabel htmlFor="task-description-field">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a description (optional)"
                      className="resize-none"
                      rows={3}
                      {...field}
                      id="task-description-field"
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
                    <FormLabel htmlFor="task-list">List</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger id="task-list">
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
                    <FormLabel htmlFor="task-priority">Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger id="task-priority">
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
                    <FormLabel htmlFor="task-deadline">Deadline</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} id="task-deadline" />
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
                    <FormLabel htmlFor="task-reminder">Reminder</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} id="task-reminder" />
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
                    <FormLabel htmlFor="task-estimated-time">Estimated Time (HH:mm)</FormLabel>
                    <FormControl>
                      <Input placeholder="01:30" {...field} id="task-estimated-time" aria-describedby="estimated-time-hint" />
                    </FormControl>
                    <p id="estimated-time-hint" className="text-xs text-muted-foreground">
                      Enter time in HH:mm format (e.g., 01:30 for 1 hour 30 minutes)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="actual_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="task-actual-time">Actual Time (HH:mm)</FormLabel>
                    <FormControl>
                      <Input placeholder="01:30" {...field} id="task-actual-time" aria-describedby="actual-time-hint" />
                    </FormControl>
                    <p id="actual-time-hint" className="text-xs text-muted-foreground">
                      Enter time in HH:mm format (e.g., 01:30 for 1 hour 30 minutes)
                    </p>
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
                  <FormLabel htmlFor="task-recurring">Recurring</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger id="task-recurring">
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
                    <FormLabel htmlFor="task-recurring-end">Recurring End Date</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} id="task-recurring-end" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    {task ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {task ? 'Update Task' : 'Create Task'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
