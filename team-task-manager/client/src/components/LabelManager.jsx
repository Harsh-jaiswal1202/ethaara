import { useState } from 'react';
import api from '../api/axios';
import { TagIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { colorDotClass, labelColorClass } from '../utils/uiStyles';
import ConfirmModal from './ConfirmModal';

const labelColors = [
  { id: 'slate', name: 'Gray' },
  { id: 'red', name: 'Red' },
  { id: 'orange', name: 'Orange' },
  { id: 'yellow', name: 'Yellow' },
  { id: 'green', name: 'Green' },
  { id: 'emerald', name: 'Emerald' },
  { id: 'blue', name: 'Blue' },
  { id: 'indigo', name: 'Indigo' },
  { id: 'purple', name: 'Purple' },
  { id: 'pink', name: 'Pink' }
];

const LabelManager = ({ projectId, labels, fetchLabels, onClose, isAdmin }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('slate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    labelId: null,
    loading: false
  });

  const handleCreateLabel = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await api.post(`/labels/projects/${projectId}/labels`, { name, color });
      setName('');
      fetchLabels();
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors[0].message);
      } else {
        setError(err.response?.data?.message || 'Failed to create label.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLabel = (labelId) => {
    setConfirmModal({
      isOpen: true,
      labelId,
      loading: false
    });
  };

  const confirmDeleteLabel = async () => {
    const { labelId } = confirmModal;
    setConfirmModal(prev => ({ ...prev, loading: true }));
    try {
      await api.delete(`/labels/${labelId}`);
      setConfirmModal({ isOpen: false, labelId: null, loading: false });
      fetchLabels();
    } catch (err) {
      console.error(err);
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <TagIcon className="w-6 h-6 text-primary-500" />
            Manage Labels
          </h3>
          <button onClick={onClose} className="text-muted hover:text-main transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {error && <div className="text-red-600 dark:text-red-400 text-sm mb-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20 font-medium">{error}</div>}

        {isAdmin && (
          <form onSubmit={handleCreateLabel} className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-main">
            <h4 className="text-sm font-bold mb-3">Create New Label</h4>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Label Name"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={30}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-2">Select Color</label>
                <div className="flex flex-wrap gap-2">
                  {labelColors.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      className={`w-7 h-7 rounded-full cursor-pointer transition-all border border-black/10 dark:border-white/10 ${c.id === color ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-bg-surface scale-110' : 'hover:scale-110 opacity-75'} ${colorDotClass(c.id)}`}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={loading} className="btn-primary text-sm py-1.5 px-4">
                  {loading ? 'Adding...' : 'Add Label'}
                </button>
              </div>
            </div>
          </form>
        )}

        <div>
          <h4 className="text-sm font-bold mb-3">Existing Labels ({labels.length})</h4>
          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {labels.length === 0 ? (
              <p className="text-muted text-sm italic">No labels created yet.</p>
            ) : (
              labels.map((label) => (
                <div key={label.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-main">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase ${labelColorClass(label.color)}`}>
                    {label.name}
                  </span>
                  {isAdmin && (
                    <button onClick={() => handleDeleteLabel(label.id)} className="text-muted hover:text-red-500 transition-colors p-1">
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Label?"
        message="Are you sure you want to delete this label? It will be permanently removed from all tasks that currently use it."
        confirmText="Delete Label"
        onConfirm={confirmDeleteLabel}
        onCancel={() => setConfirmModal({ isOpen: false, labelId: null, loading: false })}
        isLoading={confirmModal.loading}
        isDanger={true}
      />
    </div>
  );
};

export default LabelManager;
