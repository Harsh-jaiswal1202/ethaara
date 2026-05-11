import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import {
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  FolderIcon,
  PlusIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { roleBadgeClass } from '../utils/uiStyles';

const HomeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  const fetchDashboard = useCallback(async () => {
    try {
      const { data: dashboardData } = await api.get('/projects/dashboard');
      setData(dashboardData);
    } catch (error) {
      console.error('Failed to fetch global dashboard', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeDashboard = async () => {
      await fetchDashboard();
    };
    initializeDashboard();
  }, [fetchDashboard]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', newProject);
      setShowModal(false);
      setNewProject({ name: '', description: '' });
      fetchDashboard();
    } catch (error) {
      console.error('Failed to create project', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500"></div>
      </div>
    );
  }

  const { projects = [], stats = {}, myOverdueTasks = [] } = data || {};

  return (
    <section className="space-y-8 pb-10">
      {/* Header section with Premium design */}
      <div className="glass-card rounded-lg p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary-600 via-emerald-500 to-amber-400"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-4 py-1.5 text-xs font-black text-primary-700 dark:text-primary-300 mb-4 uppercase tracking-wider">
              <ChartBarIcon className="w-4 h-4" />
              Central Dashboard
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">Welcome Back!</h1>
            <p className="text-muted text-lg max-w-2xl leading-relaxed">
              Here's an overview of your projects, tasks, and team activity across the entire workspace.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
             <button 
               onClick={() => setShowModal(true)} 
               className="btn-primary inline-flex items-center justify-center gap-2 h-12 px-6 shadow-xl shadow-primary-500/20"
             >
              <PlusIcon className="w-5 h-5" />
              <span>New Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Active Projects"
          value={stats.totalProjects || 0}
          icon={<FolderIcon className="w-6 h-6" />}
          color="primary"
          helper="Managed by you"
        />
        <StatCard
          title="My Tasks"
          value={stats.myTasksCount || 0}
          icon={<ClipboardDocumentListIcon className="w-6 h-6" />}
          color="blue"
          helper={`${stats.myCompletedTasks || 0} completed`}
        />
        <StatCard
          title="Global Progress"
          value={stats.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}
          icon={<CheckCircleIcon className="w-6 h-6" />}
          color="emerald"
          suffix="%"
          helper="Across all projects"
        />
        <StatCard
          title="Attention Needed"
          value={myOverdueTasks.length}
          icon={<ExclamationTriangleIcon className="w-6 h-6" />}
          color="amber"
          helper="Overdue tasks"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Project Grid */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight">Your Projects</h2>
            <Link to="/projects/all" className="text-sm font-bold text-primary-600 hover:underline">View All</Link>
          </div>

          {projects.length === 0 ? (
            <div className="glass-card rounded-lg p-12 text-center border-dashed border-2">
               <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-500/10 text-primary-600 border border-primary-500/20 flex items-center justify-center mb-6">
                <FolderIcon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black mb-2">No projects yet</h3>
              <p className="text-muted mb-8 max-w-sm mx-auto">Start by creating a workspace to organize your team and tasks.</p>
              <button onClick={() => setShowModal(true)} className="btn-primary">Create Your First Project</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {projects.slice(0, 4).map((project) => (
                <Link 
                  key={project.id} 
                  to={`/projects/${project.id}`}
                  className="glass-card p-5 rounded-xl hover:-translate-y-1 transition-all group border-l-4 border-l-primary-500"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary-500/10 text-primary-600 flex items-center justify-center border border-primary-500/20">
                      <FolderIcon className="w-5 h-5" />
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${roleBadgeClass(project.userRole)}`}>
                      {project.userRole}
                    </span>
                  </div>
                  <h3 className="text-lg font-black group-hover:text-primary-600 transition-colors mb-1">{project.name}</h3>
                  <p className="text-muted text-sm mb-4">{project.taskCount} tasks</p>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary-600">
                    <span>Open Workspace</span>
                    <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Overdue Tasks */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight">Critical Tasks</h2>
          <div className="glass-card rounded-xl p-5 min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-main">Overdue</h3>
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                Action Required
              </span>
            </div>

            <div className="space-y-4">
              {myOverdueTasks.length === 0 ? (
                <div className="text-center py-12">
                   <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4">
                    <CheckCircleIcon className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-main">All caught up!</p>
                  <p className="text-muted text-xs mt-1">No overdue tasks assigned to you.</p>
                </div>
              ) : (
                myOverdueTasks.map((task) => (
                  <div key={task.id} className="p-4 rounded-lg bg-red-500/5 border border-red-500/10 hover:border-red-500/30 transition-colors">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <h4 className="font-bold text-sm leading-tight text-main">{task.title}</h4>
                      <ClockIcon className="w-4 h-4 text-red-500 shrink-0" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-tight">
                        {task.projectName}
                      </span>
                      <span className="text-[10px] text-muted">
                        Due {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {myOverdueTasks.length > 0 && (
              <p className="text-[10px] text-muted text-center mt-6 uppercase font-bold tracking-widest italic">
                showing {myOverdueTasks.length} urgent items
              </p>
            )}
          </div>
        </div>
      </div>

      {/* New Project Modal (duplicated from ProjectList for simplicity, could be abstracted) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-lg p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black">Create New Project</h3>
                <p className="text-muted text-sm mt-1">Add a workspace for tasks, members, and planning.</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="text-muted hover:text-main transition-colors">
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-muted mb-2">Project Name</label>
                <input
                  type="text"
                  required
                  className="input-field h-12"
                  placeholder="e.g. Global Expansion"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-muted mb-2">Description</label>
                <textarea
                  className="input-field min-h-[120px] resize-y"
                  placeholder="What is this project about?"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default HomeDashboard;
