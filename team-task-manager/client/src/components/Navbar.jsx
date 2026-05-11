import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  ArrowRightOnRectangleIcon, 
  UserCircleIcon, 
  SunIcon, 
  MoonIcon 
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 w-full glass border-b border-main mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform shrink-0">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-xl font-black tracking-tight hidden sm:inline">Task Manager</span>
            </Link>
            <div className="hidden md:flex items-center gap-1 ml-4 border-l border-main pl-4">
              <Link to="/projects" className="px-3 py-2 rounded-lg text-sm font-bold text-main hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors">
                Dashboard
              </Link>
              <Link to="/projects/all" className="px-3 py-2 rounded-lg text-sm font-bold text-muted hover:text-main hover:bg-slate-100 dark:hover:bg-slate-900/60 transition-colors">
                Projects
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900/60 text-muted hover:text-main transition-colors border border-main shrink-0"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>

            {user && (
              <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-main min-w-0">
                <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900/60 border border-main min-w-0">
                  <UserCircleIcon className="w-5 h-5 text-muted shrink-0" />
                  <span className="text-sm font-bold truncate max-w-[96px] sm:max-w-[160px]">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm font-bold text-muted hover:text-red-500 transition-colors shrink-0"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
