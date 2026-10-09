import { type ReactNode, type MouseEvent, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { X, AlertTriangle, Info, Inbox, Loader2, ChevronRight, Home, CheckCircle2 } from 'lucide-react';

/* ═══════════════════════════════════════════════════
   LearningHub Shared Design System Primitives
   Clean, modern, academic SaaS components
   ═══════════════════════════════════════════════════ */

/* ── Breadcrumbs ── */
export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export const Breadcrumbs = ({ items }: { items: BreadcrumbItem[] }) => (
  <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2.5">
    <a href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1">
      <Home className="w-3.5 h-3.5" />
      <span>Trang chủ</span>
    </a>
    {items.map((item, index) => (
      <span key={index} className="flex items-center gap-1.5">
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
        {item.to ? (
          <a href={item.to} className="hover:text-slate-900 dark:hover:text-white transition-colors">
            {item.label}
          </a>
        ) : (
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[220px]">
            {item.label}
          </span>
        )}
      </span>
    ))}
  </nav>
);

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
  breadcrumbs,
}: {
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}) => (
  <div className="mb-6">
    {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  </div>
);

/* ── Card ── */
export const Card = ({
  children,
  className = '',
  padding,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | string;
  onClick?: () => void;
}) => {
  const padClass = padding === 'none' ? 'p-0' : padding === 'sm' ? 'p-3' : padding === 'lg' ? 'p-6' : 'p-5';
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-slate-200/90 bg-white shadow-card transition-all duration-150
        hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-700
        ${onClick ? 'cursor-pointer hover:shadow-card-hover' : ''} ${padClass} ${className}`}
    >
      {children}
    </div>
  );
};

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
    accent: 'bg-accent-50 text-accent-600 dark:bg-accent-950/50 dark:text-accent-400 border border-accent-100 dark:border-accent-900/50',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50',
  };

  const trendColors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };

  return (
    <Card className={`flex items-center justify-between ${className}`}>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight">{value}</p>
        {trend && (
          <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md mt-2 ${trendColors[trendColor]}`}>
            {trend}
          </span>
        )}
      </div>
      {icon && (
        <div className={`p-2.5 rounded-lg shrink-0 ml-3 ${iconBg[color]}`}>
          {icon}
        </div>
      )}
    </Card>
  );
};

/* ── Badge / Pill ── */
const BADGE_MAP: Record<string, string> = {
  slate:   'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60',
  green:   'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60',
  amber:   'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60',
  red:     'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60',
  rose:    'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60',
  indigo:  'bg-accent-50 text-accent-700 dark:bg-accent-950/50 dark:text-accent-300 border border-accent-200/60 dark:border-accent-800/60',
  purple:  'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60',
  sky:     'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60',
  warn:    'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60',
  error:   'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60',
  danger:  'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60',
  info:    'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60',
  neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60',
};

export const Badge = ({
  children,
  color,
  intent,
  variant,
  className = '',
}: {
  children: ReactNode;
  color?: string;
  intent?: string;
  variant?: string;
  className?: string;
}) => {
  const key = variant || color || intent || 'slate';
  const style = BADGE_MAP[key] ?? BADGE_MAP.slate;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style} ${className}`}>
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
  message,
  icon,
  action,
}: {
  msg?: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) => {
  const displayText = message || msg || 'Chưa có dữ liệu';
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-3">
        {icon || <Inbox className="w-9 h-9 text-slate-300 dark:text-slate-600" />}
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-sm">{displayText}</p>
        {action}
      </div>
    </div>
  );
};

// Backward-compatible alias
export const EmptyState = Empty;

/* ── Error Box ── */
export const ErrorBox = ({
  msg,
  message,
  onRetry,
}: {
  msg?: string;
  message?: string;
  onRetry?: () => void;
}) => {
  const displayText = message || msg || 'Đã xảy ra lỗi khi tải dữ liệu';
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 text-xs dark:border-rose-900/60 dark:bg-rose-950/40">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-rose-800 dark:text-rose-300">{displayText}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:underline cursor-pointer"
            >
              Thử lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Backward-compatible alias
export const ErrorState = ErrorBox;

/* ── Modal / Dialog ── */
export const Modal = ({
  open,
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: {
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
}) => {
  const show = open ?? isOpen ?? false;
  if (!show) return null;

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4"
      onClick={handleBackdropClick}
    >
      <div className={`w-full ${maxWidth} rounded-2xl bg-white border border-slate-200/90 shadow-modal
        dark:bg-slate-900 dark:border-slate-800 max-h-[90vh] overflow-y-auto`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

/* ── Toast / Alert Banner ── */
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
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300',
    error: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300',
    info: 'bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-950/40 dark:border-sky-900/60 dark:text-sky-300',
  };

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    error: <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />,
  };

  return (
    <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2.5 ${styles[type]}`}>
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

