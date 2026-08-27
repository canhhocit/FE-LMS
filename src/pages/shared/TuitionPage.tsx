import { useEffect, useState } from 'react';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import * as tuitionService from '../../services/tuitionService';
import type { TuitionInvoice, TuitionRate } from '../../types';

const fmtMoney = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

export default function TuitionPage() {
  const [invoices, setInvoices] = useState<TuitionInvoice[]>([]);
  const [rates, setRates] = useState<TuitionRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [list, rateList] = await Promise.all([
          tuitionService.getMyTuition(),
          tuitionService.getTuitionRates(),
        ]);
        if (!mounted) return;
        setInvoices(list);
        setRates(rateList);
      } catch (e: unknown) {
        if (!mounted) return;
        setErr((e as { message?: string })?.message ?? 'Không tải được học phí');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;

  const total = invoices.reduce((sum, i) => sum + (i.status === 'PAID' ? i.amount : 0), 0);

  return (
    <div>
      <PageTitle>Học phí</PageTitle>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="text-xs text-slate-500">Tổng đã đóng</div>
          <div className="text-2xl font-bold text-emerald-600">{fmtMoney(total)}</div>
        </Card>
        <Card>
          <div className="text-xs text-slate-500">Đang chờ</div>
          <div className="text-2xl font-bold text-amber-600">{fmtMoney(invoices.filter((i) => i.status === 'PENDING').reduce((sum, i) => sum + i.amount, 0))}</div>
        </Card>
        <Card>
          <div className="text-xs text-slate-500">Mức học phí</div>
          <div className="text-2xl font-bold text-indigo-600">{rates[0] ? fmtMoney(rates[0].pricePerCredit) : '—'}</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-semibold mb-3">Hóa đơn của tôi</h3>
          {invoices.length === 0 ? <Empty msg="Chưa có hóa đơn" /> : (
            <div className="space-y-3">
              {invoices.map((i) => (
                <div key={i.id} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{i.semester} · {i.academicYear}</div>
                    <Pill color={i.status === 'PAID' ? 'green' : i.status === 'PENDING' ? 'amber' : 'slate'}>{i.status}</Pill>
                  </div>
                  <div className="text-sm text-slate-600">Tín chỉ: {i.totalCredits} · Đơn giá: {fmtMoney(i.pricePerCredit)}</div>
                  <div className="mt-2 text-lg font-bold text-slate-800">{fmtMoney(i.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-semibold mb-3">Mức học phí</h3>
          {rates.length === 0 ? <Empty msg="Chưa có mức học phí" /> : (
            <div className="space-y-3">
              {rates.map((r) => (
                <div key={r.id} className="border border-slate-200 rounded-lg p-3">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-sm text-slate-600">{r.description ?? 'Mức học phí áp dụng hiện tại'}</div>
                  <div className="mt-2 font-bold text-indigo-700">{fmtMoney(r.pricePerCredit)} / tín chỉ</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
