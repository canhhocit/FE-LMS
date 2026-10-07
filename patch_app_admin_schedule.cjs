const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('AdminSchedules')) {
    content = content.replace(
        'const RegistrationPeriods = lazy(() => import(\'./pages/admin/RegistrationPeriods\'));',
        'const RegistrationPeriods = lazy(() => import(\'./pages/admin/RegistrationPeriods\'));\nconst AdminSchedules = lazy(() => import(\'./pages/admin/Schedules\'));'
    );
    
    content = content.replace(
        '<Route path="/admin/schedule" element={<Navigate to="/admin/classes" replace />} />',
        '<Route path="/admin/schedule" element={<ProtectedRoute requiredPermission="MANAGE_REGISTRATION"><AdminSchedules /></ProtectedRoute>} />'
    );
    
    fs.writeFileSync('src/App.tsx', content);
}
