import { useState } from 'react';
import api from '../api/axios';
import { EnvelopeIcon, TrashIcon, UserPlusIcon, UsersIcon } from '@heroicons/react/24/outline';
import { roleBadgeClass } from '../utils/uiStyles';
import ConfirmModal from './ConfirmModal';

const MemberList = ({ project, refreshProject, isAdmin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    userId: null,
    loading: false
  });

  const handleAddMember = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post(`/projects/${project.id}/members`, { email });
      setSuccess('Member added successfully.');
      setEmail('');
      refreshProject();
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors[0].message);
      } else {
        setError(err.response?.data?.message || 'Failed to add member.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = (userId) => {
    setConfirmModal({
      isOpen: true,
      userId,
      loading: false
    });
  };

  const confirmRemoveMember = async () => {
    const { userId } = confirmModal;
    setConfirmModal(prev => ({ ...prev, loading: true }));
    try {
      await api.delete(`/projects/${project.id}/members/${userId}`);
      setConfirmModal({ isOpen: false, userId: null, loading: false });
      refreshProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member.');
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-5">
      {isAdmin && (
        <div className="glass-card rounded-lg p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="text-xl font-black flex items-center gap-2">
                <UserPlusIcon className="w-6 h-6 text-primary-600 dark:text-primary-300" />
                Add New Member
              </h3>
              <p className="text-muted text-sm mt-1">Invite an existing user by email to collaborate on this project.</p>
            </div>
          </div>

          {error && <div className="text-red-700 dark:text-red-300 text-sm mb-3 bg-red-500/10 border border-red-500/20 p-3 rounded-lg font-medium">{error}</div>}
          {success && <div className="text-emerald-700 dark:text-emerald-300 text-sm mb-3 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg font-medium">{success}</div>}

          <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <EnvelopeIcon className="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="member@example.com"
                className="input-field input-icon-left h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap min-h-12">
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </form>
        </div>
      )}

      <div className="glass-card rounded-lg p-5 md:p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-xl font-black flex items-center gap-2">
              <UsersIcon className="w-6 h-6 text-primary-600 dark:text-primary-300" />
              Project Members
            </h3>
            <p className="text-muted text-sm mt-1">{project.members.length} people have access to this workspace.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {project.members.map((member) => (
            <div key={member.userId} className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-lg border border-main hover:border-primary-500/40 transition-colors">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-lg bg-primary-600 flex items-center justify-center text-white font-black shadow-lg shadow-primary-500/20 shrink-0">
                  {member.user.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="font-black truncate">{member.user.name}</h4>
                  <p className="text-sm text-muted truncate">{member.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border uppercase ${roleBadgeClass(member.role)}`}>
                  {member.role}
                </span>

                {isAdmin && member.role !== 'ADMIN' && (
                  <button
                    onClick={() => handleRemoveMember(member.userId)}
                    className="text-muted hover:text-red-600 dark:hover:text-red-300 p-2 transition-colors rounded-lg hover:bg-red-500/10"
                    title="Remove member"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Remove Member?"
        message="Are you sure you want to remove this member from the project? They will lose access to all tasks and workspace activity."
        confirmText="Remove Member"
        onConfirm={confirmRemoveMember}
        onCancel={() => setConfirmModal({ isOpen: false, userId: null, loading: false })}
        isLoading={confirmModal.loading}
        isDanger={true}
      />
    </div>
  );
};

export default MemberList;
