'use client';

import { useEffect, useState, useRef } from 'react';
import { Clock, PlayPause, Stopwatch, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { taskRepository } from '@/features/tasks/actions';

interface TimerProps {
  taskId: number;
  initialActualTime: number; // in minutes
  onUpdateActualTime?: (actualTime: number) => void;
}

export function Timer({ taskId, initialActualTime, onUpdateActualTime }: TimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [displayTime, setDisplayTime] = useState('00:00');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Format seconds to MM:SS
  useEffect(() => {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    setDisplayTime(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
  }, [elapsedSeconds]);

  // Update the elapsed time every second when running
  useEffect(() => {
    if (isRunning && startTimeRef.current !== null) {
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(initialActualTime * 60 + elapsed); // Convert initial time to seconds and add elapsed
      }, 1000);
    } else if (!isRunning && intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, initialActualTime]);

  const handleToggle = () => {
    if (isRunning) {
      // Stop the timer
      setIsRunning(false);
      startTimeRef.current = null;
    } else {
      // Start the timer
      setIsRunning(true);
      startTimeRef.current = Date.now() - (elapsedSeconds * 1000);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
    setDisplayTime('00:00');
    startTimeRef.current = null;
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Reset to initial actual time (if any) - but we don't update the task here because reset means discard
    // In a real app, we might want to confirm reset or only allow reset when not running
  };

  const handleSave = async () => {
    // Convert total seconds to minutes (rounded)
    const totalMinutes = Math.round(elapsedSeconds / 60);
    try {
      // Update the task's actual time in the database
      await taskRepository.update(taskId, { actual_time: totalMinutes });
      if (onUpdateActualTime) {
        onUpdateActualTime(totalMinutes);
      }
      // Reset the timer after saving
      handleReset();
    } catch (error) {
      console.error('Failed to update task time:', error);
      // In a real app, we would show an error message
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        className={cn(
          'h-9 w-9 btn-ghost',
          isRunning && 'bg-primary text-primary-foreground'
        )}
        aria-label={isRunning ? 'Stop timer' : 'Start timer'}
      >
        {isRunning ? (
          <Stopwatch className="h-4 w-4" />
        ) : (
          <PlayPause className="h-4 w-4" />
        )}
      </button>
      <div className="text-xs font-mono text-muted-foreground">
        {displayTime}
      </div>
      {!isRunning && elapsedSeconds > 0 && (
        <button
          onClick={handleSave}
          className="h-9 w-9 btn-ghost hover:bg-accent"
          aria-label="Save time"
        >
          <Check className="h-4 w-4" />
        </button>
      )}
      {elapsedSeconds > 0 && (
        <button
          onClick={handleReset}
          className="h-9 w-9 btn-ghost text-destructive hover:text-destructive"
          aria-label="Reset timer"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Helper function for conditional class names (since we don't have cn imported here)
function cn(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}