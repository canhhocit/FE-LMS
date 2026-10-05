const fs = require('fs');

let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// 1. Add state isCollapsed
if (!content.includes('const [isCollapsed, setIsCollapsed] = useState(false);')) {
    content = content.replace(
        'const [sidebarOpen, setSidebarOpen] = useState(false);',
        'const [sidebarOpen, setSidebarOpen] = useState(false);\n  const [isCollapsed, setIsCollapsed] = useState(false);'
    );
}

// 2. Change <aside> classes
const asideStart = content.indexOf('<aside');
const classEnd = content.indexOf('}`}');
if (asideStart !== -1 && classEnd !== -1) {
    const oldClassStr = '`fixed inset-y-0 left-0 z-40 flex h-full w-64 shrink-0 flex-col border-r border-slate-200/90 bg-white p-4 text-slate-800 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 lg:static lg:h-screen lg:translate-x-0 lg:shadow-none transition-transform duration-200 ${\n          sidebarOpen ? "translate-x-0" : "-translate-x-full"\n        }`';
    const newClassStr = '`fixed inset-y-0 left-0 z-40 flex h-full shrink-0 flex-col border-r border-slate-200/90 bg-white p-4 text-slate-800 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 lg:static lg:h-screen lg:translate-x-0 lg:shadow-none transition-all duration-300 ${\n          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"\n        } ${isCollapsed ? "lg:w-[4.5rem] lg:px-2 lg:items-center" : "lg:w-64"}`';
    if (content.includes(oldClassStr)) {
        content = content.replace(oldClassStr, newClassStr);
    } else {
        // Fallback replacement if exact match fails
        content = content.replace(
            'lg:shadow-none transition-transform duration-200 ${',
            'lg:shadow-none transition-all duration-300 ${'
        ).replace(
            'sidebarOpen ? "translate-x-0" : "-translate-x-full"\n        }`',
            'sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"\n        } ${isCollapsed ? "lg:w-[4.5rem] lg:px-2 lg:items-center" : "lg:w-64"}`'
        ).replace(
            'h-full w-64 shrink-0',
            'h-full shrink-0'
        );
    }
}

// 3. Update Brand Header
content = content.replace(
    '<div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 pt-1 px-1">',
    '<div className={`flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 pt-1 ${isCollapsed ? "px-0 justify-center w-full" : "px-1 w-full"}`}>'
);
content = content.replace(
    '<div>\n              <div className="font-bold tracking-tight',
    '<div className={`${isCollapsed ? "hidden lg:hidden" : "block"}`}>\n              <div className="font-bold tracking-tight'
);

// 4. Update section button (Toggle Section)
content = content.replace(
    'className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer"',
    'className={`flex w-full items-center justify-between py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer ${isCollapsed ? "px-0 justify-center h-0 opacity-0 overflow-hidden" : "px-2"}`}'
);

content = content.replace(
    '<span>{section.title}</span>',
    '<span className={isCollapsed ? "hidden" : "block"}>{section.title}</span>'
);

content = content.replace(
    'isSectionOpen ? "" : "-rotate-90"\n                    }`}',
    'isSectionOpen ? "" : "-rotate-90"\n                    } ${isCollapsed ? "hidden" : "block"}`}'
);

// 5. Update NavLink
content = content.replace(
    'className={({ isActive }) =>\n                            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${\n                              isActive\n                                ? "bg-primary-600 text-white shadow-2xs"\n                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"\n                            }`\n                          }',
    'className={({ isActive }) =>\n                            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${isCollapsed ? "justify-center px-0 w-full" : ""} ${\n                              isActive\n                                ? "bg-primary-600 text-white shadow-2xs"\n                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"\n                            }`\n                          }\n                          title={isCollapsed ? it.label : undefined}'
);

content = content.replace(
    '<span className="truncate">{it.label}</span>',
    '<span className={`truncate ${isCollapsed ? "hidden" : "block"}`}>{it.label}</span>'
);

// Fix Notifications badge
content = content.replace(
    '{it.to.includes("/notifications") && unreadCount > 0 && (\n                            <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">\n                              {unreadCount > 99 ? "99+" : unreadCount}\n                            </span>\n                          )}',
    '{it.to.includes("/notifications") && unreadCount > 0 && (\n                            <span className={isCollapsed ? "absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500" : "ml-auto inline-flex items-center justify-center px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold"}>\n                              {!isCollapsed && (unreadCount > 99 ? "99+" : unreadCount)}\n                            </span>\n                          )}'
);

// Wrap icon in relative div if we are adding absolute badge
content = content.replace(
    '<IconComponent className="h-4 w-4 shrink-0" />',
    '<div className="relative flex items-center justify-center">\n                            <IconComponent className="h-4 w-4 shrink-0" />\n                          </div>'
);
// But wait, the absolute badge needs to be inside the relative div? 
// Let's just put relative on the NavLink.
content = content.replace(
    'className={({ isActive }) =>\n                            `flex',
    'className={({ isActive }) =>\n                            `relative flex'
);

// 6. Update Sidebar Footer button
content = content.replace(
    'className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition w-full cursor-pointer"',
    'className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition w-full cursor-pointer ${isCollapsed ? "justify-center px-0" : ""}`}\n            title={isCollapsed ? "Đăng xuất" : undefined}'
);
content = content.replace(
    '<span>Đăng xuất</span>',
    '<span className={isCollapsed ? "hidden" : "block"}>Đăng xuất</span>'
);

// 7. Change Header Menu Button
content = content.replace(
    'onClick={() => setSidebarOpen(true)}\n                className="p-1.5 lg:hidden text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg cursor-pointer"',
    'onClick={() => { if (window.innerWidth >= 1024) { setIsCollapsed(prev => !prev); } else { setSidebarOpen(true); } }}\n                className="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg cursor-pointer"'
);

fs.writeFileSync('src/components/Layout.tsx', content);
console.log('done');
