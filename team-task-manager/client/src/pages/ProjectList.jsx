import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { PlusIcon, FolderIcon, UsersIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

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

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500"></div></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
          <p className="text-slate-400">Manage your team's projects and tasks</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          <span>Create Project</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <FolderIcon className="w-16 h-16 mx-auto text-slate-500 mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No projects yet</h3>
          <p className="text-slate-400 mb-6">Get started by creating your first project.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2">
            <PlusIcon className="w-5 h-5" />
            <span>Create Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} className="block group">
              <div className="glass-card h-full rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-primary-500/10">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center">
                    <FolderIcon className="w-6 h-6" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${project.userRole === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-700/50 text-slate-300 border-slate-600'}`}>
                    {project.userRole}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
                  {project.name}
                </h3>
                <p className="text-slate-400 text-sm mb-6 line-clamp-2">
                  {project.description || 'No description provided.'}
                </p>
                <div className="flex items-center gap-4 text-sm text-slate-400 mt-auto pt-4 border-t border-slate-700/50">
                  <div className="flex items-center gap-1.5">
                    <ClipboardDocumentListIcon className="w-4 h-4" />
                    <span>{project._count?.tasks || 0} tasks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UsersIcon className="w-4 h-4" />
                    <span>{project._count?.members || 0} members</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Project Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Website Redesign"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description (Optional)</label>
                <textarea
                  className="input-field min-h-[100px] resize-y"
                  placeholder="What is this project about?"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3 justify-end mt-6">
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
    </div>
  );
};

export default ProjectList;
