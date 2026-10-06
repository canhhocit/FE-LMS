import { useCallback, useEffect, useState } from 'react';
import { History, Search, ShieldAlert } from 'lucide-react';
import * as auditService from '../../services/auditLogService';
import { PageHeader, Card, Button, Input, Badge, Spinner, Empty, ErrorBox } from '../../components/ui';
import { useAuth } from '../../contexts/useAuth';
import type { AuditLogEntry, SystemErrorLogEntry } from '../../services/auditLogService';

export default function AdminAuditLogs() {
  const { hasPermission } = useAuth();
  const canViewActions = hasPermission('SYSTEM_CONFIG');
  const canViewErrors = hasPermission('VIEW_SYSTEM_LOGS') || hasPermission('SYSTEM_CONFIG');
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [systemErrors, setSystemErrors] = useState<SystemErrorLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filterType, setFilterType] = useState('');
  const [activeTab, setActiveTab] = useState<'actions' | 'errors'>(() => (
    hasPermission('SYSTEM_CONFIG') ? 'actions' : 'errors'
  ));

  const load = useCallback(async (p: number, type?: string) => {
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
  }, []);

  const loadSystemErrors = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await auditService.getSystemErrorLogs(p, 20);
      setSystemErrors(res.content || []);
      setTotalPages(res.totalPages || 0);
      setTotalElements(res.totalElements || 0);
      setPage(p);
      setErr(null);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lỗi tải nhật ký lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchCurrentTab = async () => {
      try {
        if (activeTab === 'actions' && canViewActions) {
          const res = await auditService.getAuditLogs(0, 20);
          if (!isMounted) return;
          setLogs(res.content || []);
          setTotalPages(res.totalPages || 0);
          setTotalElements(res.totalElements || 0);
          setPage(0);
          setErr(null);
        } else if (activeTab === 'errors' && canViewErrors) {
          const res = await auditService.getSystemErrorLogs(0, 20);
          if (!isMounted) return;
          setSystemErrors(res.content || []);
          setTotalPages(res.totalPages || 0);
          setTotalElements(res.totalElements || 0);
          setPage(0);
          setErr(null);
        }
      } catch (e: unknown) {
        if (isMounted) {
          const fallback = activeTab === 'actions' ? 'Lỗi tải nhật ký thao tác' : 'Lỗi tải nhật ký hệ thống';
          setErr((e as { message?: string })?.message ?? fallback);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void fetchCurrentTab();
    return () => { isMounted = false; };
  }, [activeTab, canViewActions, canViewErrors]);

  const switchTab = (tab: 'actions' | 'errors') => {
    if (tab === activeTab) {
      if (tab === 'actions') void load(0, filterType);
      else void loadSystemErrors(0);
      return;
    }
    setLoading(true);
    setErr(null);
    setActiveTab(tab);
  };

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
        title="Nhật ký hệ thống"
        subtitle="Theo dõi lịch sử thao tác và các lỗi phát sinh trong hệ thống"
      />

      <Card padding="none">
        {!canViewActions && !canViewErrors ? (
          <div className="p-6">
            <ErrorBox message="Bạn không có quyền xem nhật ký hệ thống." />
          </div>
        ) : (
          <>
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 p-4">
          {canViewActions && (
            <Button
              variant={activeTab === 'actions' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => switchTab('actions')}
            >
              <History className="mr-2 h-4 w-4" />
              Lịch sử thao tác
            </Button>
          )}
          {canViewErrors && (
            <Button
              variant={activeTab === 'errors' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => switchTab('errors')}
            >
              <ShieldAlert className="mr-2 h-4 w-4" />
              Lịch sử hệ thống
            </Button>
          )}
        </div>

        {activeTab === 'actions' && (
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
        )}

        {activeTab === 'errors' && (
          <div className="flex justify-end border-b border-slate-200 bg-slate-50/50 p-4 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
            Tổng số: <span className="ml-1 text-slate-900 dark:text-white">{totalElements}</span> lỗi
          </div>
        )}

        {err && <ErrorBox message={err} />}

        {loading ? (
          <div className="p-8 text-center"><Spinner /></div>
        ) : activeTab === 'actions' && logs.length === 0 ? (
          <Empty msg="Không có bản ghi nhật ký nào" />
        ) : activeTab === 'errors' && systemErrors.length === 0 ? (
          <Empty msg="Chưa ghi nhận lỗi hệ thống nào" />
        ) : activeTab === 'actions' ? (
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
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                    <th className="px-4 py-3.5">Thời gian</th>
                    <th className="px-4 py-3.5">Người thực hiện</th>
                    <th className="px-4 py-3.5">Loại lỗi</th>
                    <th className="px-4 py-3.5">Endpoint</th>
                    <th className="px-4 py-3.5">Thông báo</th>
                    <th className="px-4 py-3.5">Chi tiết lỗi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800/60">
                  {systemErrors.map((error) => (
                    <tr key={error.id} className="align-top hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-[11px] text-slate-500">
                        {new Date(error.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">{error.actorEmail || 'anonymous'}</td>
                      <td className="px-4 py-3.5 font-mono text-rose-600 dark:text-rose-400">{error.exceptionType}</td>
                      <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                        {error.requestMethod || ''} {error.requestPath || '-'}
                      </td>
                      <td className="max-w-xs whitespace-pre-wrap px-4 py-3.5 text-slate-600 dark:text-slate-400">{error.errorMessage || '-'}</td>
                      <td className="px-4 py-3.5">
                        <details className="max-w-xl">
                          <summary className="cursor-pointer font-semibold text-blue-700 dark:text-blue-300">Xem stack trace</summary>
                          <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded bg-slate-100 p-3 text-[11px] text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                            {error.stackTrace || 'Không có stack trace'}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 p-4 text-xs dark:border-slate-800">
                <div className="text-slate-500 dark:text-slate-400">
                  Trang <span className="font-semibold text-slate-900 dark:text-white">{page + 1}</span> / <span className="font-semibold text-slate-900 dark:text-white">{totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => loadSystemErrors(page - 1)}>
                    &laquo; Trước
                  </Button>
                  <Button variant="secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => loadSystemErrors(page + 1)}>
                    Sau &raquo;
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
          </>
        )}
      </Card>
    </div>
  );
}
