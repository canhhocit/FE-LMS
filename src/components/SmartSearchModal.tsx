import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, User, GraduationCap, Home, Key, LogOut, Sun, Moon, Sparkles, BookOpen, Calendar, HelpCircle, Users, BarChart3, Bell, ClipboardList, MonitorPlay } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { useTheme } from '../context/ThemeContext';

interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: any;
  category: 'Trang' | 'Hành động';
  action: () => void;
}

export default function SmartSearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const nav = useNavigate();
  
  const isDark = theme === 'dark';

  // Global Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
        else openModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const openModal = () => {
    // We don't have openModal prop passed, we can only trigger it from Layout.
    // So this global listener might be better placed in Layout or handled via event.
    // Actually, we'll dispatch a custom event.
    window.dispatchEvent(new Event('open-smart-search'));
  };

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Generate dynamic items based on Role
  const allItems = useMemo<SearchItem[]>(() => {
    if (!user) return [];
    
    const role = user.role;
    const items: SearchItem[] = [];
    const pushNav = (title: string, path: string, icon: any, subtitle?: string) => {
      items.push({
        id: `nav_${path}`,
        title,
        subtitle,
        icon,
        category: 'Trang',
        action: () => {
          nav(path);
          onClose();
        }
      });
    };

    // Actions (Everyone)
    const actions: SearchItem[] = [
      { id: 'act_theme', title: isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối', icon: isDark ? Sun : Moon, category: 'Hành động', action: () => { toggleTheme(); onClose(); } },
      { id: 'act_ai', title: 'Mở Trợ lý AI', subtitle: 'Hỏi đáp, tư vấn học tập', icon: Sparkles, category: 'Hành động', action: () => { window.dispatchEvent(new CustomEvent('lms_open_ai_companion')); onClose(); } },
      { id: 'act_logout', title: 'Đăng xuất', icon: LogOut, category: 'Hành động', action: () => { logout(); nav('/login'); onClose(); } },
    ];

    if (role === 'STUDENT') {
      pushNav('Trang chủ Sinh viên', '/student', Home);
      pushNav('Lịch học & Thời khóa biểu', '/student/schedule', Calendar);
      pushNav('Đăng ký học phần', '/student/registration', ClipboardList);
      pushNav('Kết quả học tập / Điểm', '/student/grades', BarChart3);
      pushNav('Tra cứu Học phí', '/student/tuition', FileText);
      pushNav('Hồ sơ cá nhân & Đổi mật khẩu', '/student/profile', User);
      pushNav('Lớp học phần của tôi', '/student/classes', BookOpen);
      pushNav('Bài kiểm tra trực tuyến', '/student/quizzes', HelpCircle);
      pushNav('Bảng điểm tích lũy', '/student/transcript', GraduationCap);
      pushNav('Thông báo hệ thống', '/student/notifications', Bell);
      pushNav('Kho biểu mẫu & tài liệu', '/student/documents', FileText);
    } 
    else if (role === 'LECTURER') {
      pushNav('Trang chủ Giảng viên', '/lecturer', Home);
      pushNav('Lịch giảng dạy', '/lecturer/schedule', Calendar);
      pushNav('Danh sách Lớp phụ trách', '/lecturer/classes', BookOpen);
      pushNav('Chấm điểm bài nộp', '/lecturer/grading', BookOpen);
      pushNav('Quản lý Bài tập', '/lecturer/assignments', FileText);
      pushNav('Điểm rèn luyện (GVCN)', '/lecturer/homeroom', Users);
      pushNav('Yêu cầu cấp quyền (PBAC)', '/lecturer/permission-requests', Key);
      pushNav('Hồ sơ cá nhân & Đổi mật khẩu', '/lecturer/profile', User);
      pushNav('Thống kê Analytics', '/lecturer/analytics', BarChart3);
    }
    else if (role === 'ADMIN') {
      pushNav('Dashboard Admin', '/admin', Home);
      pushNav('Quản lý Người dùng', '/admin/users', Users);
      pushNav('Quản lý Chương trình đào tạo', '/admin/curricula', GraduationCap);
      pushNav('Đợt đăng ký tín chỉ', '/admin/registration', ClipboardList);
      pushNav('Lớp học phần', '/admin/classes', BookOpen);
      pushNav('Phê duyệt Quyền PBAC', '/admin/pbac-approvals', Key);
      pushNav('Nhật ký hệ thống (Audit Logs)', '/admin/audit-logs', MonitorPlay);
      pushNav('Quản lý Học phí', '/admin/tuition', FileText);
      pushNav('Báo cáo hệ thống', '/admin/reports', BarChart3);
    }

    return [...items, ...actions];
  }, [user, isDark, nav, onClose, logout, toggleTheme]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems;
    const lowerQuery = query.toLowerCase();
    
    // Convert vietnamese accents
    const removeAccents = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cleanQuery = removeAccents(lowerQuery);

    return allItems.filter(item => {
      const cleanTitle = removeAccents(item.title.toLowerCase());
      const cleanSubtitle = item.subtitle ? removeAccents(item.subtitle.toLowerCase()) : '';
      return cleanTitle.includes(cleanQuery) || cleanSubtitle.includes(cleanQuery);
    });
  }, [query, allItems]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      
      {/* Search Dialog */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Input area */}
        <div className="flex items-center px-4 border-b border-slate-100 dark:border-slate-800">
          <Search className="w-5 h-5 text-accent-600 dark:text-accent-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 w-full bg-transparent border-0 outline-none px-4 py-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
            placeholder="Tìm kiếm trang, tính năng hoặc thao tác nhanh..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-700">ESC</kbd>
          </div>
        </div>

        {/* Results list */}
        <div className="max-h-[350px] overflow-y-auto py-2" ref={listRef}>
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
              Không tìm thấy kết quả phù hợp cho "{query}"
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const active = index === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg cursor-pointer transition-colors ${
                    active 
                      ? 'bg-accent-50 dark:bg-accent-500/10 text-accent-700 dark:text-accent-300' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className={`p-1.5 rounded-md ${active ? 'bg-accent-100 dark:bg-accent-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{item.title}</div>
                    {item.subtitle && (
                      <div className={`text-[10px] truncate mt-0.5 ${active ? 'text-accent-600/70 dark:text-accent-400/70' : 'text-slate-400'}`}>
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                  <div className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md border ${
                    active 
                      ? 'border-accent-200 bg-accent-100/50 text-accent-600 dark:border-accent-800 dark:bg-accent-900/50 dark:text-accent-400' 
                      : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800'
                  }`}>
                    {item.category}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">↑</kbd>
              <kbd className="px-1 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">↓</kbd>
              <span>Di chuyển</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">↵</kbd>
              <span>Chọn</span>
            </span>
          </div>
          <span className="hidden sm:inline">Thanh tìm kiếm thông minh • LearningHub</span>
        </div>
      </div>
    </div>
  );
}
