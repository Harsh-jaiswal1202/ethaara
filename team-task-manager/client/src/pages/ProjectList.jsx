import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
  ArrowRightIcon,
  ChartBarIcon,
  FolderIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { roleBadgeClass } from '../utils/uiStyles';
import ConfirmModal from '../components/ConfirmModal';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    project: null,
    loading: false
  });

  const fetchProjects = useCallback(async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        const { data } = await api.get('/projects');
        if (mounted) setProjects(data);
      } catch (error) {
        console.error('Failed to fetch projects', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const totals = useMemo(() => {
    const taskCount = projects.reduce((sum, project) => sum + (project._count?.tasks || 0), 0);
    const adminCount = projects.filter((project) => project.userRole === 'ADMIN').length;

    return { taskCount, adminCount };
  }, [projects]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', newProject);
      setShowModal(false);
      setNewProject({ name: '', description: '' });
      fetchProjects();
    } catch (error) {
      console.error('Failed to create project', error);
    }
  };

  const handleDeleteProject = (project) => {
    setConfirmModal({
      isOpen: true,
      project,
      loading: false
    });
  };

  const confirmDeleteProject = async () => {
    const { project } = confirmModal;
    if (!project) return;

    setConfirmModal(prev => ({ ...prev, loading: true }));
    try {
      await api.delete(`/projects/${project.id}`);
      if (localStorage.getItem('lastProjectId') === project.id) {
        localStorage.removeItem('lastProjectId');
      }
      setConfirmModal({ isOpen: false, project: null, loading: false });
      fetchProjects();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete project.');
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <section className="space-y-8 pb-10">
      <div className="glass-card rounded-lg p-6 md:p-7 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-600 via-emerald-500 to-amber-400"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-xs font-bold text-primary-700 dark:text-primary-300 mb-3">
              <FolderIcon className="w-4 h-4" />
              Project workspace
            </span>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Projects</h1>
            <p className="text-muted mt-2 max-w-2xl">
              Choose a workspace, review team activity, or create a new project for your next sprint.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 lg:items-center">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-main bg-slate-50 dark:bg-slate-900/40 px-4 py-3 min-w-[92px]">
                <p className="text-xs font-bold text-muted uppercase">Projects</p>
                <p className="text-2xl font-black">{projects.length}</p>
              </div>
              <div className="rounded-lg border border-main bg-slate-50 dark:bg-slate-900/40 px-4 py-3 min-w-[92px]">
                <p className="text-xs font-bold text-muted uppercase">Tasks</p>
                <p className="text-2xl font-black">{totals.taskCount}</p>
              </div>
              <div className="rounded-lg border border-main bg-slate-50 dark:bg-slate-900/40 px-4 py-3 min-w-[92px]">
                <p className="text-xs font-bold text-muted uppercase">Admin</p>
                <p className="text-2xl font-black">{totals.adminCount}</p>
              </div>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center justify-center gap-2 min-h-11">
              <PlusIcon className="w-5 h-5" />
              <span>Create Project</span>
            </button>
          </div>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="glass-card rounded-lg p-10 md:p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-300 border border-primary-500/20 flex items-center justify-center mb-5">
            <FolderIcon className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black mb-2">No projects yet</h3>
          <p className="text-muted mb-6 max-w-md mx-auto">
            Create your first project to invite members, organize tasks, and track progress.
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            <span>Create Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((project) => (
            <article key={project.id} className="glass-card h-full rounded-lg p-5 transition-all hover:-translate-y-1 hover:border-primary-500/40 hover:shadow-primary-500/10 group">
                <div className="flex justify-between items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-300 border border-primary-500/20 flex items-center justify-center shadow-lg shadow-primary-500/10">
                    <FolderIcon className="w-6 h-6" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase ${roleBadgeClass(project.userRole)}`}>
                    {project.userRole}
                  </span>
                </div>

                <div className="min-h-[110px]">
                  <Link to={`/projects/${project.id}`} className="block w-fit">
                    <h3 className="text-xl font-black mb-2 hover:text-primary-600 dark:hover:text-primary-300 transition-colors">
                      {project.name}
                    </h3>
                  </Link>
                  <p className="text-muted text-sm leading-6 line-clamp-3">
                    {project.description || 'No description provided yet.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div className="rounded-lg border border-main bg-slate-50 dark:bg-slate-900/40 p-3">
                    <div className="flex items-center gap-1.5 text-muted text-sm font-bold">
                      <ClipboardDocumentListIcon className="w-4 h-4" />
                      Tasks
                    </div>
                    <p className="text-xl font-black mt-1">{project._count?.tasks || 0}</p>
                  </div>
                  <div className="rounded-lg border border-main bg-slate-50 dark:bg-slate-900/40 p-3">
                    <div className="flex items-center gap-1.5 text-muted text-sm font-bold">
                      <UsersIcon className="w-4 h-4" />
                      Members
                    </div>
                    <p className="text-xl font-black mt-1">{project._count?.members || 0}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-5 pt-4 border-t border-main">
                  <Link to={`/projects/${project.id}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-muted hover:text-primary-600 dark:hover:text-primary-300 transition-colors">
                    <ChartBarIcon className="w-4 h-4" />
                    <span>Open workspace</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                  {project.userRole === 'ADMIN' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(project)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-bold text-red-700 dark:text-red-300 hover:bg-red-500/10 transition-colors"
                      title="Delete project"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </article>
          ))}
        </div>
      )}

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
                  placeholder="e.g. Website Redesign"
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

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Project?"
        message={`Are you sure you want to delete "${confirmModal.project?.name}"? This action is permanent and will remove all tasks, labels, and members associated with this project.`}
        confirmText="Delete Project"
        onConfirm={confirmDeleteProject}
        onCancel={() => setConfirmModal({ isOpen: false, project: null, loading: false })}
        isLoading={confirmModal.loading}
        isDanger={true}
      />
    </section>
  );
};

export default ProjectList;
