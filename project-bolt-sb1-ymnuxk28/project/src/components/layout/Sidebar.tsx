import { LayoutDashboard, KanbanSquare, Archive, Headphones, Settings } from 'lucide-react';
import type { ViewName } from '@/types';

interface SidebarProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
  counts: { active: number; archive: number };
}

const NAV_ITEMS: { id: ViewName; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'active', label: 'Active Tickets', icon: KanbanSquare },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ currentView, onNavigate, counts }: SidebarProps) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
          <Headphones size={20} />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900 leading-tight">Support Command</h1>
          <p className="text-xs text-slate-500">Ticket Command Center</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>
        {NAV_ITEMS.map((item) => {
          const active = currentView === item.id;
          const Icon = item.icon;
          const count = item.id === 'active' ? counts.active : item.id === 'archive' ? counts.archive : undefined;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon size={18} />
              <span className="flex-1 text-left">{item.label}</span>
              {count !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 px-5 py-4">
        <p className="text-xs text-slate-400">
          Personal workspace for organizing support cases across multiple ticketing systems.
        </p>
      </div>
    </aside>
  );
}
