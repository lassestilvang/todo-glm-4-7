'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { format } from 'date-fns';
import { Check, Clock, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SubtaskItem } from './subtask-item';
import type { Task, TaskStatus, Priority } from '@/features/tasks/types';

interface TaskItemProps {
  task: Task;
  onComplete?: (taskId: number, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: number) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const priorityColors: Record<Priority, string> = {
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  low: 'bg-green-500/10 text-green-500 border-green-500/20',
  none: 'bg-muted text-muted-foreground',
};

export function TaskItem({ 
  task, 
  onComplete, 
  onEdit, 
  onDelete,
  isExpanded = false,
  onToggleExpand 
}: TaskItemProps) {
  const [showSubtasks, setShowSubtasks] = useState(isExpanded);
  const taskSubtasks = 'subtasks' in task ? (task as any).subtasks : [];
  const taskLabels = 'labels' in task ? (task as any).labels : [];
  const hasSubtasks = taskSubtasks && taskSubtasks.length > 0;
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';

  const handleComplete = (checked: boolean) => {
    onComplete?.(task.id, checked ? 'done' : 'todo');
  };

  const isCompleted = task.status === 'done';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'group rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50',
        isCompleted && 'opacity-60',
        isOverdue && 'border-red-500/50'
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleComplete}
          className="mt-0.5"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {hasSubtasks && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 -ml-2"
                onClick={() => setShowSubtasks(!showSubtasks)}
              >
                {showSubtasks ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}
            
            <h3
              className={cn(
                'font-medium truncate cursor-pointer',
                isCompleted && 'line-through text-muted-foreground'
              )}
              onClick={() => onEdit?.(task)}
            >
              {task.name}
            </h3>
            
            {isOverdue && (
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            )}
          </div>

          {task.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {task.deadline && (
              <Badge variant="outline" className="text-xs">
                <Clock className="mr-1 h-3 w-3" />
                {format(new Date(task.deadline), 'MMM d, h:mm a')}
              </Badge>
            )}

            <Badge
              variant="outline"
              className={cn('text-xs', priorityColors[task.priority])}
            >
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>

            {task.estimated_time && (
              <Badge variant="outline" className="text-xs">
                Est: {task.estimated_time}
              </Badge>
            )}

            {task.actual_time && (
              <Badge variant="outline" className="text-xs">
                Act: {task.actual_time}
              </Badge>
            )}

             {taskLabels && taskLabels.length > 0 && taskLabels.map((label: any) => (
               <Badge
                 key={label.id}
                 variant="outline"
                 className="text-xs"
                 style={{ borderColor: label.color, color: label.color }}
               >
                 {label.emoji} {label.name}
               </Badge>
             ))}
          </div>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit?.(task)}
          >
            <Check className="h-4 w-4" />
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(task.id)}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSubtasks && hasSubtasks && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 ml-6 space-y-2 border-l-2 pl-4"
          >
            {taskSubtasks.map((subtask: any) => (
              <SubtaskItem
                key={subtask.id}
                task={subtask}
                onComplete={onComplete}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
