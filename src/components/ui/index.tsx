import type { ReactNode } from 'react';

export const PageHeader = ({ children }: { children: ReactNode }) =>
  <h1 className="text-2xl font-bold mb-4 text-slate-900">{children}</h1>;

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) =>
  <div className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>;

export const LoadingState = () =>
  <div className="flex items-center justify-center p-8 text-slate-500">Đang tải...</div>;

export const EmptyState = ({ message = 'Chưa có dữ liệu' }: { message?: string }) =>
  <div className="text-center text-slate-500 py-8">{message}</div>;

export const ErrorState = ({ message }: { message: string }) =>
  <div className="border border-rose-200 bg-rose-50 text-rose-700 rounded-lg p-3 text-sm">{message}</div>;

const BADGE_COLORS = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-100 text-emerald-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-rose-100 text-rose-800',
  indigo: 'bg-indigo-100 text-indigo-800',
} as const;

export const StatusBadge = ({ children, color = 'slate' }: {
  children: ReactNode;
  color?: keyof typeof BADGE_COLORS;
}) => <span className={`px-2 py-0.5 rounded text-xs ${BADGE_COLORS[color]}`}>{children}</span>;