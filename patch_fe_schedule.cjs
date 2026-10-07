const fs = require('fs');
let content = fs.readFileSync('src/services/scheduleService.ts', 'utf8');

if (!content.includes('getAllAdminSchedules')) {
    content += `\nexport const getAllAdminSchedules = async (): Promise<Schedule[]> => unwrap<Schedule[]>(apiClient.get('/admin/schedules')).then((items) => items.map(normalizeSchedule));\n`;
    fs.writeFileSync('src/services/scheduleService.ts', content);
}
