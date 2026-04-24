'use client';

import { useEffect, useState, useRef } from 'react';
import { PlayPause, SkipBack, SkipForward, Circle, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PomodoroTimerProps {
  _taskId: number;
  onSessionComplete?: (sessionType: 'work' | 'break') => void;
}

// Work and break durations in minutes
const WORK_DURATION = 25 * 60; // 25 minutes
const SHORT_BREAK_DURATION = 5 * 60; // 5 minutes
const LONG_BREAK_DURATION = 15 * 60; // 15 minutes

export function PomodoroTimer({ onSessionComplete }: PomodoroTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkSession, setIsWorkSession] = useState(true);
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION); // 25 minutes in seconds
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            // Time's up
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setIsRunning(false);

            // Handle session completion
            if (isWorkSession) {
              setPomodorosCompleted(prev => prev + 1);
              onSessionComplete?.('work');
              // After work session, decide next break
              if (pomodorosCompleted % 4 === 0) {
                // After 4 pomodoros, long break
                setIsWorkSession(false);
                setTimeLeft(LONG_BREAK_DURATION);
              } else {
                // Otherwise, short break
                setIsWorkSession(false);
                setTimeLeft(SHORT_BREAK_DURATION);
              }
            } else {
              // Break session completed
              onSessionComplete?.('break');
              setIsWorkSession(true);
              setTimeLeft(WORK_DURATION);
            }
          }
          return prevTime - 1;
        });
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
  }, [isRunning, isWorkSession, pomodorosCompleted, onSessionComplete, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleToggle = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    setIsWorkSession(true);
    setTimeLeft(WORK_DURATION);
    setPomodorosCompleted(0);
  };

  const handleSkipBack = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    // Go back to the start of the current session
    setTimeLeft(isWorkSession ? WORK_DURATION : (pomodorosCompleted % 4 === 0 && !isWorkSession ? LONG_BREAK_DURATION : SHORT_BREAK_DURATION));
  };

  const handleSkipForward = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    // Skip to the next session
    if (isWorkSession) {
      // Skip work session, go to break
      setIsWorkSession(false);
      setTimeLeft(pomodorosCompleted % 4 === 0 ? LONG_BREAK_DURATION : SHORT_BREAK_DURATION);
    } else {
      // Skip break, go to work
      setIsWorkSession(true);
      setTimeLeft(WORK_DURATION);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">{isWorkSession ? 'Focus Session' : 'Break Time'}</h3>
        <p className="text-sm text-muted-foreground">
          {isWorkSession ? 
            `Work session ${pomodorosCompleted + 1}` : 
            pomodorosCompleted % 4 === 0 ? 'Long break' : 'Short break'
          }
        </p>
      </div>
      
      <div className="relative w-24 h-24">
        <svg className="absolute inset-0" viewBox="0 0 40 40">
          <circle 
            cx="20" 
            cy="20" 
            r="18" 
            stroke={isWorkSession ? '#3b82f6' : '#10b981'} 
            strokeWidth="2" 
            fill="none" 
            opacity="0.2"
          />
          <circle 
            cx="20" 
            cy="20" 
            r="18" 
            stroke={isWorkSession ? '#3b82f6' : '#10b981'} 
            strokeWidth="2" 
            fill="none" 
            strokeDasharray={`${((WORK_DURATION - timeLeft) / WORK_DURATION) * 2 * Math.PI * 18} 100`}
            strokeDashoffset="0"
            transform="rotate(-90 20 20)"
            transition="strokeDashoffset 0.3s"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-2xl font-bold">
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleSkipBack}
          className="h-8 w-8"
          aria-label="Skip to beginning"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleToggle}
          className={cn(
            'h-10 w-10',
            isRunning && 'bg-primary text-primary-foreground'
          )}
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
        >
          {isRunning ? (
            <Pause className="h-4 w-4" />
          ) : (
            <PlayPause className="h-4 w-4" />
          )}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleSkipForward}
          className="h-8 w-8"
          aria-label="Skip to next session"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
      
      <Button 
        variant="outline" 
        onClick={handleReset}
        className="mt-2"
        aria-label="Reset timer"
      >
        <Circle className="mr-2 h-4 w-4" />
        Reset
      </Button>
    </div>
);
}