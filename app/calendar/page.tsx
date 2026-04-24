import { Sidebar } from '@/components/sidebar/sidebar';
import { Calendar } from '@/components/ui/calendar';
import { taskRepository } from '@/features/tasks/actions';
import { listRepository } from '@/features/lists/actions';
import { labelRepository } from '@/features/labels/actions';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';

interface DayTask {
  date: string;
  tasks: Array<{
    id: number;
    name: string;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'high' | 'medium' | 'low' | 'none';
    color?: string;
  }>;
}

export default function CalendarPage() {
  const [lists, labels] = useState<Array<any>>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [tasksByDate, setTasksByDate] = useState<Record<string, DayTask>>({});

  // Load lists and labels
  useEffect(() => {
    const loadInitialData = async () => {
      const [listsData, labelsData] = await Promise.all([
        listRepository.findAll(),
        labelRepository.findUsedLabels()
      ]);
      setLists(listsData);
    };

    loadInitialData();
  }, []);

  // Load tasks for current month
  useEffect(() => {
    const loadTasksForMonth = async () => {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      const allTasks = await taskRepository.findAll();
      const monthTasks = allTasks.filter(task => {
        if (!task.deadline) return false;
        const deadlineDate = new Date(task.deadline);
        return deadlineDate >= monthStart && deadlineDate <= monthEnd;
      });

      // Group tasks by date
      const groupedTasks: Record<string, DayTask> = {};
      monthTasks.forEach(task => {
        if (!task.deadline) return;
        const date = new Date(task.deadline);
        const dateString = format(date, 'yyyy-MM-dd');
        
        if (!groupedTasks[dateString]) {
          groupedTasks[dateString] = {
            date: dateString,
            tasks: []
          };
        }

        groupedTasks[dateString].tasks.push({
          id: task.id,
          name: task.name,
          status: task.status,
          priority: task.priority,
          color: '#3b82f6' // Default color
        });
      });

      setTasksByDate(groupedTasks);
    };

    loadTasksForMonth();
  }, [currentDate]);

  return (
    <div className="flex h-screen">
      <Sidebar lists={lists} labels={labels} />
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Calendar View</h1>
          <p className="mt-2 text-muted-foreground">
            View and manage your tasks by date
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => {
                  const newDate = subMonths(currentDate, 1);
                  setCurrentDate(newDate);
                  loadTasksForMonth(newDate);
                }}
                className="btn-ghost h-9 w-9"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <h2 className="text-xl font-semibold">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <button 
                onClick={() => {
                  const newDate = addMonths(currentDate, 1);
                  setCurrentDate(newDate);
                  loadTasksForMonth(newDate);
                }}
                className="btn-ghost h-9 w-9"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <Calendar 
            onDayClick={(date) => {
              const dateString = format(date, 'yyyy-MM-dd');
              setSelectedDate(dateString);
            }}
            selected={selectedDate ? new Date(selectedDate) : undefined}
            month={currentDate}
            numberOfMonths={1}
          />
          
          {/* Selected day tasks */}
          {selectedDate && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold mb-2">
                Tasks for {format(new Date(selectedDate), 'PPP')}
              </h2>
              {tasksByDate[selectedDate] && tasksByDate[selectedDate].tasks.length > 0 ? (
                <div className="space-y-2">
                  {tasksByDate[selectedDate].tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-2">
                        {task.status === 'done' && (
                          <span className="h-3 w-3 rounded-full bg-green-500/20 text-green-500">✓</span>
                        )}
                        {task.status !== 'done' && (
                          <span className="h-3 w-3 rounded-full border">○</span>
                        )}
                        <span className="text-xs font-medium">{task.name}</span>
                      </div>
                      <div className="ml-auto flex items-center gap-2 text-xs">
                        <span className={`px-2 py-0.5 rounded text-[${task.color || '#3b82f6'}] bg-[${task.color || '#3b82f6'}]/10`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No tasks for this date
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}