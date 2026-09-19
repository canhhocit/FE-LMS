import React, { useState } from 'react';
import { AlertTriangle, BookOpen, ShieldAlert, X, ChevronRight } from 'lucide-react';

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
    <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/70 p-4 shadow-2xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-600 text-white tracking-wide">
                CẢNH BÁO HỌC VỤ LẦN 1
              </span>
              <span className="text-xs font-mono text-rose-800 dark:text-rose-300 font-semibold">
                MSV: {studentCode}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1.5">
              Cảnh báo tự động: Số tín chỉ nợ vượt ngưỡng quy định ({debtCredits}/{maxAllowedCredits} tín chỉ)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Xin chào <strong className="text-slate-900 dark:text-white">{studentName}</strong>, hệ thống ghi nhận bạn đang nợ <strong className="text-rose-700 dark:text-rose-400 font-semibold">{debtCredits} tín chỉ</strong> (vượt ngưỡng cho phép tối đa là {maxAllowedCredits} tín chỉ). Vui lòng lập kế hoạch học bù và đăng ký học lại sớm nhất.
            </p>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition cursor-pointer shrink-0"
          title="Ẩn thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Expandable Remediation Section */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-rose-200/80 dark:border-rose-900/60 space-y-2 text-xs">
          <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-rose-100 dark:border-rose-900/40">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1.5 text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600" /> Hướng dẫn Quy trình Khắc phục Cảnh báo Học vụ:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
              <li>Đăng ký lại các học phần điểm F/D trong đợt mở đăng ký học phần bổ sung.</li>
              <li>Gặp trực tiếp Giáo viên Chủ nhiệm (GVCN) để được tư vấn lộ trình học tập.</li>
              <li>Nếu tiếp tục nợ tín chỉ ở kỳ kế tiếp, sinh viên sẽ chuyển sang <strong className="text-rose-700 font-semibold">Cảnh báo Học vụ Lần 2 (Buộc thôi học)</strong>.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-2.5 py-1 text-xs font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 rounded transition cursor-pointer flex items-center gap-1"
        >
          <BookOpen className="w-3.5 h-3.5" />
          {showDetails ? 'Thu gọn chi tiết' : 'Xem quy định & Hướng dẫn xử lý'}
        </button>

        {onViewRemediationPlan && (
          <button
            onClick={onViewRemediationPlan}
            className="ml-auto px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition cursor-pointer flex items-center gap-1"
          >
            Đăng ký học bù ngay <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
