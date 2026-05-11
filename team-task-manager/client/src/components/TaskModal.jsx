import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { labelColorClass, labelSolidClass } from '../utils/uiStyles';
import ConfirmModal from './ConfirmModal';

const TaskModal = ({ task, projectId, members, labels, onClose, onSave, isAdmin }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'MEDIUM',
    status: 'TODO',
    assigneeIds: [],
    labelIds: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  
  const [newComment, setNewComment] = useState('');

  const isAssignedToUser = task?.assignments?.some(a => a.userId === user.id);
  const canEditAll = isAdmin;
  const canEditStatusOnly = !isAdmin && isAssignedToUser;
  
  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect warning
    const timer = setTimeout(() => {
      if (task) {
        setFormData({
          title: task.title,
          description: task.description || '',
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
          priority: task.priority,
          status: task.status,
          assigneeIds: task.assignments?.map(a => a.userId) || [],
          labelIds: task.labels?.map(l => l.labelId) || []
        });
        setSubtasks(task.subtasks || []);
      } else {
        setFormData({
          title: '',
          description: '',
          dueDate: '',
          priority: 'MEDIUM',
          status: 'TODO',
          assigneeIds: [],
          labelIds: []
        });
        setSubtasks([]);
      }
    }, 0);

    return () => clearTimeout(timer);
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
        // Create new task with subtasks
        const createData = {
          ...formData,
          subtasks: subtasks.map(st => st.title)
        };
        await api.post(`/tasks/projects/${projectId}/tasks`, createData);
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

  const handleLabelToggle = (labelId) => {
    if (!canEditAll) return;
    
    setFormData(prev => {
      const isSelected = prev.labelIds.includes(labelId);
      return {
        ...prev,
        labelIds: isSelected 
          ? prev.labelIds.filter(id => id !== labelId)
          : [...prev.labelIds, labelId]
      };
    });
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !canEditAll) return;
    
    if (task) {
      try {
        const { data } = await api.post(`/tasks/${task.id}/subtasks`, { title: newSubtaskTitle });
        setSubtasks(prev => [...prev, data]);
        setNewSubtaskTitle('');
      } catch (err) {
        console.error(err);
      }
    } else {
      setSubtasks(prev => [...prev, { title: newSubtaskTitle, isCompleted: false }]);
      setNewSubtaskTitle('');
    }
  };

  const handleSubtaskToggle = async (subtask, index) => {
    if (task) {
      try {
        const { data } = await api.patch(`/tasks/${task.id}/subtasks/${subtask.id}`, { isCompleted: !subtask.isCompleted });
        setSubtasks(prev => prev.map(st => st.id === subtask.id ? data : st));
      } catch (err) {
        console.error(err);
      }
    } else {
      setSubtasks(prev => prev.map((st, i) => i === index ? { ...st, isCompleted: !st.isCompleted } : st));
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (task) {
      try {
        await api.delete(`/tasks/${task.id}/subtasks/${subtaskId}`);
        setSubtasks(prev => prev.filter(st => st.id !== subtaskId));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !task) return;
    try {
      await api.post(`/tasks/${task.id}/comments`, { content: newComment });
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadAttachment = async (e) => {
    const file = e.target.files[0];
    if (!file || !task) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      await api.post(`/tasks/${task.id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (err) {
      console.error(err);
      setError('Failed to upload attachment.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!task) return;
    try {
      await api.delete(`/tasks/${task.id}/attachments/${attachmentId}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = () => {
    if (!task || !isAdmin) return;
    setIsConfirmOpen(true);
  };

  const confirmDeleteTask = async () => {
    try {
      setLoading(true);
      await api.delete(`/tasks/${task.id}`);
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete task.');
      setLoading(false);
      setIsConfirmOpen(false);
    }
  };

  // Combine and sort comments and activities
  const timeline = [];
  if (task) {
    if (task.comments) {
      timeline.push(...task.comments.map(c => ({ ...c, type: 'comment' })));
    }
    if (task.activities) {
      timeline.push(...task.activities.map(a => ({ ...a, type: 'activity' })));
    }
    timeline.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="glass-card w-full max-w-2xl rounded-2xl p-6 shadow-2xl my-auto">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h3 className="text-xl font-bold">{task ? 'Task Details' : 'Create Task'}</h3>
          <button onClick={onClose} className="text-muted hover:text-main transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-4 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1">Title</label>
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
            <label className="block text-sm font-medium text-muted mb-1">Description</label>
            <textarea
              className={`input-field min-h-[100px] resize-y ${!canEditAll && task ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!canEditAll && task}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Due Date</label>
              <input
                type="date"
                disabled={!canEditAll && task}
                className={`input-field ${!canEditAll && task ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Priority</label>
              <select
                disabled={!canEditAll && task}
                className={`input-field ${!canEditAll && task ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="LOW" className="dark:bg-slate-900">Low</option>
                <option value="MEDIUM" className="dark:bg-slate-900">Medium</option>
                <option value="HIGH" className="dark:bg-slate-900">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1">Status</label>
            <select
              disabled={!canEditAll && !canEditStatusOnly && task}
              className={`input-field ${(!canEditAll && !canEditStatusOnly && task) ? 'opacity-50 cursor-not-allowed' : ''}`}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="TODO" className="dark:bg-slate-900">To Do</option>
              <option value="IN_PROGRESS" className="dark:bg-slate-900">In Progress</option>
              <option value="DONE" className="dark:bg-slate-900">Done</option>
            </select>
            {(!canEditAll && !canEditStatusOnly && task) && (
              <p className="text-xs text-red-500 mt-1 font-medium">You must be assigned to this task to update its status.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">Assignees</label>
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
                      : 'bg-slate-100 dark:bg-slate-800 text-muted border border-main hover:bg-slate-200 dark:hover:bg-slate-700'
                  } ${(!canEditAll && task) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {member.user.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-2">Labels</label>
            <div className="flex flex-wrap gap-2">
              {labels.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  disabled={!canEditAll && task}
                  onClick={() => handleLabelToggle(label.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    formData.labelIds.includes(label.id)
                      ? `${labelSolidClass(label.color)} shadow-lg`
                      : `${labelColorClass(label.color)} hover:opacity-80`
                  } ${(!canEditAll && task) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {label.name}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <label className="block text-sm font-medium text-muted mb-2">Checklist</label>
            <div className="space-y-2 mb-3">
              {subtasks.map((subtask, index) => (
                <div key={subtask.id || index} className="flex items-center gap-3 p-2 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-main">
                  <input
                    type="checkbox"
                    checked={subtask.isCompleted}
                    onChange={() => handleSubtaskToggle(subtask, index)}
                    disabled={!canEditAll && !canEditStatusOnly && task}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-primary-500 focus:ring-primary-500"
                  />
                  <span className={`text-sm flex-1 ${subtask.isCompleted ? 'text-slate-400 line-through' : 'text-main'}`}>
                    {subtask.title}
                  </span>
                  {canEditAll && task && subtask.id && (
                    <button 
                      type="button"
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="text-muted hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                  {canEditAll && !task && (
                    <button 
                      type="button"
                      onClick={() => {
                        setSubtasks(prev => prev.filter((_, i) => i !== index));
                      }}
                      className="text-muted hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {canEditAll && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a subtask..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  className="input-field text-sm py-1.5"
                />
                <button 
                  type="button" 
                  onClick={handleAddSubtask}
                  className="btn-secondary px-3 py-1.5 text-sm whitespace-nowrap"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Attachments */}
          {task && (
            <div className="pt-6 border-t border-main mt-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-muted">Attachments</label>
                <div className="relative">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleUploadAttachment}
                  />
                  <label
                    htmlFor="file-upload"
                    className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Upload
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                {task.attachments && task.attachments.length > 0 ? (
                  task.attachments.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800/40 rounded-lg border border-main group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded text-primary-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm text-main truncate font-medium">{file.fileName}</p>
                          <p className="text-[10px] text-muted uppercase font-bold">{file.fileType.split('/')[1] || 'FILE'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`${import.meta.env.VITE_API_URL}${file.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-muted hover:text-primary-500 transition-colors"
                          title="Download"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                        {(isAdmin || file.userId === user.id) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteAttachment(file.id)}
                            className="p-1.5 text-muted hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted italic">No files attached yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Activity & Comments Timeline */}
          {task && (
            <div className="pt-6 border-t border-main mt-6">
              <label className="block text-sm font-medium text-muted mb-4">Activity & Comments</label>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mb-4">
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted italic">No activity yet.</p>
                ) : (
                  timeline.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-main text-xs font-bold">
                        {item.user?.name?.substring(0, 2).toUpperCase() || '??'}
                      </div>
                      <div className="flex-1 bg-slate-50 dark:bg-slate-800/40 rounded-lg p-3 border border-main">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-main">{item.user?.name}</span>
                          <span className="text-[10px] text-muted font-medium">
                            {new Date(item.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {item.type === 'comment' ? (
                          <p className="text-sm text-main">{item.content}</p>
                        ) : (
                          <p className="text-sm text-muted italic">{item.action}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  className="input-field text-sm"
                />
                <button 
                  type="button" 
                  onClick={handleAddComment}
                  className="btn-primary px-4"
                >
                  Post
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-6 border-t border-main">
            <div>
              {task && isAdmin && (
                <button
                  type="button"
                  onClick={handleDeleteTask}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 font-bold text-red-700 dark:text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-60"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete Task</span>
                </button>
              )}
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={onClose} className="btn-secondary">
                Close
              </button>
              <button type="submit" disabled={loading} className="btn-primary min-w-[100px]">
                {loading ? 'Saving...' : 'Save Task'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Delete Task?"
        message={`Are you sure you want to delete "${task?.title}"? This task and its comments, checklist, labels, and attachments will be permanently removed.`}
        confirmText="Delete Task"
        onConfirm={confirmDeleteTask}
        onCancel={() => setIsConfirmOpen(false)}
        isLoading={loading}
        isDanger={true}
      />
    </div>
  );
};

export default TaskModal;
