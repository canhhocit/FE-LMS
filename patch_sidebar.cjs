const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

if (!content.includes('/admin/schedule')) {
    content = content.replace(
        '{ to: "/admin/classes", label: "Lớp học phần", icon: BookOpen, permission: "MANAGE_REGISTRATION" },',
        '{ to: "/admin/classes", label: "Lớp học phần", icon: BookOpen, permission: "MANAGE_REGISTRATION" },\n        { to: "/admin/schedule", label: "Thời khóa biểu", icon: Calendar, permission: "MANAGE_REGISTRATION" },'
    );
    fs.writeFileSync('src/components/Layout.tsx', content);
}
