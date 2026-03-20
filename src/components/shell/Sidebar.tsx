import { NavLink, useParams } from 'react-router-dom';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
    isActive
      ? 'bg-indigo-700 text-white'
      : 'text-slate-300 hover:bg-slate-700 hover:text-white',
  ].join(' ');

function EnvironmentSubNav() {
  const { environmentId } = useParams<{ environmentId: string }>();
  if (!environmentId) return null;

  const base = `/environments/${environmentId}`;
  return (
    <div className="mt-1 pl-4 border-l border-slate-600 flex flex-col gap-0.5">
      <NavLink to={`${base}/benchmarks`} className={navLinkClass}>
        Benchmarks
      </NavLink>
      <NavLink to={`${base}/runs`} className={navLinkClass}>
        Run History
      </NavLink>
      <NavLink to={`${base}/services`} className={navLinkClass}>
        Services
      </NavLink>
      <NavLink to={`${base}/messages`} className={navLinkClass}>
        Messages
      </NavLink>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-slate-800 flex flex-col h-full">
      <div className="px-4 py-5 border-b border-slate-700">
        <span className="text-white font-bold text-lg tracking-tight">
          VIPLEV
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 flex flex-col gap-0.5">
        <NavLink to="/environments" end className={navLinkClass}>
          <span>🌍</span> Environments
        </NavLink>
        <EnvironmentSubNav />
        <NavLink to="/runs/active" className={navLinkClass}>
          <span>▶</span> All Active Runs
        </NavLink>
      </nav>
    </aside>
  );
}
