import React, { useState } from 'react';
import api from '../api/axios';

const MemberList = ({ project, refreshProject, isAdmin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post(`/projects/${project.id}/members`, { email });
      setSuccess('Member added successfully!');
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

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    
    try {
      await api.delete(`/projects/${project.id}/members/${userId}`);
      refreshProject();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      {isAdmin && (
        <div className="mb-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Member</h3>
          
          {error && <div className="text-red-400 text-sm mb-3 bg-red-500/10 p-3 rounded-lg">{error}</div>}
          {success && <div className="text-green-400 text-sm mb-3 bg-green-500/10 p-3 rounded-lg">{success}</div>}
          
          <form onSubmit={handleAddMember} className="flex gap-4">
            <input
              type="email"
              required
              placeholder="Enter member's email address"
              className="input-field flex-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </form>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Project Members</h3>
        <div className="space-y-3">
          {project.members.map((member) => (
            <div key={member.userId} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold shadow-lg">
                  {member.user.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-white">{member.user.name}</h4>
                  <p className="text-sm text-slate-400">{member.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${member.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-700/50 text-slate-300 border-slate-600'}`}>
                  {member.role}
                </span>
                
                {isAdmin && member.role !== 'ADMIN' && (
                  <button 
                    onClick={() => handleRemoveMember(member.userId)}
                    className="text-slate-500 hover:text-red-400 p-2 transition-colors"
                    title="Remove member"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MemberList;
