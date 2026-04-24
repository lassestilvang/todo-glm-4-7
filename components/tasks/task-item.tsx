'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Check, Clock, ChevronDown, ChevronRight, AlertCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateDisplay, isOverdue } from '@/lib/utils/time';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { SubtaskItem } from './subtask-item';
import { Timer } from '@/components/timer/Timer';
import type { Task, TaskStatus, Priority, Label } from '@/features/tasks/types';

interface TaskItemProps {
  task: Task;
  onComplete?: (taskId: number, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: number) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  isCompleting?: boolean;
  isDeleting?: boolean;
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
  onToggleExpand: _onToggleExpand,
  isCompleting = false,
  isDeleting = false
}: TaskItemProps) {
  const [showSubtasks, setShowSubtasks] = useState(isExpanded);
  const taskSubtasks = 'subtasks' in task ? task.subtasks as Task[] : [];
  const taskLabels = 'labels' in task ? task.labels as Label[] : [];
  const hasSubtasks = taskSubtasks && taskSubtasks.length > 0;
  const taskIsOverdue = task.deadline && isOverdue(task.deadline, task.status);

  const handleComplete = (checked: boolean) => {
    if (!isCompleting) {
      onComplete?.(task.id, checked ? 'done' : 'todo');
    }
  };

  const isCompleted = task.status === 'done';

  const getAriaLabel = () => {
    const statusText = isCompleted ? 'completed' : 'not completed';
    const priorityText = task.priority !== 'none' ? `priority ${task.priority}` : '';
    const overdueText = taskIsOverdue ? 'overdue' : '';
    const labels = taskLabels.length > 0 ? `labels: ${taskLabels.map(l => l.name).join(', ')}` : '';
    return `Task: ${task.name}, ${statusText}${priorityText ? `, ${priorityText}` : ''}${overdueText ? `, ${overdueText}` : ''}${labels ? `, ${labels}` : ''}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'group rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50',
        isCompleted && 'opacity-60',
        taskIsOverdue && 'border-red-500/50'
      )}
      role="listitem"
      aria-label={getAriaLabel()}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {isCompleting ? (
            <Spinner size="sm" aria-label="Updating task status" />
          ) : (
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleComplete}
              aria-label={isCompleted ? 'Mark task as incomplete' : 'Mark task as complete'}
            />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {hasSubtasks && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 -ml-2"
                onClick={() => setShowSubtasks(!showSubtasks)}
                aria-label={showSubtasks ? 'Hide subtasks' : 'Show subtasks'}
                aria-expanded={showSubtasks}
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
              role="button"
              tabIndex={0}
              aria-label={`Edit task: ${task.name}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onEdit?.(task);
                }
              }}
            >
              {task.name}
            </h3>

            {taskIsOverdue && (
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            )}
          </div>

           {task.description && (
             <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
               {task.description}
             </p>
           )}
           
           {/* Timer controls */}
           <div className="mt-2 flex items-center gap-2">
             <span className="text-xs text-muted-foreground">Time:</span>
             <Timer 
               taskId={task.id} 
               initialActualTime={task.actual_time || 0} 
             />
           </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {task.deadline && (
              <Badge variant="outline" className="text-xs">
                <Clock className="mr-1 h-3 w-3" />
                {formatDateDisplay(task.deadline)}
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

               {taskLabels && taskLabels.length > 0 && taskLabels.map((label) => (
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
            aria-label={`Edit task: ${task.name}`}
          >
            <Check className="h-4 w-4" />
            <span className="sr-only">Edit task</span>
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => !isDeleting && onDelete(task.id)}
              disabled={isDeleting}
              aria-label={`Delete task: ${task.name}`}
            >
              {isDeleting ? (
                <Spinner size="sm" aria-label="Deleting task" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="sr-only">Delete task</span>
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
            {taskSubtasks.map((subtask) => (
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
