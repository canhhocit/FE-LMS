const fs = require('fs');

// 1. Fix Schedules.tsx
const schedulesFile = 'src/pages/admin/Schedules.tsx';
if (fs.existsSync(schedulesFile)) {
    let content = fs.readFileSync(schedulesFile, 'utf8');
    content = content.replace('description="Xem thời khóa biểu', 'subtitle="Xem thời khóa biểu');
    fs.writeFileSync(schedulesFile, content);
}

// 2. Fix Registrations.tsx
const regFile = 'src/pages/student/Registrations.tsx';
if (fs.existsSync(regFile)) {
    let content = fs.readFileSync(regFile, 'utf8');
    // Replace size="sm" with className="w-4 h-4" or remove it if it's on an icon that doesn't accept size.
    // Let's check what element has size="sm"
    // In Registrations.tsx line 212
    const lines = content.split('\n');
    if (lines.length > 211) {
        lines[211] = lines[211].replace('size="sm"', 'className="w-4 h-4"');
    }
    fs.writeFileSync(regFile, lines.join('\n'));
}

console.log("FE Patched");
