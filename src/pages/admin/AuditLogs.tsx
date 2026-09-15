import { useEffect, useState } from 'react';
import * as auditService from '../../services/auditLogService';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
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
      setErr((e as { message?: string })?.message ?? 'Lá»—i táº£i audit log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(0); }, []);

  const handleFilter = () => { load(0, filterType); };
  const handleClear = () => { setFilterType(''); load(0); };

  const resultColor = (r: string) => {
    if (r === 'SUCCESS') return 'emerald';
    if (r === 'FAILURE') return 'rose';
    return 'slate';
  };

  return (
    <div className="space-y-6">
      <PageTitle>Audit Log - Nháº­t kĂ½ há»‡ thá»‘ng</PageTitle>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <input value={filterType} onChange={e => setFilterType(e.target.value)} placeholder="Lá»c theo resource (VD: USER, COURSE...)"
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" />
          <button aria-label="button" onClick={handleFilter} className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition">Lá»c</button>
          <button aria-label="button" onClick={handleClear} className="px-4 py-2 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition">XoĂ¡ lá»c</button>
          <span className="text-xs text-slate-400 ml-auto">Tá»•ng: {totalElements} báº£n ghi</span>
        </div>
      </Card>

      {err && <ErrorBox msg={err} />}
      {loading ? <Spinner /> : logs.length === 0 ? <Empty msg="KhĂ´ng cĂ³ báº£n ghi nĂ o" /> : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="text-left p-3">Thá»i gian</th>
                  <th className="text-left p-3">NgÆ°á»i thá»±c hiá»‡n</th>
                  <th className="text-left p-3">HĂ nh Ä‘á»™ng</th>
                  <th className="text-left p-3">Resource</th>
                  <th className="text-left p-3">Chi tiáº¿t</th>
                  <th className="text-left p-3">IP</th>
                  <th className="text-center p-3">Káº¿t quáº£</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                    <td className="p-3 text-xs text-slate-500 font-mono">{new Date(log.createdAt).toLocaleString('vi-VN')}</td>
                    <td className="p-3 text-slate-700">{log.actorEmail}</td>
                    <td className="p-3"><span className="font-semibold text-slate-800">{log.action}</span></td>
                    <td className="p-3 text-xs text-slate-500">{log.resourceType} #{log.resourceId}</td>
                    <td className="p-3 text-xs text-slate-400 max-w-xs truncate">{log.detail || '-'}</td>
                    <td className="p-3 text-xs text-slate-400 font-mono">{log.ipAddress || '-'}</td>
                    <td className="p-3 text-center"><Pill color={resultColor(log.result) as any}>{log.result}</Pill></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-slate-100">
              <button aria-label="button" disabled={page === 0} onClick={() => load(page - 1, filterType)} className="px-3 py-1 rounded text-xs border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition">TrÆ°á»›c</button>
              <span className="text-xs text-slate-500">Trang {page + 1} / {totalPages}</span>
              <button aria-label="button" disabled={page >= totalPages - 1} onClick={() => load(page + 1, filterType)} className="px-3 py-1 rounded text-xs border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition">Sau</button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}


