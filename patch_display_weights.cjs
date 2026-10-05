const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/Curricula.tsx', 'utf8');

// 1. Add gradingPolicies state
const stateBlock = `  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [gradingPolicies, setGradingPolicies] = useState<Record<number, GradingPolicy>>({});`;
if (!content.includes('const [gradingPolicies, setGradingPolicies]')) {
    content = content.replace('  const [loadingPolicy, setLoadingPolicy] = useState(false);', stateBlock);
}

// 2. Update useEffect to fetch policies
const oldUseEffect = `    Promise.all([
      curriculumService.getCurricula(),
      curriculumService.getAllCourses(),
      getDepartments().catch(() => []),
    ])
      .then(([cuList, coList, depList]) => {
        if (!mounted) return;
        setCurricula(cuList);
        setCourses(coList);
        setDepartments(depList);
        if (cuList.length > 0) {
          setSelectedCurriculum(cuList[0]);
        }
      })`;
const newUseEffect = `    Promise.all([
      curriculumService.getCurricula(),
      curriculumService.getAllCourses(),
      getDepartments().catch(() => []),
    ])
      .then(async ([cuList, coList, depList]) => {
        if (!mounted) return;
        setCurricula(cuList);
        setCourses(coList);
        setDepartments(depList);
        if (cuList.length > 0) {
          setSelectedCurriculum(cuList[0]);
        }
        
        // Fetch grading policies for all curricula
        const policies: Record<number, GradingPolicy> = {};
        await Promise.all(
          cuList.map((c) =>
            getGradingPolicy(c.id)
              .then((p) => {
                policies[c.id] = p;
              })
              .catch(() => {})
          )
        );
        if (mounted) setGradingPolicies(policies);
      })`;
if (content.includes(oldUseEffect)) {
    content = content.replace(oldUseEffect, newUseEffect);
}

// 3. Update handleSaveGradingPolicy to update local state
const oldSaveSuccess = `      await updateGradingPolicy(selectedPolicyCurr.id, { 
        attendanceWeight: Number(attendanceWeight), 
        midtermWeight: Number(midtermWeight), 
        finalWeight: Number(finalWeight) 
      });
      setShowGradingModal(false);`;
const newSaveSuccess = `      const updatedPolicy = await updateGradingPolicy(selectedPolicyCurr.id, { 
        attendanceWeight: Number(attendanceWeight), 
        midtermWeight: Number(midtermWeight), 
        finalWeight: Number(finalWeight) 
      });
      setGradingPolicies(prev => ({
        ...prev,
        [selectedPolicyCurr.id]: updatedPolicy
      }));
      setShowGradingModal(false);`;
if (content.includes(oldSaveSuccess)) {
    content = content.replace(oldSaveSuccess, newSaveSuccess);
}

// 4. Update the render line
const oldRender = `{cu.faculty || 'Chưa xếp Khoa'} · {cu.academicYear || 'Toàn khóa'}`;
const newRender = `{cu.faculty || 'Chưa xếp Khoa'} · {cu.academicYear || 'Toàn khóa'}
                          {gradingPolicies[cu.id] && (
                            <span className="ml-1 text-amber-600 dark:text-amber-500 font-medium">
                              · Trọng số: {gradingPolicies[cu.id].attendanceWeight * 100}-{gradingPolicies[cu.id].midtermWeight * 100}-{gradingPolicies[cu.id].finalWeight * 100}
                            </span>
                          )}`;
// We only want to replace it in the `activeTab === 'CURRICULA'` list mapping. Let's make sure it replaces the right one.
// There is only one occurrence of this exact string in Curricula.tsx.
if (content.includes(oldRender)) {
    content = content.replace(oldRender, newRender);
}

fs.writeFileSync('src/pages/admin/Curricula.tsx', content);
console.log('done updating Curricula.tsx');
