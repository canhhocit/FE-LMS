const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/RegistrationPeriods.tsx', 'utf8');

// 1. Add lucide icons
if (!content.includes('Settings,')) {
    content = content.replace('Trash2 } from \'lucide-react\'', 'Trash2, Settings, Plus, X } from \'lucide-react\'');
}

// 2. Add Clazz to types import if missing
if (!content.includes('Clazz')) {
    content = content.replace('import type { RegistrationPeriod } from \'../../types\';', 'import type { RegistrationPeriod, Clazz } from \'../../types\';');
}

// 3. Add states
const stateStr = `
  const [showClassesModal, setShowClassesModal] = useState<RegistrationPeriod | null>(null);
  const [periodClasses, setPeriodClasses] = useState<Clazz[]>([]);
  const [allClasses, setAllClasses] = useState<Clazz[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
`;
if (!content.includes('showClassesModal')) {
    content = content.replace('const [showForm, setShowForm] = useState(false);', `const [showForm, setShowForm] = useState(false);${stateStr}`);
}

// 4. Add handlers
const handlersStr = `
  const openClassesModal = async (period: RegistrationPeriod) => {
    setShowClassesModal(period);
    setLoadingClasses(true);
    setErr(null);
    try {
      const [pClasses, aClasses] = await Promise.all([
        registrationService.getPeriodClasses(period.id),
        // we can fetch all classes using a service if available, but let's assume we have it or can fetch from API directly
        import('../../services/api/client').then(m => m.unwrap(m.apiClient.get('/admin/classes')))
      ]);
      setPeriodClasses(pClasses);
      setAllClasses(aClasses);
    } catch (e: any) {
      setErr(e.message || 'Lỗi tải danh sách lớp');
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleAddClassToPeriod = async (clazzId: number) => {
    if (!showClassesModal) return;
    try {
      await registrationService.addClazzToPeriod(showClassesModal.id, clazzId);
      const updated = await registrationService.getPeriodClasses(showClassesModal.id);
      setPeriodClasses(updated);
      load(); // refresh main list to update count
    } catch (e: any) {
      alert(e.message || 'Lỗi thêm lớp');
    }
  };

  const handleRemoveClassFromPeriod = async (clazzId: number) => {
    if (!showClassesModal) return;
    try {
      await registrationService.removeClazzFromPeriod(showClassesModal.id, clazzId);
      const updated = await registrationService.getPeriodClasses(showClassesModal.id);
      setPeriodClasses(updated);
      load(); // refresh main list to update count
    } catch (e: any) {
      alert(e.message || 'Lỗi xóa lớp');
    }
  };
`;
if (!content.includes('openClassesModal')) {
    content = content.replace('  const validateForm = () => {', `${handlersStr}\n  const validateForm = () => {`);
}

// 5. Add button to Table
const oldTableBtn = `<Trash2 className="w-3.5 h-3.5 text-rose-600" /> Xóa
                          </Button>
                        </td>`;
const newTableBtn = `<Trash2 className="w-3.5 h-3.5 text-rose-600" /> Xóa
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => void openClassesModal(p)}>
                            <Settings className="w-3.5 h-3.5 text-indigo-600" /> Lớp HP
                          </Button>
                        </td>`;
if (content.includes(oldTableBtn)) {
    content = content.replace(oldTableBtn, newTableBtn);
}

// 6. Update Table Header
const oldTh = `<th className="text-right font-medium py-3 px-4 w-32">Thao tác</th>`;
const newTh = `<th className="text-center font-medium py-3 px-4">Số lớp</th>\n<th className="text-right font-medium py-3 px-4 w-44">Thao tác</th>`;
if (content.includes(oldTh)) {
    content = content.replace(oldTh, newTh);
}

// 7. Update Table Row (add cell for classCount)
const oldTdStatus = `<td className="py-3.5 px-4 text-center">
                          <Badge variant={p.isActive ? 'success' : 'neutral'}>
                            {p.isActive ? 'Mở đăng ký' : 'Đã khóa'}
                          </Badge>
                        </td>`;
const newTdStatus = `<td className="py-3.5 px-4 text-center">
                          <Badge variant={p.isActive ? 'success' : 'neutral'}>
                            {p.isActive ? 'Mở đăng ký' : 'Đã khóa'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-200">
                          {p.classCount ?? 0}
                        </td>`;
if (content.includes(oldTdStatus)) {
    content = content.replace(oldTdStatus, newTdStatus);
}

// 8. Add Modal JSX
const modalJsx = `
      {/* Classes Modal */}
      {showClassesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Quản lý lớp học phần: <span className="text-indigo-600">{showClassesModal.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowClassesModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {loadingClasses ? <Spinner /> : (
              <div className="flex-1 overflow-auto flex flex-col lg:flex-row gap-6 min-h-0">
                {/* Left: Available classes */}
                <div className="flex-1 border rounded-xl overflow-hidden flex flex-col">
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 font-semibold text-sm border-b">Tất cả lớp học phần</div>
                  <div className="flex-1 overflow-auto p-2 space-y-2">
                    {allClasses.filter(c => !periodClasses.find(pc => pc.id === c.id)).map(c => (
                      <div key={c.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded border">
                        <div className="text-sm">
                          <div className="font-bold">{c.classCode}</div>
                          <div className="text-xs text-slate-500">{c.className}</div>
                        </div>
                        <Button size="sm" onClick={() => handleAddClassToPeriod(c.id)}>Thêm</Button>
                      </div>
                    ))}
                    {allClasses.filter(c => !periodClasses.find(pc => pc.id === c.id)).length === 0 && (
                      <div className="p-4 text-center text-sm text-slate-500">Không còn lớp nào để thêm</div>
                    )}
                  </div>
                </div>

                {/* Right: Added classes */}
                <div className="flex-1 border rounded-xl overflow-hidden flex flex-col">
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 font-semibold text-sm border-b">Đã chọn ({periodClasses.length})</div>
                  <div className="flex-1 overflow-auto p-2 space-y-2">
                    {periodClasses.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded border border-indigo-100 dark:border-indigo-900/50">
                        <div className="text-sm">
                          <div className="font-bold text-indigo-700 dark:text-indigo-400">{c.classCode}</div>
                          <div className="text-xs text-slate-500">{c.className}</div>
                        </div>
                        <Button variant="danger" size="sm" onClick={() => handleRemoveClassFromPeriod(c.id)}>Xóa</Button>
                      </div>
                    ))}
                    {periodClasses.length === 0 && (
                      <div className="p-4 text-center text-sm text-slate-500">Chưa có lớp nào trong đợt này</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
`;
if (!content.includes('Classes Modal')) {
    content = content.replace('    </div>\n  );\n}', `${modalJsx}    </div>\n  );\n}`);
}

fs.writeFileSync('src/pages/admin/RegistrationPeriods.tsx', content);
