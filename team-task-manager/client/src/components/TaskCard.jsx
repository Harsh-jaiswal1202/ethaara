import { CalendarIcon } from '@heroicons/react/24/outline';
import { labelColorClass, priorityBadgeClass } from '../utils/uiStyles';

const TaskCard = ({ task, onClick }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div 
      onClick={onClick}
      className="glass-card p-4 rounded-lg cursor-pointer hover:border-primary-500/50 hover:shadow-primary-500/10 group bg-white dark:bg-slate-900/70"
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full border uppercase ${priorityBadgeClass(task.priority)}`}>
          {task.priority}
        </span>
        
        <div className="flex items-center gap-3">
          {task.subtasks && task.subtasks.length > 0 && (
            <div className={`flex items-center gap-1 text-[10px] font-bold ${
              task.subtasks.every(st => st.isCompleted) ? 'text-emerald-500' : 'text-muted'
            }`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>{task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length}</span>
            </div>
          )}

          {task.comments && task.comments.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-muted">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{task.comments.length}</span>
            </div>
          )}

          {task.attachments && task.attachments.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-muted">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span>{task.attachments.length}</span>
            </div>
          )}

          {task.dueDate && (
            <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500 font-bold' : 'text-muted'}`}>
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>

      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map(l => (
            <span key={l.labelId} className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${labelColorClass(l.label.color)}`}>
              {l.label.name}
            </span>
          ))}
        </div>
      )}
      
      <h4 className="text-sm font-semibold mb-3 group-hover:text-primary-500 transition-colors leading-snug">
        {task.title}
      </h4>

      {task.assignments?.length > 0 && (
        <div className="flex -space-x-2 overflow-hidden mt-auto pt-2 border-t border-main">
          {task.assignments.map((assignment) => (
            <div 
              key={assignment.userId} 
              className="inline-flex h-7 w-7 rounded-full bg-primary-600 border-2 border-bg-surface text-[10px] font-bold text-white items-center justify-center shadow-sm"
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
