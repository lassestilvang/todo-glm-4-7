'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, CheckCircle2, Circle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TaskItem } from './task-item';
import { TaskForm, type TaskFormValues } from './task-form';
import type { Task, TaskStatus, List, Label, ViewType } from '@/features/tasks/types';
import { createTask, updateTask, completeTask, deleteTask, getTasksByView } from '@/app/actions';
import { toast } from 'sonner';

interface TaskListViewProps {
  view: string;
  lists: List[];
  labels: Label[];
  initialTasks: Task[];
  currentList?: List;
}

export function TaskListView({ view, lists, labels: _labels, initialTasks, currentList }: TaskListViewProps) {
  const queryClient = useQueryClient();
  const [showCompleted, setShowCompleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [announcement, setAnnouncement] = useState('');

  const { data: tasks = initialTasks } = useQuery({
    queryKey: ['tasks', view, showCompleted],
    queryFn: () => getTasksByView(view as ViewType, showCompleted),
    initialData: initialTasks,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const taskLabels = 'labels' in task ? task.labels as Label[] : [];
      return (
        task.name.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        taskLabels.some((l: Label) => l.name.toLowerCase().includes(query))
      );
    });
  }, [tasks, searchQuery]);

  const completeMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: TaskStatus }) => {
      return completeTask(taskId, status);
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', view, showCompleted] });
      const previousTasks = queryClient.getQueryData(['tasks', view, showCompleted]) as Task[];
      const task = previousTasks?.find(t => t.id === taskId);
      const taskName = task?.name || 'Task';

      queryClient.setQueryData(['tasks', view, showCompleted], (old: Task[]) =>
        old.map(t => t.id === taskId ? { ...t, status } : t)
      );

      return { previousTasks, taskId, status, taskName };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['tasks', view, showCompleted], context?.previousTasks);
      toast.error('Failed to update task status');
    },
    onSuccess: (_, variables, context) => {
      const message = variables.status === 'done' ? `Task "${context?.taskName}" completed` : `Task "${context?.taskName}" marked as todo`;
      toast.success(variables.status === 'done' ? 'Task completed' : 'Task marked as todo');
      setAnnouncement(message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', view, showCompleted] });
    },
  });

  const handleComplete = (taskId: number, status: TaskStatus) => {
    completeMutation.mutate({ taskId, status });
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setShowTaskForm(true);
  };

  const deleteMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return deleteTask(taskId);
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', view, showCompleted] });
      const previousTasks = queryClient.getQueryData(['tasks', view, showCompleted]) as Task[];
      const task = previousTasks?.find(t => t.id === taskId);
      const taskName = task?.name || 'Task';

      queryClient.setQueryData(['tasks', view, showCompleted], (old: Task[]) =>
        old.filter(t => t.id !== taskId)
      );

      return { previousTasks, taskId, taskName };
    },
    onError: (err, taskId, context) => {
      queryClient.setQueryData(['tasks', view, showCompleted], context?.previousTasks);
      toast.error('Failed to delete task');
    },
    onSuccess: (_, __, context) => {
      const message = `Task "${context?.taskName}" deleted`;
      toast.success('Task deleted');
      setAnnouncement(message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', view, showCompleted] });
    },
  });

  const handleDelete = (taskId: number) => {
    deleteMutation.mutate(taskId);
  };

  const createMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      return createTask({ ...data, labels: [], subtasks: [] });
    },
    onSuccess: (_, variables) => {
      const message = `Task "${variables.name}" created successfully`;
      toast.success('Task created successfully');
      setAnnouncement(message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', view, showCompleted] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: number; data: TaskFormValues }) => {
      return updateTask(taskId, { ...data, labels: [], subtasks: [] });
    },
    onSuccess: (_, variables) => {
      const message = `Task "${variables.data.name}" updated successfully`;
      toast.success('Task updated successfully');
      setAnnouncement(message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', view, showCompleted] });
    },
  });

  const handleSubmit = async (data: TaskFormValues) => {
    try {
      if (selectedTask) {
        updateMutation.mutate({ taskId: selectedTask.id, data });
      } else {
        createMutation.mutate(data);
      }
      setShowTaskForm(false);
      setSelectedTask(undefined);
    } catch (error) {
      console.error('Task operation failed:', error);
      toast.error(selectedTask ? 'Failed to update task' : 'Failed to create task');
    }
  };

  const handleNewTask = () => {
    setSelectedTask(undefined);
    setShowTaskForm(true);
  };

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filteredTasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140,
    overscan: 5,
  });

  const useVirtual = filteredTasks.length > 20;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold capitalize">
            {currentList ? (
              <span className="flex items-center gap-2">
                <span className="text-2xl">{currentList.emoji}</span>
                {currentList.name}
              </span>
            ) : (
              view.replace('_', ' ')
            )}
          </h2>
          <Button onClick={handleNewTask}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
              aria-label="Search tasks"
            />
          </div>

          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Switch
              checked={showCompleted}
              onCheckedChange={setShowCompleted}
              aria-label={showCompleted ? 'Hide completed tasks' : 'Show completed tasks'}
            />
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div ref={parentRef} className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="mb-4 rounded-full bg-muted p-4">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No tasks found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : 'Create a new task to get started'}
                </p>
              </motion.div>
            ) : useVirtual ? (
              <div
                className="relative"
                style={{ height: `${virtualizer.getTotalSize()}px` }}
              >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const task = filteredTasks[virtualItem.index];
                  return (
                    <div
                      key={virtualItem.key}
                      data-index={virtualItem.index}
                      ref={virtualizer.measureElement}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <TaskItem
                        task={task}
                        onComplete={handleComplete}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        isCompleting={completeMutation.isPending}
                        isDeleting={deleteMutation.isPending}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isCompleting={completeMutation.isPending}
                  isDeleting={deleteMutation.isPending}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <TaskForm
        open={showTaskForm}
        onClose={() => {
          setShowTaskForm(false);
          setSelectedTask(undefined);
        }}
        onSubmit={handleSubmit}
        task={selectedTask}
        lists={lists}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
