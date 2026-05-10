import React from 'react';
import { CalendarIcon } from '@heroicons/react/24/outline';

const priorityColors = {
  HIGH: 'bg-red-500/20 text-red-400 border-red-500/30',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  LOW: 'bg-green-500/20 text-green-400 border-green-500/30'
};

const TaskCard = ({ task, onClick }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div 
      onClick={onClick}
      className="glass-card p-4 rounded-xl cursor-pointer hover:border-primary-500/50 group"
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border uppercase ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        
        {task.dueDate && (
          <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400 font-medium' : 'text-slate-400'}`}>
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>
      
      <h4 className="text-sm font-semibold text-white mb-3 group-hover:text-primary-400 transition-colors leading-snug">
        {task.title}
      </h4>

      {task.assignments?.length > 0 && (
        <div className="flex -space-x-2 overflow-hidden mt-auto pt-2 border-t border-slate-700/30">
          {task.assignments.map((assignment) => (
            <div 
              key={assignment.userId} 
              className="inline-block h-6 w-6 rounded-full bg-slate-700 border-2 border-slate-800 text-[10px] font-bold text-white flex items-center justify-center"
              title={assignment.user.name}
            >
              {assignment.user.name.substring(0, 2).toUpperCase()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
