import React, { useCallback, useEffect, useState } from 'react';
import { Key, Send } from 'lucide-react';
import { PageHeader, Card, Button, Select, Textarea, Table, Badge, Toast, Spinner, ErrorBox, Empty } from '../../components/ui';
import * as clazzService from '../../services/clazzService';
import * as pbacService from '../../services/pbacService';
import type { Clazz } from '../../types';

export const PermissionRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<pbacService.PermissionRequest[]>([]);
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [classId, setClassId] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchRequests = useCallback(() => Promise.all([
    clazzService.getMyClasses(),
    pbacService.getMyPermissionRequests(),
  ]), []);

  const loadRequests = async () => {
    try {
      const [classList, requestList] = await fetchRequests();
      setError(null);
      setClasses(classList);
      setRequests(requestList);
      setClassId((selected) =>
        selected && classList.some((clazz) => String(clazz.id) === selected)
          ? selected
          : classList.length ? String(classList[0].id) : '',
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải yêu cầu cấp quyền.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    fetchRequests()
      .then(([classList, requestList]) => {
        if (!mounted) return;
        setClasses(classList);
        setRequests(requestList);
        setClassId(classList.length ? String(classList[0].id) : '');
      })
      .catch((loadError: unknown) => {
        if (mounted) setError(loadError instanceof Error ? loadError.message : 'Không thể tải yêu cầu cấp quyền.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [fetchRequests]);

  const retryLoad = () => {
    setLoading(true);
    void loadRequests();
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !classId) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await pbacService.createPermissionRequest({
        classId: Number(classId),
        permissionType: 'EDIT_GRADES',
        reason: reason.trim(),
      });
      setReason('');
      setMsg('Đã gửi yêu cầu cấp quyền tới Quản trị viên!');
      await loadRequests();
    } catch (requestError) {
      setSubmitError(requestError instanceof Error ? requestError.message : 'Không thể gửi yêu cầu cấp quyền.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge color="emerald">Đã duyệt</Badge>;
      case 'PENDING':
        return <Badge color="amber">Đang chờ</Badge>;
      case 'REJECTED':
        return <Badge color="red">Từ chối</Badge>;
      case 'EXPIRED':
        return <Badge color="slate">Hết hạn</Badge>;
      case 'REVOKED':
        return <Badge color="slate">Đã thu hồi</Badge>;
      default:
        return <Badge color="neutral">{status}</Badge>;
    }
  };

  const classNames = new Map(classes.map((clazz) => [clazz.id, `${clazz.classCode} - ${clazz.className}`]));
  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleString('vi-VN') : '—';

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Key className="w-5 h-5 text-accent-600 dark:text-accent-400" />
            Yêu cầu Cấp quyền Sửa điểm (PBAC)
          </span>
        }
        subtitle="Gửi yêu cầu mở khóa tạm thời quyền chỉnh sửa điểm học phần tới Ban quản trị"
      />

      {msg && <Toast message={msg} type="success" onClose={() => setMsg(null)} />}
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox msg={error} onRetry={retryLoad} />
      ) : (
        <>
          <Card>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">Tạo Yêu cầu Cấp quyền mới</h3>
            {submitError && <div className="mb-4"><ErrorBox msg={submitError} /></div>}
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Chọn Lớp học phần"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  disabled={classes.length === 0}
                >
                  {classes.length === 0 ? (
                    <option value="">Bạn chưa được phân công lớp học phần</option>
                  ) : classes.map((clazz) => (
                    <option key={clazz.id} value={clazz.id}>
                      {clazz.classCode} - {clazz.className}
                    </option>
                  ))}
                </Select>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Loại quyền xin cấp</label>
                  <input
                    type="text"
                    disabled
                    value="Chỉnh sửa Điểm thành phần Học phần (PBAC)"
                    className="w-full px-3.5 py-2 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500"
                  />
                </div>
              </div>

              <Textarea
                label="Lý do xin cấp quyền (*)"
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Mô tả lý do xin cấp quyền (ví dụ: cập nhật minh chứng điểm danh, bổ sung cột điểm thi lại...)"
              />

              <div className="flex justify-end">
                <Button type="submit" loading={isSubmitting} disabled={!reason.trim() || !classId || isSubmitting}>
                  <Send className="w-3.5 h-3.5" /> Gửi Yêu cầu
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">Lịch sử Yêu cầu đã gửi</h3>
            {requests.length === 0 ? (
              <Empty msg="Chưa có yêu cầu nào được gửi" />
            ) : (
              <Table headers={['Mã YC', 'Lớp học phần', 'Lý do', 'Trạng thái', 'Thời hạn', 'Ngày tạo']}>
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-bold text-accent-600 text-xs">#{r.id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white text-xs">{classNames.get(r.classId) ?? `Lớp #${r.classId}`}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs max-w-xs truncate">{r.reason}</td>
                    <td className="px-4 py-3 text-center">{renderStatusBadge(r.status)}</td>
                    <td className="px-4 py-3 text-center text-slate-400 font-mono text-xs">{formatDate(r.validUntil)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(r.createdAt)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default PermissionRequestsPage;
