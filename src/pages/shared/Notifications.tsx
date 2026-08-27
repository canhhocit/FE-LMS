import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/useAuth';
import * as notificationService from '../../services/notificationService';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import type { Notification } from '../../types';

const fmt = (s: string) => new Date(s).toLocaleString('vi-VN');

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
      setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true, isRead: true } : n));
    } catch {
      // no-op for UI; backend will reject only on server-side failure
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
          {items.map((n) => (
            <Card key={n.id} className={n.read || n.isRead ? 'border-slate-200' : 'border-indigo-200 bg-indigo-50/40'}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-800">{n.title}</span>
                    {!(n.read || n.isRead) && <Pill color="indigo">Mới</Pill>}
                  </div>
                  <div className="text-sm text-slate-600">{n.content}</div>
                  <div className="mt-2 text-xs text-slate-500">{fmt(n.createdAt)}</div>
                </div>
                {!(n.read || n.isRead) && (
                  <button onClick={() => void onMarkRead(n.id)} className="text-xs px-3 py-1.5 rounded bg-slate-800 text-white hover:bg-slate-700">Đánh dấu đọc</button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
