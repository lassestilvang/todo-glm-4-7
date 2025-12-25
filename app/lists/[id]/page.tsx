import { Sidebar } from '@/components/sidebar/sidebar';
import { TaskListView } from '@/components/tasks/task-list-view';
import { listRepository } from '@/features/lists/actions';
import { labelRepository } from '@/features/labels/actions';
import { taskRepository } from '@/features/tasks/actions';
import { viewUtils } from '@/features/tasks/views';

export const dynamic = 'force-dynamic';

interface ListPageProps {
  params: { id: string };
}

export default async function ListPage({ params }: ListPageProps) {
  const listId = parseInt(params.id);
  console.log('ListPage: listId =', listId, 'typeof listId =', typeof listId);
  const list = await listRepository.findById(listId);
  console.log('ListPage: list =', list);

  if (!list) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">List not found</h1>
          <p className="text-muted-foreground">The requested list does not exist.</p>
        </div>
      </div>
    );
  }

  const [lists, labels, tasks, overdueTasks] = await Promise.all([
    listRepository.findAll(),
    labelRepository.findUsedLabels(),
    taskRepository.findByList(listId),
    viewUtils.getOverdueTasks()
  ]);

  return (
    <div className="flex h-screen">
      <Sidebar lists={lists} labels={labels} overdueCount={overdueTasks.length} />
      <main className="flex-1">
        <TaskListView view="list" lists={lists} labels={labels} initialTasks={tasks} currentList={list} />
      </main>
    </div>
  );
}
