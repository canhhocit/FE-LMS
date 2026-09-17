import { useEffect, useState, useCallback } from 'react';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import * as tuitionService from '../../services/tuitionService';
import type { TuitionInvoice, TuitionRate } from '../../types';

const fmtMoney = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';

export default function TuitionPage() {
  const [invoices, setInvoices] = useState<TuitionInvoice[]>([]);
  const [rates, setRates] = useState<TuitionRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<TuitionInvoice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(() => {
    let mounted = true;
    Promise.all([
      tuitionService.getMyTuition(),
      tuitionService.getTuitionRates(),
    ])
      .then(([list, rateList]) => {
        if (!mounted) return;
        setInvoices(list);
        setRates(rateList);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setErr((e as { message?: string })?.message ?? 'Không tải được học phí');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const cleanup = loadData();
    return cleanup;
  }, [loadData]);

  const handlePay = async () => {
    if (!payingInvoice) return;
    setIsProcessing(true);
    setErr(null);
    try {
      const updated = await tuitionService.payMyInvoice(payingInvoice.id);
      setInvoices((prev) => prev.map((inv) => inv.id === updated.id ? updated : inv));
      setSuccessMsg(`Thanh toán thành công hóa đơn học phí ${updated.semester} - ${updated.academicYear}!`);
      setPayingInvoice(null);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Thanh toán thất bại');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <Spinner />;
  if (err && invoices.length === 0) return <ErrorBox msg={err} />;

  const totalPaid = invoices.reduce((sum, i) => sum + (i.status === 'PAID' ? i.amount : 0), 0);
  const totalUnpaid = invoices.reduce((sum, i) => sum + (i.status !== 'PAID' ? i.amount : 0), 0);
  const activeRate = rates.find((r) => r.isActive) ?? rates[0];

  return (
    <div>
      <PageTitle>Thanh toán Học phí</PageTitle>
      
      {successMsg && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs font-semibold text-emerald-700 hover:underline">Đóng</button>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card className="border-l-4 border-l-emerald-500">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tổng đã thanh toán</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{fmtMoney(totalPaid)}</div>
        </Card>
        <Card className="border-l-4 border-l-rose-500">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Còn cần thanh toán</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{fmtMoney(totalUnpaid)}</div>
        </Card>
        <Card className="border-l-4 border-l-indigo-500">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Đơn giá tín chỉ hiện tại</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">{activeRate ? `${fmtMoney(activeRate.pricePerCredit)} / Tín` : '—'}</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">Danh sách hóa đơn học phí</h3>
              <Pill intent="info">{invoices.length} kỳ học</Pill>
            </div>
            
            {invoices.length === 0 ? (
              <Empty msg="Hiện tại bạn chưa có hóa đơn học phí nào" />
            ) : (
              <div className="space-y-4">
                {invoices.map((i) => {
                  const isPaid = i.status === 'PAID';
                  return (
                    <div key={i.id} className={`rounded-xl border p-4 transition-all ${isPaid ? 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40' : 'border-amber-200 bg-amber-50/20 dark:border-amber-900/50 dark:bg-amber-950/20'}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-100 text-base">{i.semester} · Năm học {i.academicYear}</span>
                          <div className="text-xs text-slate-500 mt-0.5">Mã hóa đơn: #TUITION-{i.id}</div>
                        </div>
                        <Pill intent={isPaid ? 'success' : 'danger'}>
                          {isPaid ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                        </Pill>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm border-t border-b border-slate-200/60 dark:border-slate-800 py-3 my-3">
                        <div>
                          <span className="text-xs text-slate-400 block">Số tín chỉ:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{i.totalCredits ?? 0} tín chỉ</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 block">Đơn giá / tín:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{fmtMoney(i.pricePerCredit)}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 block">Hạn thanh toán:</span>
                          <span className={`font-semibold ${!isPaid ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>{fmtDate(i.dueDate)}</span>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 block">{isPaid ? 'Ngày thanh toán:' : 'Trạng thái:'}</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{isPaid ? fmtDate(i.paidAt) : 'Cần thanh toán'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-xs text-slate-500 block">Tổng tiền học phí:</span>
                          <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{fmtMoney(i.amount)}</span>
                        </div>
                        {!isPaid && (
                          <button
                            onClick={() => setPayingInvoice(i)}
                            className="rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 text-sm shadow-sm transition-colors flex items-center gap-1.5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Thanh toán ngay
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card>
            <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-100">Bảng định mức học phí</h3>
            {rates.length === 0 ? (
              <Empty msg="Chưa có định mức" />
            ) : (
              <div className="space-y-3">
                {rates.map((r) => (
                  <div key={r.id} className={`rounded-xl border p-3.5 transition ${r.isActive ? 'border-indigo-300 bg-indigo-50/50 dark:border-indigo-900/60 dark:bg-indigo-950/30' : 'border-slate-200 bg-slate-50 dark:border-slate-800'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Năm học {r.academicYear}</span>
                      {r.isActive && <Pill intent="success">ÁP DỤNG</Pill>}
                    </div>
                    <div className="mt-2 text-lg font-bold text-indigo-600 dark:text-indigo-400">{fmtMoney(r.pricePerCredit)} <span className="text-xs font-normal text-slate-500">/ tín chỉ</span></div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal Mô phỏng Cổng thanh toán VNPay / VietQR */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Thanh toán VNPay / Chuyển khoản</h3>
                  <p className="text-xs text-slate-500">Kỳ {payingInvoice.semester} · {payingInvoice.academicYear}</p>
                </div>
              </div>
              <button onClick={() => setPayingInvoice(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="my-4 space-y-3 text-sm">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Tổng số tín chỉ:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{payingInvoice.totalCredits} tín</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Đơn giá / tín chỉ:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{fmtMoney(payingInvoice.pricePerCredit)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Hạn thanh toán:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{fmtDate(payingInvoice.dueDate)}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2 flex justify-between items-center">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Số tiền thanh toán:</span>
                  <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{fmtMoney(payingInvoice.amount)}</span>
                </div>
              </div>

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 dark:border-indigo-900/50 dark:bg-indigo-950/30 p-3 text-center">
                <p className="text-xs text-indigo-800 dark:text-indigo-300 font-medium">Hệ thống đang ở chế độ mô phỏng thanh toán trực tuyến.</p>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5">Nhấn "Xác nhận đã thanh toán" để hoàn tất giao dịch.</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPayingInvoice(null)}
                disabled={isProcessing}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handlePay()}
                disabled={isProcessing}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 shadow-sm transition disabled:opacity-50 flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang xử lý...
                  </>
                ) : (
                  'Xác nhận đã thanh toán'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
