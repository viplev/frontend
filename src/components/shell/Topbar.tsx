import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export function Topbar() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="h-14 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center px-4 gap-4">
      {/* Breadcrumb / context slot — filled by pages via portal or prop-drilling in future */}
      <div className="flex-1" />

      {/* Create Environment CTA (issue #25) */}
      <Link
        to="/environments/new"
        className="px-3 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
      >
        + Create Environment
      </Link>

      {/* Theme toggle (issue #24) */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="p-2 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
      >
        {theme === 'dark' ? '☀' : '🌙'}
      </button>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
      >
        Logout
      </button>
    </header>
  );
}
