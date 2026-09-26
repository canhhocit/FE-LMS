import { useEffect, useState } from 'react';
import { History, Search, Filter } from 'lucide-react';
import * as auditService from '../../services/auditLogService';
import { PageHeader, Card, Button, Input, Badge, Spinner, Empty, ErrorBox } from '../../components/ui';
import type { AuditLogEntry } from '../../services/auditLogService';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filterType, setFilterType] = useState('');

  const load = async (p: number, type?: string) => {
    setLoading(true);
    try {
      const res = await auditService.getAuditLogs(p, 20, type || undefined);
      setLogs(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
      setPage(p);
      setErr(null);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lỗi tải nhật ký hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await auditService.getAuditLogs(0, 20);
        if (mounted) {
          setLogs(res.content || []);
          setTotalPages(res.totalPages || 0);
          setTotalElements(res.totalElements || 0);
          setPage(0);
          setErr(null);
        }
      } catch (e: unknown) {
        if (mounted) setErr((e as { message?: string })?.message ?? 'Lỗi tải nhật ký hệ thống');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleFilter = () => { load(0, filterType); };
  const handleClear = () => { setFilterType(''); load(0); };

  const getBadgeVariant = (r: string) => {
    if (r === 'SUCCESS') return 'success';
    if (r === 'FAILURE') return 'danger';
    return 'neutral';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Quản trị hệ thống', to: '/admin' }, { label: 'Nhật ký hệ thống' }]}
        title="Nhật ký Hệ thống (Audit Logs)"
        subtitle="Truy vết toàn bộ lịch sử thao tác, tạo/sửa/xóa và đăng nhập của người dùng trong hệ thống"
      />

      <Card padding="none">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Input
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              placeholder="Lọc theo resource (VD: USER, COURSE...)"
              leftIcon={<Search className="w-4 h-4" />}
            />
            <Button variant="primary" size="sm" onClick={handleFilter}>
              Lọc
            </Button>
            <Button variant="secondary" size="sm" onClick={handleClear}>
              Xóa
            </Button>
          </div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Tổng số: <span className="text-slate-900 dark:text-white font-bold">{totalElements}</span> bản ghi
          </div>
        </div>

        {err && <ErrorBox message={err} />}

        {loading ? (
          <div className="p-8 text-center"><Spinner /></div>
        ) : logs.length === 0 ? (
          <Empty msg="Không có bản ghi nhật ký nào" />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Thời gian</th>
                    <th className="py-3.5 px-4">Người thực hiện</th>
                    <th className="py-3.5 px-4">Hành động</th>
                    <th className="py-3.5 px-4">Resource</th>
                    <th className="py-3.5 px-4">Chi tiết</th>
                    <th className="py-3.5 px-4">Địa chỉ IP</th>
                    <th className="py-3.5 px-4 text-center">Kết quả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">{log.actorEmail}</td>
                      <td className="py-3.5 px-4 font-semibold text-navy-900 dark:text-navy-300">{log.action}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono">{log.resourceType} #{log.resourceId}</td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">{log.detail || '-'}</td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{log.ipAddress || '-'}</td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={getBadgeVariant(log.result)}>
                          {log.result}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div className="text-slate-500 dark:text-slate-400">
                  Trang <span className="font-semibold text-slate-900 dark:text-white">{page + 1}</span> / <span className="font-semibold text-slate-900 dark:text-white">{totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => load(page - 1, filterType)}>
                    &laquo; Trước
                  </Button>
                  <Button variant="secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => load(page + 1, filterType)}>
                    Sau &raquo;
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
