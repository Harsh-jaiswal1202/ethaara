import React from 'react';

const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white bg-${color}-500/20 text-${color}-400 shadow-lg shadow-${color}-500/20`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
