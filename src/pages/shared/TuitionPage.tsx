import { useEffect, useState, useCallback } from 'react';
import { Printer, CheckCircle2, QrCode, ExternalLink, RefreshCw } from 'lucide-react';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import * as tuitionService from '../../services/tuitionService';
import type { TuitionInvoice, TuitionRate, PayOSPaymentResponse } from '../../types';

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

    <!-- Print button -->
    <div style="padding:20px 40px;text-align:center" class="no-print">
      <button class="print-btn" onclick="window.print()">In hóa đơn</button>
    </div>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

export default function TuitionPage() {
  const [invoices, setInvoices] = useState<TuitionInvoice[]>([]);
  const [rates, setRates] = useState<TuitionRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [flashMsg, setFlashMsg] = useState<string | null>(null);

  // Payment states
  const [payingInvoice, setPayingInvoice] = useState<TuitionInvoice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [payOSData, setPayOSData] = useState<PayOSPaymentResponse | null>(null);
  const [creatingPayOS, setCreatingPayOS] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [invs, rts] = await Promise.all([
        tuitionService.getMyTuition().catch(() => []),
        tuitionService.getTuitionRates().catch(() => []),
      ]);
      setInvoices(invs);
      setRates(rts);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lỗi tải dữ liệu học phí');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();

    // Check if returning from PayOS redirect (query params: ?status=PAID&invoiceId=123)
    const searchParams = new URLSearchParams(window.location.search);
    const status = searchParams.get('status');
    const invoiceId = searchParams.get('invoiceId');

    if (status === 'PAID' && invoiceId) {
      const invId = Number(invoiceId);
      if (!isNaN(invId)) {
        tuitionService.verifyPayOSPayment(invId)
          .then((updated) => {
            setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
            setFlashMsg('Thanh toán thành công qua Cổng PayOS! Hóa đơn đã được gạch nợ.');
          })
          .catch(() => {
            // Silence error if already verified
          })
          .finally(() => {
            // Clean up URL query parameters
            window.history.replaceState({}, document.title, window.location.pathname);
          });
      }
    }
  }, [fetchData]);

  const handlePay = async () => {
    if (!payingInvoice) return;
    setIsProcessing(true);
    try {
      const updated = await tuitionService.payMyInvoice(payingInvoice.id);
      setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setFlashMsg('Thanh toán học phí thành công!');
      setPayingInvoice(null);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Thanh toán thất bại');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreatePayOS = async (inv: TuitionInvoice) => {
    setCreatingPayOS(true);
    setErr(null);
    try {
      const payOSResp = await tuitionService.createPayOSPayment(inv.id);
      setPayOSData(payOSResp);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Tạo link thanh toán PayOS thất bại');
    } finally {
      setCreatingPayOS(false);
    }
  };

  const handleVerifyPayOS = async () => {
    if (!payOSData) return;
    setIsProcessing(true);
    try {
      const updated = await tuitionService.verifyPayOSPayment(payOSData.invoiceId);
      setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setFlashMsg('Xác nhận thanh toán PayOS thành công! Hóa đơn đã được gạch nợ.');
      setPayOSData(null);
      setPayingInvoice(null);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Xác minh thanh toán thất bại');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;

  const unpaidInvoices = invoices.filter((i) => i.status !== 'PAID');
  const totalUnpaidAmount = unpaidInvoices.reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="space-y-6">
      <PageTitle>Học Phí & Nghĩa Vụ Tài Chính</PageTitle>

      {flashMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center justify-between shadow-xs">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            {flashMsg}
          </span>
          <button onClick={() => setFlashMsg(null)} className="text-xs font-bold hover:underline">Đóng</button>
        </div>
      )}

      {/* Summary Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border border-indigo-100 bg-linear-to-br from-indigo-50/70 to-white">
          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Tổng nợ học phí hiện tại</div>
          <div className="mt-2 text-2xl font-black text-indigo-700">{fmtMoney(totalUnpaidAmount)}</div>
          <div className="mt-1 text-xs text-slate-500">{unpaidInvoices.length} hóa đơn chưa thanh toán</div>
        </Card>
        <Card>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng số hóa đơn</div>
          <div className="mt-2 text-2xl font-bold text-slate-800">{invoices.length} hóa đơn</div>
          <div className="mt-1 text-xs text-slate-500">Kỳ học 2024-2026</div>
        </Card>
        <Card>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trạng thái nghĩa vụ tài chính</div>
          <div className="mt-2 flex items-center gap-2">
            {unpaidInvoices.length === 0 ? (
              <Pill color="green">Đã hoàn thành 100%</Pill>
            ) : (
              <Pill color="amber">Còn {unpaidInvoices.length} hóa đơn nợ</Pill>
            )}
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-800 text-base">Danh sách hóa đơn học phí của tôi</h3>
              <button 
                onClick={() => void fetchData()} 
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Làm mới
              </button>
            </div>

            {invoices.length === 0 ? (
              <Empty msg="Bạn chưa có hóa đơn học phí nào" />
            ) : (
              <div className="space-y-4">
                {invoices.map((i) => {
                  const isPaid = i.status === 'PAID';
                  return (
                    <div
                      key={i.id}
                      className={`rounded-2xl border p-4 transition-all duration-200 ${
                        isPaid
                          ? 'border-slate-200 bg-white hover:border-slate-300'
                          : 'border-amber-200 bg-amber-50/40 hover:border-amber-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-base">Học kỳ {i.semester}</span>
                            <span className="text-xs text-slate-500">• Năm học {i.academicYear}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">Mã hóa đơn: #TUITION-{i.id}</div>
                        </div>
                        <Pill color={isPaid ? 'green' : 'amber'}>
                          {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </Pill>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-4">
                        <div>
                          <span className="text-slate-400 block">Số tín chỉ:</span>
                          <span className="font-semibold text-slate-700">{i.totalCredits || 0} tín chỉ</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Đơn giá / tín:</span>
                          <span className="font-semibold text-slate-700">{fmtMoney(i.pricePerCredit)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Hạn nộp:</span>
                          <span className={`font-semibold ${!isPaid ? 'text-rose-600 font-bold' : 'text-slate-700'}`}>
                            {fmtDate(i.dueDate)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 gap-3 flex-wrap border-t border-slate-100">
                        <div>
                          <span className="text-xs text-slate-500 block">Số tiền thanh toán:</span>
                          <span className="text-xl font-black text-indigo-600">{fmtMoney(i.amount)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => printInvoice(i)}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium px-3 py-1.5 text-xs shadow-2xs transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            In hóa đơn
                          </button>

                          {!isPaid && (
                            <button
                              onClick={() => {
                                setPayingInvoice(i);
                                void handleCreatePayOS(i);
                              }}
                              disabled={creatingPayOS}
                              className="rounded-lg bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold px-4 py-2 text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <QrCode className="w-4 h-4" />
                              Thanh toán PayOS VietQR
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
            <h3 className="font-bold text-slate-800 text-base mb-3">Định mức học phí áp dụng</h3>
            {rates.length === 0 ? (
              <Empty msg="Chưa có định mức" />
            ) : (
              <div className="space-y-3">
                {rates.map((r) => (
                  <div
                    key={r.id}
                    className={`rounded-xl border p-3.5 transition ${
                      r.isActive ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-800 text-sm">Năm học {r.academicYear}</span>
                      {r.isActive && <Pill color="green">ĐANG ÁP DỤNG</Pill>}
                    </div>
                    <div className="mt-2 text-lg font-bold text-indigo-600">
                      {fmtMoney(r.pricePerCredit)} <span className="text-xs font-normal text-slate-500">/ tín chỉ</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* PayOS VietQR Payment Modal */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Thanh toán PayOS (VietQR)</h3>
                  <p className="text-xs text-slate-500">Hóa đơn #{payingInvoice.id} · Kỳ {payingInvoice.semester} ({payingInvoice.academicYear})</p>
                </div>
              </div>
              <button 
                onClick={() => { setPayingInvoice(null); setPayOSData(null); }} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {creatingPayOS ? (
              <div className="py-12 text-center space-y-3">
                <Spinner />
                <p className="text-xs text-slate-600 font-medium">Đang khởi tạo mã VietQR từ Cổng PayOS...</p>
              </div>
            ) : payOSData ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-indigo-50/60 p-4 rounded-xl border border-indigo-100">
                  {/* VietQR Image */}
                  <img
                    src={payOSData.qrCode}
                    alt="VietQR PayOS"
                    className="w-40 h-40 object-contain rounded-lg border border-white shadow-xs shrink-0"
                  />
                  <div className="space-y-1.5 text-xs text-slate-700 flex-1">
                    <div>
                      <span className="text-slate-400 block">Ngân hàng thụ hưởng:</span>
                      <span className="font-bold text-indigo-900 text-sm">{payOSData.bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Số tài khoản:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">{payOSData.accountNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Tên chủ tài khoản:</span>
                      <span className="font-semibold text-slate-800 uppercase">{payOSData.accountName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Nội dung chuyển khoản:</span>
                      <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200 inline-block">
                        {payOSData.description}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">Số tiền cần chuyển:</span>
                  <span className="text-2xl font-black text-indigo-600">{fmtMoney(payOSData.amount)}</span>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => window.open(payOSData.checkoutUrl, '_blank')}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Mở trang thanh toán bảo mật PayOS
                  </button>

                  <button
                    onClick={handleVerifyPayOS}
                    disabled={isProcessing}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isProcessing ? 'Đang xác minh...' : 'Tôi đã chuyển khoản - Xác minh ngay'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-3">
                <p className="text-sm text-slate-600">Thanh toán hóa đơn qua ngân hàng hoặc ví điện tử.</p>
                <button
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                >
                  Xác nhận thanh toán trực tiếp
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
