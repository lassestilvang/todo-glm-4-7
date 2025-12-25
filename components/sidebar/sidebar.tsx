'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Inbox, CalendarDays, Clock, ListTodo, Home, ChevronRight, Plus, Settings, Tags, Folder } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { List, Label } from '@/features/tasks/types';

interface SidebarProps {
  lists?: List[];
  labels?: Label[];
  overdueCount?: number;
}

export function Sidebar({ lists = [], labels = [], overdueCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  const views = [
    { name: 'Today', href: '/today', icon: Home },
    { name: 'Next 7 Days', href: '/next-7-days', icon: CalendarDays },
    { name: 'Upcoming', href: '/upcoming', icon: Clock },
    { name: 'All Tasks', href: '/all', icon: ListTodo },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <h1 className="text-lg font-semibold">Daily Planner</h1>
      </div>

      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-4">
          <div>
            <h2 className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
              Views
            </h2>
            <div className="space-y-1">
              {views.map((view) => {
                const isActive = pathname === view.href;
                return (
                  <Link
                    key={view.href}
                    href={view.href}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <view.icon className="h-4 w-4" />
                    <span>{view.name}</span>
                    {view.name === 'All Tasks' && overdueCount > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {overdueCount}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <Separator />

          <div>
            <div className="mb-2 flex items-center justify-between px-2">
              <h2 className="text-xs font-semibold text-muted-foreground">
                Lists
              </h2>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-1">
              {lists.map((list) => {
                const isActive = pathname === `/lists/${list.id}`;
                return (
                  <Link
                    key={list.id}
                    href={`/lists/${list.id}`}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <span className="text-base">{list.emoji}</span>
                    <span>{list.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {labels.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="mb-2 flex items-center justify-between px-2">
                  <h2 className="text-xs font-semibold text-muted-foreground">
                    Labels
                  </h2>
                  <Button variant="ghost" size="icon" className="h-5 w-5">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {labels.map((label) => (
                    <Link
                      key={label.id}
                      href={`/labels/${label.id}`}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <span className="text-base">{label.emoji}</span>
                      <span>{label.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </nav>
      </ScrollArea>

      <div className="border-t p-4">
        <Button variant="ghost" className="w-full justify-start" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  );
}
