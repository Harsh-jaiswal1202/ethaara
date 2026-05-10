import React, { useState, useEffect } from 'react';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';
import { PlusIcon } from '@heroicons/react/24/outline';
import api from '../api/axios';

const TaskBoard = ({ project, refreshProject, isAdmin }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get(`/projects/${project.id}/tasks`);
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [project.id]);

  const openCreateModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const onTaskSaved = () => {
    fetchTasks();
    refreshProject();
    closeModal();
  };

  const columns = [
    { id: 'TODO', title: 'To Do', color: 'slate' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'blue' },
    { id: 'DONE', title: 'Done', color: 'emerald' }
  ];

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary-500"></div></div>;
  }

  return (
    <div className="h-full flex flex-col">
      {isAdmin && (
        <div className="flex justify-end mb-4 shrink-0">
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2 text-sm py-2">
            <PlusIcon className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      )}

      <div className="flex gap-6 overflow-x-auto pb-4 h-full">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="flex-1 min-w-[320px] max-w-[400px] flex flex-col bg-slate-800/40 rounded-2xl border border-slate-700/50 p-4 h-full">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-${col.color}-500 shadow-lg shadow-${col.color}-500/50`}></div>
                  <h3 className="font-semibold text-white">{col.title}</h3>
                </div>
                <span className="bg-slate-700/50 text-slate-300 text-xs px-2.5 py-1 rounded-full font-medium">
                  {colTasks.length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 pb-2 custom-scrollbar">
                {colTasks.length === 0 ? (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-700/50 rounded-xl text-slate-500 text-sm">
                    No tasks
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onClick={() => openEditModal(task)}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <TaskModal 
          task={editingTask} 
          projectId={project.id}
          members={project.members}
          onClose={closeModal} 
          onSave={onTaskSaved}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};

export default TaskBoard;
