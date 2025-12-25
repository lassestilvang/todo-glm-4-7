'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TaskItem } from './task-item';
import { TaskForm } from './task-form';
import type { Task, TaskStatus, List, Label } from '@/features/tasks/types';
import { createTask, updateTask } from '@/app/actions';
import { useRouter } from 'next/navigation';

interface TaskListViewProps {
  view: string;
  lists: List[];
  labels: Label[];
  initialTasks: Task[];
}

export function TaskListView({ view, lists, labels, initialTasks }: TaskListViewProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [showCompleted, setShowCompleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  const [overdueCount, setOverdueCount] = useState(0);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredTasks = tasks.filter(task => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const taskLabels = 'labels' in task ? (task as any).labels : [];
    return (
      task.name.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      taskLabels.some((l: any) => l.name.toLowerCase().includes(query))
    );
  });

  const handleComplete = (taskId: number, status: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
  };

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setShowTaskForm(true);
  };

  const handleDelete = (taskId: number) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleSubmit = async (data: any) => {
    if (selectedTask) {
      await updateTask(selectedTask.id, data);
    } else {
      await createTask(data);
    }
    setShowTaskForm(false);
    setSelectedTask(undefined);
    router.refresh();
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
            {view.replace('_', ' ')}
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
        labels={labels}
      />
    </div>
  );
}
