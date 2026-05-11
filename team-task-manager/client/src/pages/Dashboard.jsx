import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import { useSocket } from '../context/SocketContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  ClipboardDocumentCheckIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  FolderOpenIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const Dashboard = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socket = useSocket();
  const navigate = useNavigate();

  const fetchDashboard = useCallback(async ({ showLoader = false } = {}) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const [dashboardResponse, projectResponse] = await Promise.all([
        api.get(`/projects/${id}/dashboard`),
        api.get(`/projects/${id}`),
      ]);

      setData(dashboardResponse.data);
      setProject(projectResponse.data);
    } catch (fetchError) {
      console.error('Failed to fetch dashboard data', fetchError);
      setError('Could not load this dashboard right now.');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      await fetchDashboard({ showLoader: true });
      if (!mounted) return;
      localStorage.setItem('lastProjectId', id);
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [fetchDashboard, id]);

  useEffect(() => {
    if (!socket || !id) return undefined;

    socket.emit('joinProject', id);

    const refreshDashboard = () => {
      fetchDashboard();
    };
    const handleProjectDeleted = ({ projectId }) => {
      if (projectId === id) navigate('/projects');
    };

    socket.on('taskUpdated', refreshDashboard);
    socket.on('projectUpdated', refreshDashboard);
    socket.on('projectDeleted', handleProjectDeleted);

    return () => {
      socket.emit('leaveProject', id);
      socket.off('taskUpdated', refreshDashboard);
      socket.off('projectUpdated', refreshDashboard);
      socket.off('projectDeleted', handleProjectDeleted);
    };
  }, [fetchDashboard, id, navigate, socket]);

  const stats = useMemo(() => {
    const byStatus = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
      ...(data?.byStatus || {}),
    };

    const totalTasks = data?.totalTasks || 0;
    const completedTasks = byStatus.DONE;
    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const activeTasks = byStatus.TODO + byStatus.IN_PROGRESS;

    return { byStatus, totalTasks, completedTasks, completionRate, activeTasks };
  }, [data]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card rounded-lg p-8 text-center">
        <ExclamationCircleIcon className="w-12 h-12 mx-auto text-red-500 mb-3" />
        <h2 className="text-xl font-bold mb-2">Dashboard unavailable</h2>
        <p className="text-muted mb-5">{error}</p>
        <Link to={`/projects/${id}`} className="btn-primary inline-flex items-center gap-2">
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back to project</span>
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const tasksByUser = data.tasksByUser || [];
  const overdueTasks = data.overdueTasks || [];

  return (
    <section className="space-y-8 pb-10">
      <div className="glass-card rounded-lg p-6 md:p-7 overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-600 via-emerald-500 to-amber-400"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Link
              to={`/projects/${id}`}
              className="w-11 h-11 shrink-0 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-muted transition-colors border border-main flex items-center justify-center"
              title="Back to task board"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-xs font-bold text-primary-600 dark:text-primary-300">
                  <ChartBarIcon className="w-4 h-4" />
                  Dashboard
                </span>
                {project?.userRole && (
                  <span className="rounded-full border border-main bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold uppercase text-muted">
                    {project.userRole}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                {project?.name || 'Project'} Overview
              </h1>
              <p className="text-muted mt-2 max-w-2xl">
                Track progress, assignments, and deadlines for this workspace.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 min-w-full sm:min-w-[280px] lg:min-w-[320px]">
            <div className="rounded-lg border border-main bg-slate-50 dark:bg-slate-900/40 p-4">
              <div className="flex items-center gap-2 text-muted text-sm font-bold">
                <UsersIcon className="w-4 h-4" />
                Members
              </div>
              <p className="text-2xl font-black mt-1">{data.members?.length || 0}</p>
            </div>
            <div className="rounded-lg border border-main bg-slate-50 dark:bg-slate-900/40 p-4">
              <div className="flex items-center gap-2 text-muted text-sm font-bold">
                <ArrowTrendingUpIcon className="w-4 h-4" />
                Complete
              </div>
              <p className="text-2xl font-black mt-1">{stats.completionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total Tasks"
          value={stats.totalTasks}
          icon={<ClipboardDocumentCheckIcon className="w-6 h-6" />}
          color="primary"
          helper={`${stats.activeTasks} active`}
        />
        <StatCard
          title="To Do"
          value={stats.byStatus.TODO}
          icon={<ClockIcon className="w-6 h-6" />}
          color="slate"
          helper="Ready to start"
        />
        <StatCard
          title="In Progress"
          value={stats.byStatus.IN_PROGRESS}
          icon={<ArrowTrendingUpIcon className="w-6 h-6" />}
          color="blue"
          helper="Currently moving"
        />
        <StatCard
          title="Done"
          value={stats.completedTasks}
          icon={<CheckCircleIcon className="w-6 h-6" />}
          color="emerald"
          helper={`${stats.completionRate}% completion`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 glass-card rounded-lg p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
            <div>
              <h3 className="text-xl font-bold">Tasks by Assigned User</h3>
              <p className="text-muted text-sm mt-1">Workload distribution across project members.</p>
            </div>
            <Link to={`/projects/${id}`} className="btn-secondary inline-flex items-center gap-2 w-fit">
              <FolderOpenIcon className="w-5 h-5" />
              <span>Open Board</span>
            </Link>
          </div>

          {tasksByUser.length === 0 ? (
            <div className="h-[320px] rounded-lg border border-dashed border-main bg-slate-50/70 dark:bg-slate-900/30 flex items-center justify-center p-6">
              <div className="text-center max-w-sm">
                <ChartBarIcon className="w-12 h-12 mx-auto text-primary-500/40 mb-3" />
                <h4 className="font-bold mb-1">No assigned tasks yet</h4>
                <p className="text-muted text-sm">
                  Assign tasks to team members and this chart will show the workload split.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksByUser} margin={{ top: 16, right: 18, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-700" vertical={false} />
                  <XAxis dataKey="name" stroke="currentColor" className="text-muted" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" className="text-muted" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(37, 99, 235, 0.08)' }}
                    contentStyle={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-main)',
                      boxShadow: '0 18px 40px rgba(15, 23, 42, 0.16)',
                    }}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} maxBarSize={54} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold">Completion</h3>
                <p className="text-muted text-sm mt-1">Done tasks against total work.</p>
              </div>
              <span className="text-3xl font-black">{stats.completionRate}%</span>
            </div>
            <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-600 to-emerald-500 transition-all"
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-muted mt-3">
              <span>{stats.completedTasks} done</span>
              <span>{stats.totalTasks} total</span>
            </div>
          </div>

          <div className="glass-card rounded-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-bold">Overdue Tasks</h3>
                <p className="text-muted text-sm mt-1">Items that need attention.</p>
              </div>
              <span className="bg-red-500/10 text-red-600 dark:text-red-300 text-xs px-2.5 py-1 rounded-full font-bold border border-red-500/20">
                {overdueTasks.length}
              </span>
            </div>

            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {overdueTasks.length === 0 ? (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
                  <CheckCircleIcon className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
                  <p className="font-bold">No overdue tasks</p>
                  <p className="text-muted text-sm mt-1">Deadlines are looking healthy.</p>
                </div>
              ) : (
                overdueTasks.map((task) => (
                  <div key={task.id} className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <h4 className="font-bold text-sm leading-5">{task.title}</h4>
                      <ExclamationCircleIcon className="w-5 h-5 text-red-500 shrink-0" />
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-300 font-bold">
                      Due {dateFormatter.format(new Date(task.dueDate))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
