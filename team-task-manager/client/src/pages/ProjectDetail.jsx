import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import TaskBoard from '../components/TaskBoard';
import MemberList from '../components/MemberList';
import {
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  TrashIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useSocket } from '../context/SocketContext';
import { roleBadgeClass } from '../utils/uiStyles';
import ConfirmModal from '../components/ConfirmModal';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const navigate = useNavigate();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProject = useCallback(async () => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data);
    } catch (error) {
      console.error('Failed to fetch project', error);
    }
  }, [id]);

  const fetchLabels = useCallback(async () => {
    try {
      const { data } = await api.get(`/labels/projects/${id}/labels`);
      setLabels(data);
    } catch (error) {
      console.error('Failed to fetch labels', error);
    }
  }, [id]);

  const socket = useSocket();

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        await Promise.all([fetchProject(), fetchLabels()]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    if (socket && id) {
      localStorage.setItem('lastProjectId', id);
      socket.emit('joinProject', id);

      const handleProjectUpdated = () => {
        fetchProject();
      };
      const handleProjectDeleted = ({ projectId }) => {
        if (projectId === id) navigate('/projects');
      };

      socket.on('projectUpdated', handleProjectUpdated);
      socket.on('taskUpdated', handleProjectUpdated);
      socket.on('projectDeleted', handleProjectDeleted);

      return () => {
        mounted = false;
        socket.emit('leaveProject', id);
        socket.off('projectUpdated', handleProjectUpdated);
        socket.off('taskUpdated', handleProjectUpdated);
        socket.off('projectDeleted', handleProjectDeleted);
      };
    }

    return () => {
      mounted = false;
    };
  }, [id, socket, fetchProject, fetchLabels, navigate]);

  const projectStats = useMemo(() => {
    const tasks = project?.tasks || [];
    const total = tasks.length;
    const done = tasks.filter((task) => task.status === 'DONE').length;
    const inProgress = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
    const completion = total ? Math.round((done / total) * 100) : 0;

    return { total, done, inProgress, completion };
  }, [project]);

  const handleDeleteProject = () => {
    setIsConfirmOpen(true);
  };

  const confirmDeleteProject = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/projects/${project.id}`);
      if (localStorage.getItem('lastProjectId') === project.id) {
        localStorage.removeItem('lastProjectId');
      }
      navigate('/projects');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete project.');
      setIsDeleting(false);
      setIsConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="glass-card rounded-lg p-10 text-center">
        <h2 className="text-xl font-black mb-2">Project not found</h2>
        <p className="text-muted">This project may have been removed or you may not have access.</p>
      </div>
    );
  }

  const isAdmin = project.userRole === 'ADMIN';

  return (
    <section className="space-y-6 pb-10">
      <div className="glass-card rounded-lg p-6 md:p-7 overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-600 via-emerald-500 to-amber-400"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-xs font-bold text-primary-700 dark:text-primary-300">
                <ClipboardDocumentListIcon className="w-4 h-4" />
                Workspace
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase ${roleBadgeClass(project.userRole)}`}>
                {project.userRole}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">{project.name}</h1>
            <p className="text-muted mt-2 max-w-3xl">
              {project.description || 'Manage tasks, members, labels, and progress for this project.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-main bg-slate-50 dark:bg-slate-900/40 px-4 py-3 min-w-[96px]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted uppercase">
                  <ClockIcon className="w-4 h-4" />
                  Active
                </div>
                <p className="text-2xl font-black mt-1">{projectStats.total - projectStats.done}</p>
              </div>
              <div className="rounded-lg border border-main bg-slate-50 dark:bg-slate-900/40 px-4 py-3 min-w-[96px]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted uppercase">
                  <CheckCircleIcon className="w-4 h-4" />
                  Done
                </div>
                <p className="text-2xl font-black mt-1">{projectStats.done}</p>
              </div>
              <div className="rounded-lg border border-main bg-slate-50 dark:bg-slate-900/40 px-4 py-3 min-w-[96px]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted uppercase">
                  <UsersIcon className="w-4 h-4" />
                  Team
                </div>
                <p className="text-2xl font-black mt-1">{project.members.length}</p>
              </div>
            </div>

            <Link
              to={`/projects/${id}/dashboard`}
              className="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap min-h-11"
            >
              <ChartBarIcon className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            {isAdmin && (
              <button
                type="button"
                onClick={handleDeleteProject}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 font-bold text-red-700 dark:text-red-300 hover:bg-red-500/20 transition-colors min-h-11"
              >
                <TrashIcon className="w-5 h-5" />
                <span>Delete Project</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg w-fit border border-main">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold transition-all ${
              activeTab === 'tasks'
                ? 'bg-white dark:bg-slate-800 text-primary-700 dark:text-primary-300 shadow-sm border border-main'
                : 'text-muted hover:text-main hover:bg-white/70 dark:hover:bg-slate-800/70'
            }`}
          >
            <ClipboardDocumentListIcon className="w-4 h-4" />
            <span>Tasks</span>
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold transition-all ${
              activeTab === 'members'
                ? 'bg-white dark:bg-slate-800 text-primary-700 dark:text-primary-300 shadow-sm border border-main'
                : 'text-muted hover:text-main hover:bg-white/70 dark:hover:bg-slate-800/70'
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            <span>Members ({project.members.length})</span>
          </button>
        </div>

        <div className="w-full md:w-72">
          <div className="flex justify-between text-xs font-bold text-muted mb-2">
            <span>Completion</span>
            <span>{projectStats.completion}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-600 to-emerald-500"
              style={{ width: `${projectStats.completion}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="min-h-[calc(100vh-320px)]">
        {activeTab === 'tasks' ? (
          <TaskBoard project={project} labels={labels} fetchLabels={fetchLabels} refreshProject={fetchProject} isAdmin={isAdmin} />
        ) : (
          <MemberList project={project} refreshProject={fetchProject} isAdmin={isAdmin} />
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Delete Project?"
        message={`Are you sure you want to delete "${project.name}"? This will permanently remove all tasks, labels, and members. This action cannot be undone.`}
        confirmText="Delete Project"
        onConfirm={confirmDeleteProject}
        onCancel={() => setIsConfirmOpen(false)}
        isLoading={isDeleting}
        isDanger={true}
      />
    </section>
  );
};

export default ProjectDetail;
