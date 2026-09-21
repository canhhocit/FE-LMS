import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCheck } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import * as notificationService from '../../services/notificationService';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import type { Notification } from '../../types';

const fmt = (s: string) => new Date(s).toLocaleString('vi-VN');

const getNotificationTarget = (type: Notification['type']) => {
  switch (type) {
    case 'NEW_ASSIGNMENT':
      return '/student/assignments';
    case 'NEW_GRADE':
    case 'ACADEMIC_WARNING':
      return '/student/grades';
    case 'NEW_ANNOUNCEMENT':
      return '/student/notifications';
    case 'REGISTRATION_OPEN' as Notification['type']:
      return '/student/registration';
    default:
      return null;
  }
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    notificationService.getNotifications()
      .then((data) => {
        if (mounted) setItems(data);
      })
      .catch((e: unknown) => {
        if (mounted) setErr((e as { message?: string })?.message ?? 'Không tải được thông báo');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const onMarkRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không thể đánh dấu thông báo đã đọc');
    }
  };

  const onMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không thể đánh dấu tất cả thông báo đã đọc');
    }
  };

  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;

  const hasUnread = items.some((n) => !n.isRead);

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <PageTitle>Thông báo</PageTitle>
          <div className="text-sm text-slate-600 dark:text-slate-400">Xin chào, {user?.fullName}</div>
        </div>
        {hasUnread && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1.5 self-start sm:self-auto bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Đánh dấu tất cả là đã đọc
          </button>
        )}
      </div>
      {items.length === 0 ? <Empty msg="Chưa có thông báo nào" /> : (
        <div className="space-y-3">
          {items.map((n) => {
            const target = getNotificationTarget(n.type);
            return (
              <Card
                key={n.id}
                className={`transition cursor-pointer ${
                  n.isRead ? 'border-slate-200 bg-white' : 'border-indigo-200 bg-indigo-50/60 hover:bg-indigo-50'
                }`}
                onClick={() => {
                  if (!n.isRead) void onMarkRead(n.id);
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{n.title}</span>
                      {!n.isRead && <Pill color="indigo">Mới</Pill>}
                    </div>
                    <div className="text-sm text-slate-600">{n.content}</div>
                    <div className="mt-2 text-xs text-slate-500">{fmt(n.createdAt)}</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {target && (
                      <Link
                        to={target}
                        onClick={() => {
                          if (!n.isRead) void onMarkRead(n.id);
                        }}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 cursor-pointer"
                      >
                        Xem chi tiết
                      </Link>
                    )}
                    {!n.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void onMarkRead(n.id);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 cursor-pointer"
                      >
                        Đánh dấu đọc
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