/* ── Button (Standardized) ── */
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
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) => {
  const variants: Record<string, string> = {
    primary: 'bg-accent-600 hover:bg-accent-700 text-white shadow-xs disabled:bg-accent-300 dark:disabled:bg-accent-900/40',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs disabled:bg-rose-300 dark:disabled:bg-rose-900/40',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs disabled:bg-amber-300 dark:disabled:bg-amber-900/40',
    outline: 'bg-transparent border border-slate-200 hover:bg-slate-100 text-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-md font-medium',
    md: 'text-xs px-4 py-2 rounded-lg font-semibold',
    lg: 'text-sm px-5 py-2.5 rounded-lg font-semibold',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]
        ${variants[variant] ?? variants.primary} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
};

/* ── Form Control Inputs ── */
export const Input = ({
  label,
  error,
  helper,
  leftIcon,
  className = '',
  ...props
}: {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) => (
  <div className="space-y-1.5 w-full">
    {label && (
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>
    )}
    <div className="relative w-full">
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 shrink-0 pointer-events-none">
          {leftIcon}
        </div>
      )}
      <input
        className={`w-full py-2 rounded-lg text-xs bg-white dark:bg-slate-800 border text-slate-900 dark:text-white transition-colors
          outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-600 dark:focus:border-accent-500
          ${leftIcon ? 'pl-9 pr-3.5' : 'px-3.5'}
          ${error ? 'border-rose-300 dark:border-rose-800 focus:ring-rose-500/20' : 'border-slate-200/90 dark:border-slate-700'}
          ${className}`}
        {...props}
      />
    </div>
    {error && <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">{error}</p>}
    {helper && !error && <p className="text-[11px] text-slate-400 dark:text-slate-500">{helper}</p>}
  </div>
);

export const Select = ({
  label,
  error,
  options,
  children,
  className = '',
  ...props
}: {
  label?: string;
  error?: string;
  options?: Array<{ label: string; value: string | number }>;
  children?: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="space-y-1.5 w-full">
    {label && (
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>
    )}
    <select
      className={`w-full px-3.5 py-2 rounded-lg text-xs bg-white dark:bg-slate-800 border text-slate-900 dark:text-white transition-colors
        outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-600 dark:focus:border-accent-500 cursor-pointer
        ${error ? 'border-rose-300 dark:border-rose-800 focus:ring-rose-500/20' : 'border-slate-200/90 dark:border-slate-700'}
        ${className}`}
      {...props}
    >
      {options
        ? options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))
        : children}
    </select>
    {error && <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">{error}</p>}
  </div>
);

export const Textarea = ({
  label,
  error,
  className = '',
  ...props
}: {
  label?: string;
  error?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <div className="space-y-1.5 w-full">
    {label && (
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>
    )}
    <textarea
      className={`w-full px-3.5 py-2.5 rounded-lg text-xs bg-white dark:bg-slate-800 border text-slate-900 dark:text-white transition-colors
        outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-600 dark:focus:border-accent-500
        ${error ? 'border-rose-300 dark:border-rose-800 focus:ring-rose-500/20' : 'border-slate-200/90 dark:border-slate-700'}
        ${className}`}
      {...props}
    />
    {error && <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400">{error}</p>}
  </div>
);

/* ── Table Wrapper ── */
export const Table = ({
  headers,
  children,
  className = '',
}: {
  headers: ReactNode[];
  children: ReactNode;
  className?: string;
}) => (
  <div className={`overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 ${className}`}>
    <table className="w-full text-xs">
      <thead>
        <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800">
          {headers.map((h, i) => (
            <th key={i} className="px-4 py-3 text-left font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[11px]">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {children}
      </tbody>
    </table>
  </div>
);

/* ── Tabs Navigation ── */
export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

export const Tabs = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}: {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}) => (
  <div className={`flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 ${className}`}>
    {tabs.map((t) => {
      const active = t.id === activeTab;
      return (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            active
              ? 'border-accent-600 text-accent-600 dark:border-accent-500 dark:text-accent-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {t.icon}
          <span>{t.label}</span>
          {typeof t.count === 'number' && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              active
                ? 'bg-accent-100 text-accent-700 dark:bg-accent-950 dark:text-accent-300'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            }`}>
              {t.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);