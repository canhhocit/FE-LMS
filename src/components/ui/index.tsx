import { type ReactNode, type MouseEvent } from 'react';
import { X, AlertTriangle, Info, Inbox, Loader2 } from 'lucide-react';

/* ═══════════════════════════════════════════════════
   LearningHub Shared UI Primitives
   Design System: primary-600 navy, accent indigo,
   slate neutrals, standard radius & shadow scale.
   ═══════════════════════════════════════════════════ */

/* ── Page Header ── */
export const PageTitle = ({ children }: { children: ReactNode }) => (
  <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">
    {children}
  </h1>
);

export const PageHeader = ({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
}) => (
  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
    <div>
      <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
        {title}
      </h1>
      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

/* ── Card ── */
export const Card = ({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`rounded-xl border border-slate-200/80 bg-white p-5 shadow-card transition
      hover:shadow-card-hover dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100
      ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </div>
);

/* ── Stat Card ── */
export const StatCard = ({
  label,
  value,
  icon,
  trend,
  trendColor = 'slate',
  color = 'accent',
  className = '',
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: string;
  trendColor?: 'emerald' | 'amber' | 'rose' | 'slate';
  color?: 'accent' | 'emerald' | 'amber' | 'rose' | 'sky';
  className?: string;
}) => {
  const iconBg: Record<string, string> = {
    accent: 'bg-accent-50 text-accent-600 dark:bg-accent-950/40 dark:text-accent-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
  };

  const trendColors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };

  return (
    <Card className={`flex items-center justify-between ${className}`}>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
        {trend && (
          <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mt-2 ${trendColors[trendColor]}`}>
            {trend}
          </span>
        )}
      </div>
      {icon && (
        <div className={`p-3 rounded-xl shrink-0 ${iconBg[color]}`}>
          {icon}
        </div>
      )}
    </Card>
  );
};

/* ── Badge / Pill ── */
const BADGE_MAP = {
  slate:   'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  green:   'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  amber:   'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  red:     'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  rose:    'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  indigo:  'bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400',
  purple:  'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  sky:     'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warn:    'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  error:   'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
} as const;

export const Badge = ({
  children,
  color,
  intent,
  className = '',
}: {
  children: ReactNode;
  color?: keyof typeof BADGE_MAP;
  intent?: 'success' | 'warn' | 'error' | 'neutral';
  className?: string;
}) => {
  const resolvedColor = color ?? intent ?? 'slate';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${BADGE_MAP[resolvedColor] ?? BADGE_MAP.slate} ${className}`}>
      {children}
    </span>
  );
};

// Backward-compatible aliases
export const Pill = Badge;
export const StatusBadge = Badge;

/* ── Spinner ── */
export const Spinner = ({ className = '' }: { className?: string }) => (
  <div className={`flex h-32 items-center justify-center ${className}`}>
    <Loader2 className="h-6 w-6 animate-spin text-accent-600 dark:text-accent-400" />
  </div>
);

/* ── Skeleton ── */
export const Skeleton = ({
  className = 'h-4 w-full',
}: {
  className?: string;
}) => (
  <div className={`rounded-lg skeleton-shimmer ${className}`} />
);

export const SkeletonCard = () => (
  <Card>
    <Skeleton className="h-4 w-2/3 mb-3" />
    <Skeleton className="h-8 w-1/3 mb-2" />
    <Skeleton className="h-3 w-1/2" />
  </Card>
);

/* ── Empty State ── */
export const Empty = ({
  msg = 'Chưa có dữ liệu',
  icon,
  action,
}: {
  msg?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) => (
  <div className="rounded-xl border border-slate-200/80 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
    <div className="flex flex-col items-center gap-3">
      {icon || <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-600" />}
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{msg}</p>
      {action}
    </div>
  </div>
);

// Backward-compatible alias
export const EmptyState = Empty;

/* ── Error Box ── */
export const ErrorBox = ({
  msg,
  onRetry,
}: {
  msg: string;
  onRetry?: () => void;
}) => (
  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm dark:border-rose-900/60 dark:bg-rose-950/30">
    <div className="flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="font-medium text-rose-700 dark:text-rose-300">{msg}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
          >
            Thử lại
          </button>
        )}
      </div>
    </div>
  </div>
);

// Backward-compatible alias
export const ErrorState = ErrorBox;

/* ── Modal / Dialog ── */
export const Modal = ({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
}) => {
  if (!open) return null;

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
      onClick={handleBackdropClick}
    >
      <div className={`w-full ${maxWidth} rounded-2xl bg-white border border-slate-200 shadow-modal
        dark:bg-slate-900 dark:border-slate-800 max-h-[90vh] overflow-y-auto
        animate-in fade-in zoom-in-95 duration-150`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

/* ── Toast / Flash Message ── */
export const Toast = ({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
}) => {
  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/60 dark:text-emerald-300',
    error: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-900/60 dark:text-rose-300',
    info: 'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-950/30 dark:border-sky-900/60 dark:text-sky-300',
  };

  const icons = {
    success: <Loader2 className="w-4 h-4 text-emerald-600" />,
    error: <AlertTriangle className="w-4 h-4 text-rose-600" />,
    info: <Info className="w-4 h-4 text-sky-600" />,
  };

  return (
    <div className={`p-3.5 rounded-xl border text-sm font-medium flex items-center gap-2 ${styles[type]}`}>
      {icons[type]}
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="shrink-0 cursor-pointer opacity-60 hover:opacity-100">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

/* ── Button (standardized) ── */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  ...props
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) => {
  const variants = {
    primary: 'bg-accent-600 hover:bg-accent-500 text-white shadow-xs disabled:bg-accent-300',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700',
    ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs disabled:bg-rose-300',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-md',
    md: 'text-sm px-4 py-2 rounded-lg',
    lg: 'text-sm px-5 py-2.5 rounded-lg',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

/* ── Table Wrapper ── */
export const Table = ({
  headers,
  children,
  className = '',
}: {
  headers: string[];
  children: ReactNode;
  className?: string;
}) => (
  <div className={`overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 ${className}`}>
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-50 dark:bg-slate-800/60">
          {headers.map((h, i) => (
            <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
        {children}
      </tbody>
    </table>
  </div>
);