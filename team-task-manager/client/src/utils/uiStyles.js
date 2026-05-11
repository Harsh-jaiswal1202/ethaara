export const roleBadgeClass = (role) => (
  role === 'ADMIN'
    ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20'
    : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20'
);

export const priorityBadgeClass = (priority) => {
  const styles = {
    HIGH: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20',
    MEDIUM: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
    LOW: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  };

  return styles[priority] || styles.MEDIUM;
};

export const labelColorClass = (color) => {
  const styles = {
    slate: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
    red: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20',
    orange: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/20',
    green: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
    purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
    pink: 'bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20',
  };

  return styles[color] || styles.slate;
};

export const labelSolidClass = (color) => {
  const styles = {
    slate: 'bg-slate-600 text-white border-transparent shadow-slate-500/30',
    red: 'bg-red-600 text-white border-transparent shadow-red-500/30',
    orange: 'bg-orange-600 text-white border-transparent shadow-orange-500/30',
    yellow: 'bg-yellow-500 text-slate-950 border-transparent shadow-yellow-500/30',
    green: 'bg-green-600 text-white border-transparent shadow-green-500/30',
    emerald: 'bg-emerald-600 text-white border-transparent shadow-emerald-500/30',
    blue: 'bg-blue-600 text-white border-transparent shadow-blue-500/30',
    indigo: 'bg-indigo-600 text-white border-transparent shadow-indigo-500/30',
    purple: 'bg-purple-600 text-white border-transparent shadow-purple-500/30',
    pink: 'bg-pink-600 text-white border-transparent shadow-pink-500/30',
  };

  return styles[color] || styles.slate;
};

export const colorDotClass = (color) => {
  const styles = {
    slate: 'bg-slate-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
  };

  return styles[color] || styles.slate;
};

export const columnStyle = (status) => {
  const styles = {
    TODO: {
      dot: 'bg-slate-500 shadow-slate-500/40',
      header: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
    },
    IN_PROGRESS: {
      dot: 'bg-blue-500 shadow-blue-500/40',
      header: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
    },
    DONE: {
      dot: 'bg-emerald-500 shadow-emerald-500/40',
      header: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    },
  };

  return styles[status] || styles.TODO;
};
