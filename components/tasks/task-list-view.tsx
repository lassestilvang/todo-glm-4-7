'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TaskItem } from './task-item';
import { TaskForm, type TaskFormValues } from './task-form';
import type { Task, TaskStatus, List, Label } from '@/features/tasks/types';
import { createTask, updateTask, completeTask, deleteTask } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface TaskListViewProps {
  view: string;
  lists: List[];
  labels: Label[];
  initialTasks: Task[];
  currentList?: List;
}

export function TaskListView({ view, lists, labels, initialTasks, currentList }: TaskListViewProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [showCompleted, setShowCompleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [completingTasks, setCompletingTasks] = useState<Set<number>>(new Set());
  const [deletingTasks, setDeletingTasks] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredTasks = tasks.filter(task => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const taskLabels = 'labels' in task ? task.labels as Label[] : [];
    return (
      task.name.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      taskLabels.some((l: Label) => l.name.toLowerCase().includes(query))
    );
  });

  const handleComplete = async (taskId: number, status: TaskStatus) => {
    try {
      setCompletingTasks(prev => new Set(prev).add(taskId));
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
      await completeTask(taskId, status);
      toast.success(status === 'done' ? 'Task completed' : 'Task marked as todo');
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.error('Failed to update task status');
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: status === 'done' ? 'todo' : 'done' } : t));
    } finally {
      setCompletingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setShowTaskForm(true);
  };

  const handleDelete = async (taskId: number) => {
    try {
      setDeletingTasks(prev => new Set(prev).add(taskId));
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await deleteTask(taskId);
      toast.success('Task deleted');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
      router.refresh();
    } finally {
      setDeletingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const handleSubmit = async (data: TaskFormValues) => {
    try {
      setIsSubmitting(true);
      if (selectedTask) {
        await updateTask(selectedTask.id, { ...data, labels: [], subtasks: [] });
        toast.success('Task updated successfully');
      } else {
        await createTask({ ...data, labels: [], subtasks: [] });
        toast.success('Task created successfully');
      }
      setShowTaskForm(false);
      setSelectedTask(undefined);
      router.refresh();
    } catch (error) {
      console.error('Task operation failed:', error);
      toast.error(selectedTask ? 'Failed to update task' : 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewTask = () => {
    setSelectedTask(undefined);
    setShowTaskForm(true);
  };

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
            />
          </div>

          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-muted-foreground" />
            <Switch
              checked={showCompleted}
              onCheckedChange={setShowCompleted}
            />
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
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
            ) : (
              filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  isCompleting={completingTasks.has(task.id)}
                  isDeleting={deletingTasks.has(task.id)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      <TaskForm
        open={showTaskForm}
        onClose={() => {
          setShowTaskForm(false);
          setSelectedTask(undefined);
        }}
        onSubmit={handleSubmit}
        task={selectedTask}
        lists={lists}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
