import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { 
  ClipboardDocumentCheckIcon, 
  ExclamationCircleIcon, 
  CheckCircleIcon,
  ClockIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get(`/projects/${id}/dashboard`);
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-500"></div></div>;
  }

  if (!data) return null;

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link to={`/projects/${id}`} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 text-slate-300 transition-colors">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Project Dashboard</h1>
          <p className="text-slate-400">Overview and analytics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Tasks" 
          value={data.totalTasks} 
          icon={<ClipboardDocumentCheckIcon className="w-6 h-6" />}
          color="primary"
        />
        <StatCard 
          title="To Do" 
          value={data.byStatus.TODO} 
          icon={<ClockIcon className="w-6 h-6" />}
          color="slate"
        />
        <StatCard 
          title="In Progress" 
          value={data.byStatus.IN_PROGRESS} 
          icon={<ArrowLeftIcon className="w-6 h-6 transform rotate-45" />} // Fallback icon
          color="blue"
        />
        <StatCard 
          title="Done" 
          value={data.byStatus.DONE} 
          icon={<CheckCircleIcon className="w-6 h-6" />}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Tasks by Assigned User</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.tasksByUser} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip 
                  cursor={{ fill: '#334155', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="glass-card rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Overdue Tasks</h3>
            <span className="bg-red-500/20 text-red-400 text-xs px-2.5 py-1 rounded-full font-bold">
              {data.overdueTasks.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 max-h-[300px]">
            {data.overdueTasks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <CheckCircleIcon className="w-12 h-12 mx-auto text-emerald-500/50 mb-2" />
                  <p>No overdue tasks!</p>
                </div>
              </div>
            ) : (
              data.overdueTasks.map((task) => (
                <div key={task.id} className="p-3 bg-slate-800/50 rounded-xl border border-red-500/30">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-white text-sm">{task.title}</h4>
                    <ExclamationCircleIcon className="w-5 h-5 text-red-400 shrink-0" />
                  </div>
                  <div className="text-xs text-red-400/80">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
