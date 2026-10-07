const fs = require('fs');
let content = fs.readFileSync('src/pages/student/Registrations.tsx', 'utf8');

if (!content.includes('selectedClassIds')) {
    // 1. Add states
    content = content.replace(
        'const [successMsg, setSuccessMsg] = useState<string | null>(null);',
        'const [successMsg, setSuccessMsg] = useState<string | null>(null);\n  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);\n  const [isBatchRegistering, setIsBatchRegistering] = useState(false);'
    );

    // 2. Add handleBatchRegister
    content = content.replace(
        'const handleRegister = async',
        `const handleBatchRegister = async () => {
    if (selectedClassIds.length === 0) return;
    setIsBatchRegistering(true);
    setErr(null);
    setSuccessMsg(null);
    try {
      await (registrationService as any).batchRegisterClass(selectedClassIds);
      setSuccessMsg(\`Đăng ký thành công \${selectedClassIds.length} lớp học phần!\`);
      setSelectedClassIds([]);
      loadData();
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? 'Đăng ký thất bại';
      setErr(msg);
    } finally {
      setIsBatchRegistering(false);
    }
  };

  const handleRegister = async`
    );

    // 3. Add Top Bar & Checkboxes
    content = content.replace(
        `<Table headers={['Mã lớp HP', 'Tên lớp HP', 'Môn học', 'Giảng viên', 'Sĩ số', 'Học kỳ', 'Đăng ký']}>`,
        `{selectedClassIds.length > 0 && (
              <div className="mb-4 flex items-center justify-between bg-accent-50/50 dark:bg-accent-900/20 p-3 rounded-lg border border-accent-200 dark:border-accent-800">
                <span className="text-sm text-accent-700 dark:text-accent-300 font-medium">Đã chọn {selectedClassIds.length} lớp</span>
                <Button variant="primary" onClick={handleBatchRegister} disabled={isBatchRegistering}>
                   {isBatchRegistering ? <Spinner size="sm"/> : 'Đăng ký các môn đã chọn'}
                </Button>
              </div>
            )}
            <Table headers={['Chọn', 'Mã lớp HP', 'Tên lớp HP', 'Môn học', 'Giảng viên', 'Sĩ số', 'Học kỳ', 'Đăng ký']}>`
    );

    content = content.replace(
        `<td className="px-4 py-3 font-mono font-bold text-accent-600 dark:text-accent-400 text-xs">{c.classCode}</td>`,
        `<td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-300 text-accent-600 focus:ring-accent-500"
                          disabled={isFull || !isPeriodOpen}
                          checked={selectedClassIds.includes(c.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedClassIds(prev => [...prev, c.id]);
                            else setSelectedClassIds(prev => prev.filter(id => id !== c.id));
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-accent-600 dark:text-accent-400 text-xs">{c.classCode}</td>`
    );
    
    fs.writeFileSync('src/pages/student/Registrations.tsx', content);
}
