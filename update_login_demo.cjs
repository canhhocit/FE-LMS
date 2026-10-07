const fs = require('fs');

const loginPath = 'src/pages/Login.tsx';
let loginContent = fs.readFileSync(loginPath, 'utf8');

const demoAccountsRegex = /const DEMO_ACCOUNTS = \[\s*{\s*role: "Quản trị viên",\s*detail: "Toàn quyền hệ thống",\s*identifier: "admin@learninghub.edu.vn",\s*color: "primary",\s*},\s*{\s*role: "Giảng viên",\s*detail: "Quản lý lớp học và chấm điểm",\s*identifier: "gv.nguyenvana@learninghub.edu.vn",\s*color: "emerald",\s*},\s*{\s*role: "Sinh viên",\s*detail: "Học tập và theo dõi tiến độ",\s*identifier: "sv20240001@student.edu.vn",\s*color: "amber",\s*},\s*\];/;

const newDemoAccounts = `const DEMO_ACCOUNTS = [
  {
    role: "Quản trị viên",
    detail: "Toàn quyền hệ thống",
    identifier: "admin@learninghub.edu.vn",
    password: "password",
    color: "primary",
  },
  {
    role: "Giảng viên",
    detail: "Quản lý lớp học và chấm điểm",
    identifier: "gv.nguyenvana@learninghub.edu.vn",
    password: "password",
    color: "emerald",
  },
  {
    role: "Sinh viên",
    detail: "Học tập và theo dõi tiến độ",
    identifier: "sv20240001@student.edu.vn",
    password: "Sv@1234",
    color: "amber",
  },
];`;

loginContent = loginContent.replace(demoAccountsRegex, newDemoAccounts);

// Replace setValue('password', 'password'); with setValue('password', acc.password);
loginContent = loginContent.replace(/setValue\('password',\s*'password'\);/g, "setValue('password', acc.password);");

fs.writeFileSync(loginPath, loginContent);
console.log("Login.tsx updated");
