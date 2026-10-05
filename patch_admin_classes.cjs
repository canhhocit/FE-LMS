const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/index.tsx', 'utf8');

// 1. Update initial states
const oldEditForm = `    const [editForm, setEditForm] = useState({
      classCode: '',
      className: '',
      courseId: '',
      lecturerId: '',
      maxStudents: '50',
      semester: 'HK1',
      academicYear: '2026-2027',
    });`;
const newEditForm = `    const [editForm, setEditForm] = useState({
      classCode: '',
      className: '',
      courseId: '',
      lecturerId: '',
      maxStudents: '50',
      semester: 'HK1',
      academicYear: '2026-2027',
      startDate: '',
      endDate: '',
      examDate: '',
      examRoom: '',
      examFormat: '',
      examDuration: '',
    });`;
if (content.includes(oldEditForm)) {
    content = content.replace(oldEditForm, newEditForm);
}

const oldForm = `    const [form, setForm] = useState({
      classCode: '',
      className: '',
      courseId: '',
      lecturerId: '',
      maxStudents: '50',
      semester: 'HK1',
      academicYear: '2026-2027',
    });`;
const newForm = `    const [form, setForm] = useState({
      classCode: '',
      className: '',
      courseId: '',
      lecturerId: '',
      maxStudents: '50',
      semester: 'HK1',
      academicYear: '2026-2027',
      startDate: '',
      endDate: '',
      examDate: '',
      examRoom: '',
      examFormat: '',
      examDuration: '',
    });`;
if (content.includes(oldForm)) {
    content = content.replace(oldForm, newForm);
}

// 2. Update setEditForm when editing
const oldSetEditForm = `      setEditForm({
        classCode: c.classCode,
        className: c.className,
        courseId: String(c.courseId || ''),
        lecturerId: c.lecturerId ? String(c.lecturerId) : '',
        maxStudents: String(c.maxStudents ?? 50),
        semester: c.semester || 'HK1',
        academicYear: c.academicYear || '2026-2027',
      });`;
const newSetEditForm = `      setEditForm({
        classCode: c.classCode,
        className: c.className,
        courseId: String(c.courseId || ''),
        lecturerId: c.lecturerId ? String(c.lecturerId) : '',
        maxStudents: String(c.maxStudents ?? 50),
        semester: c.semester || 'HK1',
        academicYear: c.academicYear || '2026-2027',
        startDate: c.startDate || '',
        endDate: c.endDate || '',
        examDate: c.examDate ? c.examDate.substring(0, 16) : '',
        examRoom: c.examRoom || '',
        examFormat: c.examFormat || '',
        examDuration: c.examDuration ? String(c.examDuration) : '',
      });`;
if (content.includes(oldSetEditForm)) {
    content = content.replace(oldSetEditForm, newSetEditForm);
}

// 3. Update updateClazz call
const oldUpdateCall = `          maxStudents: maxStuds,
          semester: editForm.semester,
          academicYear: editForm.academicYear,
        });`;
const newUpdateCall = `          maxStudents: maxStuds,
          semester: editForm.semester,
          academicYear: editForm.academicYear,
          startDate: editForm.startDate || undefined,
          endDate: editForm.endDate || undefined,
          examDate: editForm.examDate ? editForm.examDate + ':00' : undefined,
          examRoom: editForm.examRoom || undefined,
          examFormat: editForm.examFormat || undefined,
          examDuration: editForm.examDuration ? Number(editForm.examDuration) : undefined,
        });`;
if (content.includes(oldUpdateCall)) {
    content = content.replace(oldUpdateCall, newUpdateCall);
}

// 4. Update createClazz call
const oldCreateCall = `          semester: form.semester,
          academicYear: form.academicYear,
          createdAt: new Date().toISOString(),
        });`;
const newCreateCall = `          semester: form.semester,
          academicYear: form.academicYear,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          examDate: form.examDate ? form.examDate + ':00' : undefined,
          examRoom: form.examRoom || undefined,
          examFormat: form.examFormat || undefined,
          examDuration: form.examDuration ? Number(form.examDuration) : undefined,
          createdAt: new Date().toISOString(),
        });`;
if (content.includes(oldCreateCall)) {
    content = content.replace(oldCreateCall, newCreateCall);
}

// 5. Update reset form
const oldResetForm = `        setForm({
          classCode: '',
          className: '',
          courseId: '',
          lecturerId: '',
          maxStudents: '50',
          semester: 'HK1',
          academicYear: '2026-2027',
        });`;
const newResetForm = `        setForm({
          classCode: '',
          className: '',
          courseId: '',
          lecturerId: '',
          maxStudents: '50',
          semester: 'HK1',
          academicYear: '2026-2027',
          startDate: '',
          endDate: '',
          examDate: '',
          examRoom: '',
          examFormat: '',
          examDuration: '',
        });`;
if (content.includes(oldResetForm)) {
    content = content.replace(oldResetForm, newResetForm);
}

// 6. Update UI forms
// I will just append the new fields at the end of the form grid.
const newUIFields = (formVar, setFormVar) => `
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngày bắt đầu</label>
                <Input type="date" value={${formVar}.startDate} onChange={(e) => ${setFormVar}({ ...${formVar}, startDate: e.target.value })} />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngày kết thúc</label>
                <Input type="date" value={${formVar}.endDate} onChange={(e) => ${setFormVar}({ ...${formVar}, endDate: e.target.value })} />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Ngày/Giờ thi</label>
                <Input type="datetime-local" value={${formVar}.examDate} onChange={(e) => ${setFormVar}({ ...${formVar}, examDate: e.target.value })} />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phòng thi</label>
                <Input placeholder="VD: P.101" value={${formVar}.examRoom} onChange={(e) => ${setFormVar}({ ...${formVar}, examRoom: e.target.value })} />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Hình thức thi</label>
                <select 
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
                  value={${formVar}.examFormat} onChange={(e) => ${setFormVar}({ ...${formVar}, examFormat: e.target.value })}>
                  <option value="">-- Chọn hình thức --</option>
                  <option value="Trắc nghiệm">Trắc nghiệm</option>
                  <option value="Tự luận">Tự luận</option>
                  <option value="Vấn đáp">Vấn đáp</option>
                  <option value="Thực hành">Thực hành</option>
                  <option value="Đồ án">Đồ án</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">T.Gian làm bài (Phút)</label>
                <Input type="number" placeholder="VD: 90" value={${formVar}.examDuration} onChange={(e) => ${setFormVar}({ ...${formVar}, examDuration: e.target.value })} />
              </div>
`;

// Insert after the grid end for editing
const editGridEnd = `onChange={(e) => setEditForm({ ...editForm, maxStudents: e.target.value })}
                />
              </div>
            </div>`;
if (content.includes(editGridEnd)) {
    content = content.replace(editGridEnd, `onChange={(e) => setEditForm({ ...editForm, maxStudents: e.target.value })}
                />
              </div>${newUIFields('editForm', 'setEditForm')}
            </div>`);
}

// Insert after the grid end for creating
const createGridEnd = `onChange={(e) => setForm({ ...form, maxStudents: e.target.value })}
                />
              </div>
            </div>`;
// There are two matches potentially, one for edit, one for create.
// Since we already replaced the edit one, let's find the create one.
if (content.includes(createGridEnd)) {
    content = content.replace(createGridEnd, `onChange={(e) => setForm({ ...form, maxStudents: e.target.value })}
                />
              </div>${newUIFields('form', 'setForm')}
            </div>`);
}

fs.writeFileSync('src/pages/admin/index.tsx', content);
console.log('done pages/admin/index.tsx');
