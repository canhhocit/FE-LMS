const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/Curricula.tsx', 'utf8');

// 1. Import the service
const importService = `import { getGradingPolicy, updateGradingPolicy, type GradingPolicy } from '../../services/gradingPolicyService';`;
if (!content.includes('getGradingPolicy')) {
    content = content.replace(`import { getCurricula`, importService + `\nimport { getCurricula`);
}

// 2. Add state
const stateBlock = `
  // Grading Policy state
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [selectedPolicyCurr, setSelectedPolicyCurr] = useState<Curriculum | null>(null);
  const [gradingPolicyForm, setGradingPolicyForm] = useState({
    attendanceWeight: 0,
    midtermWeight: 0.4,
    finalWeight: 0.6,
  });
  const [loadingPolicy, setLoadingPolicy] = useState(false);
`;
if (!content.includes('const [showGradingModal')) {
    content = content.replace('// Initial Load', stateBlock + '\n  // Initial Load');
}

// 3. Add handler functions
const handlerBlock = `
  const handleOpenGradingPolicy = async (curr: Curriculum) => {
    setSelectedPolicyCurr(curr);
    setShowGradingModal(true);
    setLoadingPolicy(true);
    try {
      const p = await getGradingPolicy(curr.id);
      setGradingPolicyForm({
        attendanceWeight: p.attendanceWeight,
        midtermWeight: p.midtermWeight,
        finalWeight: p.finalWeight,
      });
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // Fallback default
        setGradingPolicyForm({ attendanceWeight: 0, midtermWeight: 0.4, finalWeight: 0.6 });
      } else {
        setErr(err.message || 'Lỗi tải grading policy');
      }
    } finally {
      setLoadingPolicy(false);
    }
  };

  const handleSaveGradingPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicyCurr) return;
    const { attendanceWeight, midtermWeight, finalWeight } = gradingPolicyForm;
    const sum = Number(attendanceWeight) + Number(midtermWeight) + Number(finalWeight);
    if (Math.abs(sum - 1.0) > 0.001) {
      setErr('Tổng các trọng số phải bằng 1.0 (VD: 0.1 + 0.3 + 0.6)');
      return;
    }
    setSubmittingCurr(true);
    setErr(null);
    try {
      await updateGradingPolicy(selectedPolicyCurr.id, { 
        attendanceWeight: Number(attendanceWeight), 
        midtermWeight: Number(midtermWeight), 
        finalWeight: Number(finalWeight) 
      });
      setShowGradingModal(false);
    } catch (err: any) {
      setErr(err.message || 'Lỗi cập nhật trọng số');
    } finally {
      setSubmittingCurr(false);
    }
  };
`;
if (!content.includes('handleOpenGradingPolicy')) {
    content = content.replace('const handleCreateCourse = () => {', handlerBlock + '\n  const handleCreateCourse = () => {');
}

// 4. Add action button to the curriculum card.
// Need to find where the curriculum buttons are.
// I'll search for 'onClick={() => handleEditCurr(cu)}'
const oldButtons = `<button
                            type="button"
                            onClick={() => handleEditCurr(cu)}
                            className="p-1 text-slate-400 hover:text-indigo-600 transition"
                            title="Chỉnh sửa CTĐT"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>`;
const newButtons = `<button
                            type="button"
                            onClick={() => handleOpenGradingPolicy(cu)}
                            className="p-1 text-slate-400 hover:text-amber-600 transition"
                            title="Cấu hình trọng số điểm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                          </button>\n                          ` + oldButtons;
if (content.includes(oldButtons)) {
    content = content.replace(oldButtons, newButtons);
}

// 5. Add Modal JSX
const modalJsx = `
        {/* Grading Policy Modal */}
        {showGradingModal && selectedPolicyCurr && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  Cấu hình trọng số điểm: <span className="text-amber-600">{selectedPolicyCurr.name}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGradingModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold"
                >
                  &times;
                </button>
              </div>
  
              {loadingPolicy ? (
                <Spinner />
              ) : (
                <form onSubmit={handleSaveGradingPolicy} className="mt-4 space-y-4">
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 mb-4">
                    Lưu ý: Tổng của các trọng số phải luôn luôn bằng 1.0 (ví dụ: Chuyên cần 0.1, Giữa kỳ 0.3, Cuối kỳ 0.6)
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Trọng số chuyên cần (0.0 - 1.0)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0" max="1"
                      required
                      value={gradingPolicyForm.attendanceWeight}
                      onChange={(e) => setGradingPolicyForm({ ...gradingPolicyForm, attendanceWeight: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Trọng số giữa kỳ (0.0 - 1.0)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0" max="1"
                      required
                      value={gradingPolicyForm.midtermWeight}
                      onChange={(e) => setGradingPolicyForm({ ...gradingPolicyForm, midtermWeight: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Trọng số cuối kỳ (0.0 - 1.0)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0" max="1"
                      required
                      value={gradingPolicyForm.finalWeight}
                      onChange={(e) => setGradingPolicyForm({ ...gradingPolicyForm, finalWeight: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                    />
                  </div>
  
                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setShowGradingModal(false)}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={submittingCurr}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {submittingCurr ? 'Đang lưu...' : 'Lưu cấu hình'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
`;
// Insert right before final `</div>` or near another modal.
if (!content.includes('Cấu hình trọng số điểm:')) {
    const attachPoint = `{/* Curriculum Modal */}`;
    content = content.replace(attachPoint, modalJsx + '\n        ' + attachPoint);
}

fs.writeFileSync('src/pages/admin/Curricula.tsx', content);
console.log('done Curricula');
