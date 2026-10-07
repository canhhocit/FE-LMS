const fs = require('fs');
let content = fs.readFileSync('src/services/registrationService.ts', 'utf8');

if (!content.includes('batchRegisterClass')) {
    content = content.replace(
        'export const registerClass = async (clazzId: number): Promise<void> => { await apiClient.post(`/registration/${clazzId}`); };',
        'export const registerClass = async (clazzId: number): Promise<void> => { await apiClient.post(`/registration/${clazzId}`); };\nexport const batchRegisterClass = async (clazzIds: number[]): Promise<void> => { await apiClient.post(`/registration/batch`, clazzIds); };'
    );
    fs.writeFileSync('src/services/registrationService.ts', content);
}
