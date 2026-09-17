import { useEffect, useState, useCallback } from 'react';
import { Printer, CheckCircle, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import * as tuitionService from '../../services/tuitionService';
import type { TuitionInvoice, TuitionRate } from '../../types';

const fmtMoney = (v: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

// ─── Print Invoice helper ────────────────────────────────────────────────────
function printInvoice(inv: TuitionInvoice) {
  const amountStr = fmtMoney(inv.amount);
  const ppCreditStr = fmtMoney(inv.pricePerCredit);
  const paidAtStr = fmtDate(inv.paidAt);
  const dueDateStr = fmtDate(inv.dueDate);
  const invoiceNo = `#TUITION-${inv.id}`;
  const now = new Date().toLocaleString('vi-VN');

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <title>Hóa đơn học phí – ${invoiceNo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;background:#f1f5f9;color:#1e293b;padding:0}
    @media print{
      body{background:#fff;padding:0}
      .no-print{display:none!important}
      .page{box-shadow:none;border-radius:0;max-width:100%}
    }
    .page{max-width:680px;margin:32px auto;background:#fff;border-radius:16px;box-shadow:0 4px 30px rgba(0,0,0,0.10);overflow:hidden}
    .header{background:linear-gradient(135deg,#4f46e5,#2563eb);padding:36px 40px;color:#fff}
    .header-logo{font-size:22px;font-weight:800;margin-bottom:8px;display:flex;align-items:center;gap:10px}
    .header-title{font-size:18px;font-weight:600;opacity:.9}
    .header-sub{font-size:13px;opacity:.7;margin-top:4px}
    .badge-paid{display:inline-flex;align-items:center;gap:8px;background:#ecfdf5;border:1.5px solid #6ee7b7;color:#065f46;font-weight:700;font-size:13px;padding:6px 18px;border-radius:999px;margin:20px 40px 0}
    .badge-unpaid{display:inline-flex;align-items:center;gap:8px;background:#fef3c7;border:1.5px solid #fde68a;color:#92400e;font-weight:700;font-size:13px;padding:6px 18px;border-radius:999px;margin:20px 40px 0}
    .section{padding:24px 40px}
    .section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#94a3b8;margin-bottom:14px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
    .info-item label{display:block;font-size:11px;color:#94a3b8;margin-bottom:3px}
    .info-item span{font-size:14px;font-weight:600;color:#1e293b}
    table{width:100%;border-collapse:collapse}
    th{text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#94a3b8;padding:10px 0;border-bottom:1.5px solid #e2e8f0}
    td{padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#334155}
    td:last-child{text-align:right;font-weight:600}
    .total-row{background:#f8fafc;padding:18px 40px;display:flex;justify-content:space-between;align-items:center;border-top:2px solid #e2e8f0}
    .total-label{font-size:14px;color:#64748b;font-weight:600}
    .total-amount{font-size:24px;font-weight:800;color:#4f46e5}
    .footer{background:#1e293b;padding:20px 40px;text-align:center}
    .footer p{color:#94a3b8;font-size:12px;line-height:1.8}
    .print-btn{display:inline-flex;align-items:center;gap:8px;margin:24px auto 0;padding:10px 32px;background:#4f46e5;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:background .2s}
    .print-btn:hover{background:#4338ca}
    .watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;font-weight:800;color:rgba(79,70,229,0.06);pointer-events:none;user-select:none;white-space:nowrap}
  </style>
</head>
<body>
  <div class="page" style="position:relative">
    <div class="watermark">LearningHub</div>

    <!-- Header -->
    <div class="header">
      <div class="header-logo">
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
        LearningHub
      </div>
      <div class="header-title">Hóa đơn thu học phí</div>
      <div class="header-sub">Phòng Tài chính – Kế toán</div>
    </div>

    <!-- Status badge -->
    ${inv.status === 'PAID' ? `
    <div class="badge-paid" style="display:flex;">
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      Đã thanh toán
    </div>` : `
    <div class="badge-unpaid" style="display:flex;">
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      Chưa thanh toán
    </div>`}

    <!-- Invoice meta -->
    <div class="section">
      <div class="section-title">Thông tin hóa đơn</div>
      <div class="info-grid">
        <div class="info-item"><label>Mã hóa đơn</label><span>${invoiceNo}</span></div>
        <div class="info-item"><label>Ngày in</label><span>${now}</span></div>
        <div class="info-item"><label>Học kỳ</label><span>${inv.semester}</span></div>
        <div class="info-item"><label>Năm học</label><span>${inv.academicYear}</span></div>
        <div class="info-item"><label>Hạn thanh toán</label><span>${dueDateStr}</span></div>
        <div class="info-item"><label>${inv.status === 'PAID' ? 'Ngày thanh toán' : 'Trạng thái'}</label><span>${inv.status === 'PAID' ? paidAtStr : 'Cần thanh toán'}</span></div>
      </div>
    </div>

    <!-- Student info -->
    <div class="section" style="padding-top:0">
      <div class="section-title">Thông tin sinh viên</div>
      <div class="info-grid">
        <div class="info-item"><label>Họ và tên</label><span>${inv.studentFullName ?? '—'}</span></div>
        <div class="info-item"><label>Mã sinh viên</label><span>${inv.studentId ?? '—'}</span></div>
      </div>
    </div>

    <!-- Line items -->
    <div class="section" style="padding-top:0">
      <div class="section-title">Chi tiết học phí</div>
      <table>
        <thead>
          <tr>
            <th>Khoản thu</th>
            <th>Số lượng</th>
            <th>Đơn giá</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Học phí tín chỉ – Kỳ ${inv.semester}</td>
            <td>${inv.totalCredits} tín chỉ</td>
            <td>${ppCreditStr}</td>
            <td style="color:#4f46e5;font-weight:700">${amountStr}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Total -->
    <div class="total-row">
      <span class="total-label">Tổng cộng phải nộp:</span>
      <span class="total-amount">${amountStr}</span>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Hóa đơn này được tạo tự động bởi Hệ thống LearningHub.</p>
      <p>Mọi thắc mắc vui lòng liên hệ Phòng Tài chính – Kế toán của trường.</p>
      <p style="color:#475569;font-size:11px;margin-top:8px">no-reply@learninghub.edu.vn</p>
    </div>

    <!-- Print button (hidden when printing) -->
    <div style="padding:20px 40px;text-align:center" class="no-print">
      <button class="print-btn" onclick="window.print()">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:middle;margin-right:6px">
          <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
        </svg>
        In hóa đơn
      </button>
    </div>
  </div>

  <script>
    // Auto-trigger print dialog when opened standalone
    window.onload = () => { };
  </script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=780,height=900');
  if (!w) {
    alert('Vui lòng cho phép mở popup để in hóa đơn.');
    return;
  }
  w.document.write(html);
  w.document.close();
  // Small delay so fonts load before print
  setTimeout(() => w.print(), 600);
}

// ─── Main component ──────────────────────────────────────────────────────────
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
      setSuccessMsg(
        `Thanh toán thành công! Email xác nhận đã được gửi tới địa chỉ email cá nhân của bạn.`
      );
      // Auto-print invoice after payment
      printInvoice(updated);
      setPayingInvoice(null);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Thanh toán thất bại');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <Spinner />;
  if (err && invoices.length === 0) return <ErrorBox msg={err} />;

  const totalPaid   = invoices.reduce((sum, i) => sum + (i.status === 'PAID' ? i.amount : 0), 0);
  const totalUnpaid = invoices.reduce((sum, i) => sum + (i.status !== 'PAID' ? i.amount : 0), 0);
  const activeRate  = rates.find((r) => r.isActive) ?? rates[0];

  return (
    <div>
      <PageTitle>Thanh toán Học phí</PageTitle>

      {successMsg && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-xs font-semibold text-emerald-700 hover:underline ml-4 shrink-0">Đóng</button>
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

                      <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                        <div>
                          <span className="text-xs text-slate-500 block">Tổng tiền học phí:</span>
                          <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">{fmtMoney(i.amount)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Print button – always available */}
                          <button
                            onClick={() => printInvoice(i)}
                            title="In hóa đơn"
                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium px-3 py-2 text-sm shadow-sm transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                            In hóa đơn
                          </button>
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
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
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

              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 dark:border-indigo-900/50 dark:bg-indigo-950/30 p-3">
                <p className="text-xs text-indigo-800 dark:text-indigo-300 font-medium text-center">Hệ thống đang ở chế độ mô phỏng thanh toán trực tuyến.</p>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5 text-center">Sau khi xác nhận, hóa đơn sẽ được in và email xác nhận gửi về địa chỉ email cá nhân.</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setPayingInvoice(null)} disabled={isProcessing}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                Hủy
              </button>
              <button type="button" onClick={() => void handlePay()} disabled={isProcessing}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 shadow-sm transition disabled:opacity-50 flex items-center gap-2">
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang xử lý...
                  </>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Xác nhận &amp; In hóa đơn
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
