import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import TaskBoard from '../components/TaskBoard';
import MemberList from '../components/MemberList';
import { ChartBarIcon, ClipboardDocumentListIcon, UsersIcon } from '@heroicons/react/24/outline';

const ProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/projects/${id}`);
      setProject(data);
    } catch (error) {
      console.error('Failed to fetch project', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500"></div></div>;
  }

  if (!project) {
    return <div className="text-center py-12 text-slate-400">Project not found</div>;
  }

  const isAdmin = project.userRole === 'ADMIN';

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">{project.name}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${isAdmin ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-700/50 text-slate-300 border-slate-600'}`}>
              {project.userRole}
            </span>
          </div>
          {project.description && (
            <p className="text-slate-400 max-w-3xl">{project.description}</p>
          )}
        </div>
        <Link 
          to={`/projects/${id}/dashboard`}
          className="btn-secondary flex items-center gap-2 whitespace-nowrap"
        >
          <ChartBarIcon className="w-5 h-5" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl w-fit mb-6 shrink-0 border border-slate-700/50">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'tasks' 
              ? 'bg-primary-600 text-white shadow-lg' 
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <ClipboardDocumentListIcon className="w-4 h-4" />
          <span>Tasks</span>
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'members' 
              ? 'bg-primary-600 text-white shadow-lg' 
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <UsersIcon className="w-4 h-4" />
          <span>Members ({project.members.length})</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0">
        {activeTab === 'tasks' ? (
          <TaskBoard project={project} refreshProject={fetchProject} isAdmin={isAdmin} />
        ) : (
          <MemberList project={project} refreshProject={fetchProject} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
