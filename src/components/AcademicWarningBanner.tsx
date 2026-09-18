import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, BookOpen, ShieldAlert, X, ChevronRight } from 'lucide-react';

interface AcademicWarningProps {
  studentName?: string;
  studentCode?: string;
  debtCredits?: number;
  maxAllowedCredits?: number;
  onViewRemediationPlan?: () => void;
}

export const AcademicWarningBanner: React.FC<AcademicWarningProps> = ({
  studentName = 'Sinh viên',
  studentCode = '74DCTT22099',
  debtCredits = 12,
  maxAllowedCredits = 10,
  onViewRemediationPlan,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (dismissed || debtCredits <= maxAllowedCredits) {
    return null;
  }

  return (
    <div className="mb-6 rounded-2xl bg-linear-to-r from-amber-500/10 via-rose-500/10 to-red-500/10 border-2 border-rose-500/30 p-4 shadow-lg relative overflow-hidden backdrop-blur-md">
      {/* Background Glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0 animate-bounce">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white shadow-xs tracking-wide">
                ⚠️ CẢNH BÁO HỌC VỤ LẦN 1
              </span>
              <span className="text-xs font-mono text-rose-700 dark:text-rose-300 font-semibold">
                MSV: {studentCode}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
              Cảnh báo tự động: Số tín chỉ nợ vượt ngưỡng cho phép ({debtCredits}/{maxAllowedCredits} tín chỉ)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Xin chào <strong className="text-slate-900 dark:text-white">{studentName}</strong>, hệ thống tự động ghi nhận bạn đang nợ <strong className="text-rose-600 dark:text-rose-400">{debtCredits} tín chỉ</strong> (vượt ngưỡng quy định tối đa là {maxAllowedCredits} tín chỉ theo quy chế niên khóa). Bạn cần lập kế hoạch học bù và đăng ký học lại sớm nhất!
            </p>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer shrink-0"
          title="Ẩn thông báo tạm thời"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Expandable Remediation Section */}
      {showDetails && (
        <div className="mt-4 pt-3 border-t border-rose-200 dark:border-rose-900/50 space-y-2 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="p-3 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-rose-100 dark:border-rose-900/30">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1 text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-500" /> Hướng dẫn Quy trình Khắc phục Cảnh báo Học vụ:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
              <li>Đăng ký lại các học phần điểm F/D trong đợt mở đăng ký học phần bổ sung.</li>
              <li>Gặp trực tiếp Giáo viên Chủ nhiệm (GVCN) để tư vấn lộ trình học tập cá nhân hóa.</li>
              <li>Nếu tiếp tục nợ tín chỉ ở kỳ kế tiếp, sinh viên sẽ chuyển sang <strong className="text-rose-600">Cảnh báo Học vụ Lần 2 (Buộc thôi học)</strong>.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-500/10 rounded-lg transition cursor-pointer flex items-center gap-1"
        >
          <BookOpen className="w-3.5 h-3.5" />
          {showDetails ? 'Thu gọn chi tiết' : 'Xem quy định & Hướng dẫn xử lý'}
        </button>

        {onViewRemediationPlan && (
          <button
            onClick={onViewRemediationPlan}
            className="ml-auto px-3.5 py-1.5 text-xs font-bold text-white bg-linear-to-r from-rose-600 to-red-600 hover:brightness-110 rounded-xl shadow transition cursor-pointer flex items-center gap-1"
          >
            Đăng ký học bù ngay <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
