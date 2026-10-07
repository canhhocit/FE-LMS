const fs = require('fs');
let content = fs.readFileSync('src/pages/student/Registrations.tsx', 'utf8');

const badSyntax = `          ) : (
            {selectedClassIds.length > 0 && (`;
            
const goodSyntax = `          ) : (
            <>
              {selectedClassIds.length > 0 && (`;

if (content.includes(badSyntax)) {
    content = content.replace(badSyntax, goodSyntax);
    // Also we need to close the fragment after the Table
    // Let's find the closing tag for Table
    const tableCloseStr = `            </Table>\n          )}`;
    const newTableCloseStr = `            </Table>\n            </>\n          )}`;
    
    if (content.includes(tableCloseStr)) {
        content = content.replace(tableCloseStr, newTableCloseStr);
    }
    
    fs.writeFileSync('src/pages/student/Registrations.tsx', content);
    console.log("Fixed JSX syntax in Registrations.tsx!");
} else {
    console.log("Could not find bad syntax.");
}
