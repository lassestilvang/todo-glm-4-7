'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Task, TaskStatus } from '@/features/tasks/types';

interface SubtaskItemProps {
  task: Task;
  onComplete?: (taskId: number, status: TaskStatus) => void;
}

export function SubtaskItem({ task, onComplete }: SubtaskItemProps) {
  const [showDetails, setShowDetails] = useState(false);

  const handleComplete = (checked: boolean) => {
    onComplete?.(task.id, checked ? 'done' : 'todo');
  };

  const isCompleted = task.status === 'done';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="group rounded-md border bg-card p-3 transition-colors hover:bg-accent/50"
    >
      <div className="flex items-start gap-2">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={handleComplete}
          className="mt-0.5"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {task.description && (
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 -ml-2"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}
            
            <h4
              className={cn(
                'text-sm font-medium truncate',
                isCompleted && 'line-through text-muted-foreground'
              )}
            >
              {task.name}
            </h4>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1">
            {task.deadline && (
              <Badge variant="outline" className="text-xs">
                <Clock className="mr-1 h-2 w-2" />
                {format(new Date(task.deadline), 'MMM d')}
              </Badge>
            )}

            {task.estimated_time && (
              <Badge variant="outline" className="text-xs">
                {task.estimated_time}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {showDetails && task.description && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-2 text-xs text-muted-foreground"
        >
          {task.description}
        </motion.div>
      )}
    </motion.div>
  );
}
