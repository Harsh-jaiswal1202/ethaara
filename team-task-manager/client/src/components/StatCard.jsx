const colorStyles = {
  primary: {
    card: 'from-blue-500/10 to-transparent',
    icon: 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20 shadow-blue-500/10',
  },
  slate: {
    card: 'from-slate-500/10 to-transparent',
    icon: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20 shadow-slate-500/10',
  },
  blue: {
    card: 'from-sky-500/10 to-transparent',
    icon: 'bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/20 shadow-sky-500/10',
  },
  emerald: {
    card: 'from-emerald-500/10 to-transparent',
    icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20 shadow-emerald-500/10',
  },
  red: {
    card: 'from-red-500/10 to-transparent',
    icon: 'bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/20 shadow-red-500/10',
  },
};

const StatCard = ({ title, value, icon, color = 'primary', helper }) => {
  const styles = colorStyles[color] || colorStyles.primary;

  return (
    <div className={`glass-card rounded-lg p-5 flex items-center gap-4 bg-gradient-to-br ${styles.card}`}>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center border shadow-lg ${styles.icon}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-muted text-sm font-bold uppercase tracking-tight">{title}</p>
        <p className="text-3xl font-black leading-tight">{value}</p>
        {helper && <p className="text-muted text-xs mt-1">{helper}</p>}
      </div>
    </div>
  );
};

export default StatCard;
