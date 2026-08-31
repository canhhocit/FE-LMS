import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
    default:
      return '/student';
  }
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await notificationService.getNotifications();
      setItems(data);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không tải được thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onMarkRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không thể đánh dấu thông báo đã đọc');
    }
  };

  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;

  return (
    <div>
      <PageTitle>Thông báo</PageTitle>
      <div className="mb-4 text-sm text-slate-600">Xin chào, {user?.fullName}</div>
      {items.length === 0 ? <Empty msg="Chưa có thông báo nào" /> : (
        <div className="space-y-3">
          {items.map((n) => {
            const target = getNotificationTarget(n.type);
            return (
              <Card key={n.id} className={n.isRead ? 'border-slate-200 bg-white' : 'border-indigo-200 bg-indigo-50/50'}>
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
                    <Link to={target} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500">Xem</Link>
                    {!n.isRead && (
                      <button onClick={() => void onMarkRead(n.id)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100">Đánh dấu đọc</button>
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
