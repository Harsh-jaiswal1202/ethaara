import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const TaskModal = ({ task, projectId, members, onClose, onSave, isAdmin }) => {
  const { user } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'MEDIUM',
    status: 'TODO',
    assigneeIds: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAssignedToUser = task?.assignments?.some(a => a.userId === user.id);
  const canEditAll = isAdmin;
  const canEditStatusOnly = !isAdmin && isAssignedToUser;
  
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        priority: task.priority,
        status: task.status,
        assigneeIds: task.assignments?.map(a => a.userId) || []
      });
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (task) {
        // Edit existing task
        await api.patch(`/tasks/${task.id}`, formData);
      } else {
        // Create new task
        await api.post(`/projects/${projectId}/tasks`, formData);
      }
      onSave();
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors[0].message);
      } else {
        setError(err.response?.data?.message || 'Failed to save task');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAssigneeToggle = (userId) => {
    if (!canEditAll) return;
    
    setFormData(prev => {
      const isSelected = prev.assigneeIds.includes(userId);
      return {
        ...prev,
        assigneeIds: isSelected 
          ? prev.assigneeIds.filter(id => id !== userId)
          : [...prev.assigneeIds, userId]
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-card w-full max-w-xl rounded-2xl p-6 my-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">{task ? 'Task Details' : 'Create Task'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
            <input
              type="text"
              required
              disabled={!canEditAll && task}
              className={`input-field ${!canEditAll && task ? 'opacity-50 cursor-not-allowed' : ''}`}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
            <textarea
              className={`input-field min-h-[100px] resize-y ${!canEditAll && task ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!canEditAll && task}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Due Date</label>
              <input
                type="date"
                disabled={!canEditAll && task}
                className={`input-field ${!canEditAll && task ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
              <select
                disabled={!canEditAll && task}
                className={`input-field ${!canEditAll && task ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
            <select
              disabled={!canEditAll && !canEditStatusOnly && task}
              className={`input-field ${(!canEditAll && !canEditStatusOnly && task) ? 'opacity-50 cursor-not-allowed' : ''}`}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
            {(!canEditAll && !canEditStatusOnly && task) && (
              <p className="text-xs text-red-400 mt-1">You must be assigned to this task to update its status.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Assignees</label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <button
                  key={member.user.id}
                  type="button"
                  disabled={!canEditAll && task}
                  onClick={() => handleAssigneeToggle(member.user.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    formData.assigneeIds.includes(member.user.id)
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                  } ${(!canEditAll && task) ? 'opacity-50 cursor-not-allowed hover:bg-slate-800' : ''}`}
                >
                  {member.user.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-slate-700/50">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            {(canEditAll || (canEditStatusOnly && task)) && (
              <button type="submit" disabled={loading} className="btn-primary min-w-[100px] flex justify-center">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Save'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
