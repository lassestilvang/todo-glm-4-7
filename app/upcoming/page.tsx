import { Sidebar } from '@/components/sidebar/sidebar';
import { TaskListView } from '@/components/tasks/task-list-view';
import { listRepository } from '@/features/lists/actions';
import { labelRepository } from '@/features/labels/actions';
import { viewUtils } from '@/features/tasks/views';

export const dynamic = 'force-dynamic';

export default async function UpcomingPage() {
  const [lists, labels, tasks, overdueTasks] = await Promise.all([
    listRepository.findAll(),
    labelRepository.findUsedLabels(),
    viewUtils.getUpcomingTasks(),
    viewUtils.getOverdueTasks()
  ]);

  return (
    <div className="flex h-screen">
      <Sidebar lists={lists} labels={labels} overdueCount={overdueTasks.length} />
      <main className="flex-1">
        <TaskListView view="upcoming" lists={lists} labels={labels} initialTasks={tasks} />
      </main>
    </div>
  );
}
