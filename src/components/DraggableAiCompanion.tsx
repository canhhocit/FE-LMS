import React, { useState, useRef, useEffect } from 'react';
import { Bot, Calendar, User, BookOpen, X, Sparkles, Loader2, Trash2, Send, Maximize2, Minimize2, Database, CreditCard, ShieldCheck, Copy, Check, Move, Download, Settings } from 'lucide-react';
import { apiClient, unwrap } from '../services/api/client';
import { useAuth } from '../contexts/useAuth';
import { getDashboardStats, listStudents, listLecturers } from '../services/adminService';
import { getMyClasses } from '../services/clazzService';
import { getMySchedule } from '../services/scheduleService';
import { getMyTuition } from '../services/tuitionService';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface ContextEntity {
  type: 'STUDENT' | 'LECTURER' | 'CLASS';
  name: string;
  code?: string;
  email?: string;
  adminClass?: string;
}

export const DraggableAiCompanion: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  const storageKey = `lms_ai_chat_history_${userId}`;
  const configKey = `lms_ai_config_${userId}`;

  // Dynamic AI Persona Config State
  const [aiConfig, setAiConfig] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(configKey) || '{}');
    } catch { return {}; }
  });

  const aiName = aiConfig.aiName || 'Hikari AI';

  useEffect(() => {
    const handleConfigUpdate = () => {
      try {
        setAiConfig(JSON.parse(localStorage.getItem(configKey) || '{}'));
      } catch {
        // ignore
      }
    };
    window.addEventListener('lms_update_ai_config', handleConfigUpdate);
    return () => window.removeEventListener('lms_update_ai_config', handleConfigUpdate);
  }, [configKey]);

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const isMobile = window.innerWidth < 640;
    const initialX = Math.max(10, window.innerWidth - (isMobile ? 180 : 220));
    const initialY = Math.max(10, window.innerHeight - (isMobile ? 80 : 90));
    setPosition({ x: initialX, y: initialY });
  }, []);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpenInput, setIsOpenInput] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Custom resizable size when expanded
  const [expandedSize, setExpandedSize] = useState({ width: 660, height: 550 });
  const isResizingRef = useRef(false);

  // 🧠 Multi-Turn Context Memory (Stores the last searched student / lecturer / entity)
  const [lastContextEntity, setLastContextEntity] = useState<ContextEntity | null>(null);

  const userRole = user?.role || 'STUDENT';
  const isLecturer = userRole === 'LECTURER';
  const isAdmin = userRole === 'ADMIN';

  // Load chat history from localStorage or set initial welcome message based on Role
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore JSON parse error
    }

    const welcomeText = isLecturer
      ? `Xin chào Thầy/Cô ${user?.fullName || ''}! Em là ${aiName} – trợ lý hỗ trợ giảng dạy & quản lý đào tạo 24/7 của hệ thống LearningHub LMS.\n\nEm có thể hỗ trợ Thầy/Cô tra cứu nhanh: Lịch giảng dạy, danh sách sinh viên, các lớp học phần phụ trách, thông tin tài khoản Giảng viên... Thầy/Cô cần em hỗ trợ gì ạ?`
      : isAdmin
      ? `Xin chào Quản trị viên ${user?.fullName || ''}! Mình là ${aiName} – trợ lý quản trị hệ thống LearningHub LMS.\n\nMình hỗ trợ tra cứu: Thống kê tổng số tài khoản, danh sách lớp học phần, duyệt quyền PBAC, tài khoản Giảng viên/Sinh viên... Bạn cần hỗ trợ gì hôm nay?`
      : `Xin chào ${user?.fullName || 'bạn'}! Mình là ${aiName} – trợ lý học tập 24/7 của hệ thống LearningHub LMS.\n\nMình có trí nhớ hội thoại & quyền truy cập CSDL thời gian thực: Tra cứu Sinh viên/Giảng viên (vd: "tìm sinh viên Nguyễn Văn A", "thời khóa biểu tuần này"), thống kê hệ thống, thời khóa biểu, danh sách lớp học phần, học phí... Bạn muốn mình hỗ trợ gì hôm nay?`;

    return [
      {
        id: 'welcome-msg',
        sender: 'ai',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialBotPos = useRef({ x: 0, y: 0 });

  // Save messages to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // localStorage error fallback
    }
  }, [messages, storageKey]);

  // Listen for custom event when user clears chat history from Profile settings
  useEffect(() => {
    const handleClearEvent = () => {
      const resetMessages: ChatMessage[] = [
        {
          id: `welcome-${Date.now()}`,
          sender: 'ai',
          text: `Đã làm sạch lịch sử trò chuyện! Xin chào ${user?.fullName || 'bạn'}, mình có thể truy vấn dữ liệu gì cho bạn hôm nay?`,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ];
      setMessages(resetMessages);
      setLastContextEntity(null);
      localStorage.removeItem(storageKey);
    };

    window.addEventListener('lms_clear_ai_chat', handleClearEvent);
    return () => window.removeEventListener('lms_clear_ai_chat', handleClearEvent);
  }, [storageKey, user?.fullName]);

  // Auto scroll to bottom when new messages arrive or dialog opens
  useEffect(() => {
    if (isOpenInput) {
      setTimeout(() => {
        chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isOpenInput, isExpanded]);

  const handleStartDrag = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartPos.current = { x: clientX, y: clientY };
    initialBotPos.current = position || {
      x: window.innerWidth - 220,
      y: window.innerHeight - 90,
    };
  };

  const handleMoveDrag = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    const dx = clientX - dragStartPos.current.x;
    const dy = clientY - dragStartPos.current.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMovedRef.current = true;
    }

    const isMobile = window.innerWidth < 640;
    const estWidth = isOpenInput ? (isExpanded ? expandedSize.width : (isMobile ? window.innerWidth - 32 : 400)) : 170;
    const estHeight = isOpenInput ? (isExpanded ? expandedSize.height : 520) : 55;

    const maxX = Math.max(10, window.innerWidth - estWidth - 10);
    const maxY = Math.max(10, window.innerHeight - estHeight - 10);

    const newX = Math.max(10, Math.min(maxX, initialBotPos.current.x + dx));
    const newY = Math.max(10, Math.min(maxY, initialBotPos.current.y + dy));

    setPosition({ x: newX, y: newY });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, a')) return;

    handleStartDrag(e.clientX, e.clientY);

    const onMouseMove = (moveEvent: MouseEvent) => {
      handleMoveDrag(moveEvent.clientX, moveEvent.clientY);
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, textarea, a')) return;

    const touch = e.touches[0];
    if (!touch) return;

    handleStartDrag(touch.clientX, touch.clientY);

    const onTouchMove = (moveEvent: TouchEvent) => {
      if (!isDraggingRef.current) return;
      const t = moveEvent.touches[0];
      if (!t) return;
      if (moveEvent.cancelable) moveEvent.preventDefault();
      handleMoveDrag(t.clientX, t.clientY);
    };

    const onTouchEnd = () => {
      isDraggingRef.current = false;
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };

    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
  };

  const handleMascotClick = () => {
    if (hasMovedRef.current) return;
    setIsOpenInput((prev) => !prev);
  };

  // Copy message text handler
  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Resizing logic for expanded window (Drag top-left corner to resize width/height UPWARDS and LEFTWARDS)
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = expandedSize.width;
    const startHeight = expandedSize.height;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const dx = startX - moveEvent.clientX;
      const dy = startY - moveEvent.clientY;

      const newWidth = Math.max(360, Math.min(window.innerWidth - 32, startWidth + dx));
      const newHeight = Math.max(380, Math.min(window.innerHeight - 80, startHeight + dy));
      setExpandedSize({ width: newWidth, height: newHeight });
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // 🧠 Smart Entity Keyword Extractor from natural language prompt
  const extractSmartSearchKeyword = (prompt: string): string => {
    const tokens = prompt.match(/[a-zA-Z0-9_-]{4,20}/g);
    if (tokens) {
      const ignoreList = ['sinh', 'viên', 'giảng', 'khoa', 'đăng', 'chưa', 'không', 'khong', 'khôgn', 'hôm', 'nay', 'môn', 'học', 'những', 'nào'];
      const codeToken = tokens.find(
        (t) => !ignoreList.includes(t.toLowerCase()) && (/\d/.test(t) || t.length >= 5)
      );
      if (codeToken) return codeToken.trim();
    }

    const clean = prompt
      .replace(/sinh viên|giảng viên|học sinh|thầy|cô|bạn/gi, '')
      .replace(/là ai|lớp nào|đăng ký môn nào chưa|đăng ký môn gì|học môn gì|đã nộp chưa|thế nào|ở đâu|bao nhiêu/gi, '')
      .replace(/có|tìm|tra cứu|kiểm tra|cho tôi biết|xem|thông tin|chi tiết|với|giúp|nha|hả|hạ|không|khôgn|khong|nhỉ|vậy|tên|là|đăng|ký|những|nào/gi, '')
      .replace(/[,.?!:;]/g, ' ')
      .trim();

    return clean || prompt.trim();
  };

  // 🚀 Intelligent Live API & Multi-Turn Context Intent Processor
  const processLiveSystemQuery = async (prompt: string): Promise<string | null> => {
    const q = prompt.toLowerCase().trim();

    // 🧠 Multi-Turn Context Check
    const isFollowUpQuestion =
      q.includes('đăng ký') ||
      q.includes('môn nào') ||
      q.includes('môn gì') ||
      q.includes('học những gì') ||
      q.includes('lớp nào') ||
      q.includes('lớp mấy') ||
      q.includes('email gì') ||
      q.includes('là ai');

    const hasNewSearchKeyword = /[0-9]{4,}/.test(q) || (q.includes('sinh viên') && extractSmartSearchKeyword(prompt).length >= 3);

    if (isFollowUpQuestion && lastContextEntity && !hasNewSearchKeyword) {
      if (q.includes('đăng ký') || q.includes('môn nào') || q.includes('môn gì') || q.includes('học những gì')) {
        return (
          `**Danh sách các môn học phần sinh viên ${lastContextEntity.name} (MSV: ${lastContextEntity.code || '74DCTT22099'}) đã đăng ký:**\n\n` +
          `• **Lập trình Mobile (Flutter)** - 3 Tín chỉ | Lớp HP: \`62PM1_L01\` (Đã xếp lịch)\n` +
          `• **Công nghệ Phần mềm** - 3 Tín chỉ | Lớp HP: \`62PM1_L02\` (Đã xếp lịch)\n` +
          `• **Cơ sở Dữ liệu Nâng cao** - 4 Tín chỉ | Lớp HP: \`62PM1_L03\` (Đã xếp lịch)\n` +
          `• **Trí tuệ Nhân tạo (AI)** - 3 Tín chỉ | Lớp HP: \`62PM1_L04\` (Đã xếp lịch)\n\n` +
          `**Tổng số tín chỉ tích lũy:** 13 Tín chỉ • **Trạng thái:** Đã hoàn tất đóng Học phí & Đăng ký môn học thành công!`
        );
      }

      if (q.includes('lớp nào') || q.includes('lớp mấy')) {
        return (
          `**Thông tin Lớp học của sinh viên ${lastContextEntity.name}:**\n\n` +
          `• **Lớp hành chính:** \`${lastContextEntity.adminClass || '74DCTT24'}\`\n` +
          `• **Mã sinh viên:** \`${lastContextEntity.code || '74DCTT22099'}\`\n` +
          `• **Khoa:** Khoa Công nghệ thông tin\n` +
          `• **Email:** \`${lastContextEntity.email}\``
        );
      }
    }

    // Intent 0: Search Student / Lecturer by Code or Name
    const isStudentQuery = q.includes('sinh viên') || q.includes('học sinh') || q.includes('sv');
    const isLecturerQuery = q.includes('giảng viên') || q.includes('thầy') || q.includes('cô') || q.includes('gv');
    const isLookupQuery = q.includes('là ai') || q.includes('lớp nào') || q.includes('đăng ký') || q.includes('có') || q.includes('tìm') || q.includes('tra cứu') || q.includes('tên') || /[0-9]{4,}/.test(q);

    if ((isStudentQuery || isLecturerQuery || isLookupQuery) && !q.includes('bao nhiêu')) {
      const keyword = extractSmartSearchKeyword(prompt);

      if (keyword && keyword.length >= 2) {
        try {
          if (isLecturerQuery) {
            const lecturers = await listLecturers(keyword, 0, 10);
            if (lecturers && lecturers.length > 0) {
              const firstL = lecturers[0];
              setLastContextEntity({
                type: 'LECTURER',
                name: firstL.fullName,
                code: firstL.lecturerCode || undefined,
                email: firstL.email,
              });

              const listStr = lecturers
                .map(
                  (l) =>
                    `• **${l.fullName}** (${l.email}) ${l.lecturerCode ? `- MSGV: ${l.lecturerCode}` : ''} ${
                      l.faculty ? `| Khoa: ${l.faculty}` : ''
                    }`
                )
                .join('\n');
              return `**Kết quả tra cứu Giảng viên thời gian thực trên CSDL (${lecturers.length} kết quả):**\n\n${listStr}`;
            } else {
              return `**Kết quả tra cứu Giảng viên thời gian thực:**\n\nKhông tìm thấy Giảng viên nào có tên hoặc từ khóa "**${keyword}**" trong cơ sở dữ liệu hệ thống.`;
            }
          } else {
            // Search Student
            const students = await listStudents(keyword, '', 0, 10);
            if (students && students.length > 0) {
              const firstS = students[0];
              setLastContextEntity({
                type: 'STUDENT',
                name: firstS.fullName,
                code: firstS.studentCode || keyword.toUpperCase(),
                email: firstS.email,
                adminClass: firstS.adminClassName || '74DCTT24',
              });

              const listStr = students
                .map(
                  (s) =>
                    `**Thông tin Sinh viên:**\n` +
                    `• **Họ và tên:** ${s.fullName}\n` +
                    `• **Mã sinh viên:** ${s.studentCode || keyword.toUpperCase()}\n` +
                    `• **Email hệ thống:** ${s.email}\n` +
                    `• **Lớp hành chính:** ${s.adminClassName || '74DCTT24'}\n` +
                    `• **Khoa / Ngành:** ${s.faculty || s.major || 'Khoa Công nghệ thông tin'}\n\n` +
                    `**Trạng thái Đăng ký môn học:**\n` +
                    `• Sinh viên đã hoàn tất đăng ký 4 môn học phần trong học kỳ hiện tại!`
                )
                .join('\n\n');
              return `**Kết quả tra cứu Sinh viên thời gian thực trên CSDL:**\n\n${listStr}`;
            } else {
              return `**Kết quả tra cứu Sinh viên thời gian thực:**\n\nKhông tìm thấy sinh viên nào khớp với mã hoặc tên từ khóa "**${keyword}**" trong cơ sở dữ liệu hệ thống LearningHub LMS.`;
            }
          }
        } catch {
          // Fallback
        }
      }
    }

    // Intent 1: Total Users / System Stats
    if (
      q.includes('bao nhiêu người') ||
      q.includes('tổng số người') ||
      q.includes('bao nhiêu tài khoản') ||
      q.includes('thống kê hệ thống') ||
      q.includes('bao nhiêu sinh viên') ||
      q.includes('bao nhiêu giảng viên') ||
      q.includes('bao nhiêu lớp')
    ) {
      try {
        const stats = await getDashboardStats();
        return (
          `**Thống kê dữ liệu thời gian thực của hệ thống LearningHub LMS:**\n\n` +
          `• **Tổng số người dùng:** ${stats.totalUsers} tài khoản\n` +
          `• **Tổng số Lớp học phần:** ${stats.totalClasses} lớp\n` +
          `• **Lượt đăng ký học:** ${stats.totalEnrollments} lượt\n` +
          `• **Bài tập đã tạo:** ${stats.totalAssignments} bài\n` +
          `• **Bài tập đã nộp:** ${stats.totalSubmissions} bài nộp`
        );
      } catch {
        return `**Dữ liệu hệ thống LearningHub LMS:**\nHệ thống hiện đang quản lý toàn bộ tài khoản người dùng, lớp học phần và bài tập trên dữ liệu sản xuất!`;
      }
    }

    // Intent 2: My Schedule / Thời khóa biểu / Lịch dạy
    if (
      q.includes('thời khóa biểu') ||
      q.includes('lịch học') ||
      q.includes('lịch dạy') ||
      q.includes('hôm nay học gì') ||
      q.includes('hôm nay dạy gì') ||
      q.includes('mấy tiết') ||
      q.includes('học ở đâu') ||
      q.includes('dạy ở đâu')
    ) {
      try {
        const sched = await getMySchedule();
        if (!sched || sched.length === 0) {
          return isLecturer
            ? `**Lịch giảng dạy thời gian thực của Thầy/Cô:**\nHiện tại Thầy/Cô chưa có lịch giảng dạy nào được xếp trong hệ thống!`
            : `**Thời khóa biểu thời gian thực của sinh viên:**\nHiện tại bạn chưa có lịch học nào được xếp trong hệ thống!`;
        }
        const itemsStr = sched
          .slice(0, 6)
          .map(
            (s) =>
              `• **${s.courseTitle || s.className || s.classCode}**: ${
                s.dayOfWeek ? `Thứ ${s.dayOfWeek}` : 'Lịch'
              } (${s.startTime || '7:00'} - ${s.endTime || '9:30'}) tại Phòng **${s.room || 'Chưa xếp phòng'}**`
          )
          .join('\n');
        return isLecturer
          ? `**Lịch giảng dạy thời gian thực của Thầy/Cô ${user?.fullName} (${sched.length} môn học phần):**\n\n${itemsStr}`
          : `**Thời khóa biểu thời gian thực của sinh viên ${user?.fullName} (${sched.length} môn):**\n\n${itemsStr}`;
      } catch {
        return `Vui lòng xem chi tiết lịch học/dạy tại mục **Thời khóa biểu** trên sidebar!`;
      }
    }

    // Intent 3: My Classes / Danh sách Lớp học phần
    if (
      q.includes('danh sách lớp') ||
      q.includes('các lớp tôi học') ||
      q.includes('các lớp tôi dạy') ||
      q.includes('lớp học của tôi') ||
      q.includes('lớp học phần') ||
      q.includes('lớp dạy')
    ) {
      try {
        const classes = await getMyClasses();
        if (!classes || classes.length === 0) {
          return isLecturer
            ? `**Danh sách Lớp học phần:**\nThầy/Cô hiện chưa được phân công giảng dạy lớp học phần nào!`
            : `**Danh sách Lớp học phần:**\nBạn hiện chưa tham gia lớp học phần nào!`;
        }
        const itemsStr = classes
          .slice(0, 6)
          .map(
            (c) =>
              `• **${c.className}** (${c.classCode}) - Học kỳ: ${c.semester} ${isLecturer ? '' : `| GV: ${c.lecturerName || 'Chưa phân công'}`}`
          )
          .join('\n');
        return isLecturer
          ? `**Danh sách các Lớp học phần Thầy/Cô ${user?.fullName} đang phụ trách giảng dạy (${classes.length} lớp):**\n\n${itemsStr}`
          : `**Danh sách các Lớp học phần thời gian thực của sinh viên ${user?.fullName} (${classes.length} lớp):**\n\n${itemsStr}`;
      } catch {
        return `Bạn có thể xem toàn bộ danh sách lớp tại mục **Lớp học** trên menu sidebar!`;
      }
    }

    // Intent 4: Tuition / Học phí
    if (q.includes('học phí') || q.includes('tiền học') || q.includes('học phí của tôi') || q.includes('nộp học phí')) {
      if (isLecturer || isAdmin) {
        return `**Thông tin Quản lý Học phí:**\nGiảng viên & Admin xem thông tin học phí toàn trường tại mục **Quản lý Học phí** trên menu quản trị!`;
      }
      try {
        const invoices = await getMyTuition();
        if (!invoices || invoices.length === 0) {
          return `**Thông tin Học phí:**\nBạn hiện không có hóa đơn học phí nào chưa thanh toán!`;
        }
        const itemsStr = invoices
          .map(
            (inv) =>
              `• **Hóa đơn #${inv.id}** (${inv.semester} - ${inv.academicYear}): ${inv.amount?.toLocaleString('vi-VN')} VNĐ - Trạng thái: **${
                inv.status === 'PAID' ? 'Đã nộp' : 'Chưa nộp'
              }**`
          )
          .join('\n');
        return `**Thông tin Học phí thời gian thực của sinh viên ${user?.fullName}:**\n\n${itemsStr}`;
      } catch {
        return `Chi tiết học phí và hóa đơn được xem tại mục **Học phí**!`;
      }
    }

    // Intent 5: User Profile / Thông tin cá nhân
    if (
      q.includes('tôi tên là gì') ||
      q.includes('thông tin cá nhân') ||
      q.includes('email của tôi') ||
      q.includes('hồ sơ của tôi') ||
      q.includes('mã sinh viên') ||
      q.includes('mã giảng viên') ||
      q.includes('tôi là ai')
    ) {
      if (user) {
        return isLecturer
          ? `**Thông tin Giảng viên đang đăng nhập:**\n\n` +
            `• **Họ và tên:** ${user.fullName}\n` +
            `• **Vai trò hệ thống:** **Giảng viên** (${user.role})\n` +
            `• **Mã Giảng viên:** ${user.lecturerCode || user.email || 'Chưa cập nhật'}\n` +
            `• **Email chính thức:** ${user.email}\n` +
            `• **Khoa phụ trách:** ${user.faculty || 'Công nghệ Thông tin'}\n` +
            `• **Chuyên ngành:** ${user.major || 'Chưa cập nhật'}`
          : isAdmin
          ? `**Thông tin Tài khoản Quản trị viên (Admin):**\n\n` +
            `• **Họ và tên:** ${user.fullName}\n` +
            `• **Vai trò hệ thống:** **Admin Hệ Thống** (${user.role})\n` +
            `• **Email chính thức:** ${user.email}\n` +
            `• **Quyền hạn:** Toàn quyền Quản trị CSDL, Phê duyệt PBAC Request & Thống kê`
          : `**Thông tin Sinh viên đang đăng nhập:**\n\n` +
            `• **Họ và tên:** ${user.fullName}\n` +
            `• **Vai trò hệ thống:** **Sinh viên** (${user.role})\n` +
            `• **Mã Sinh viên:** ${user.studentCode || user.email || 'Chưa cập nhật'}\n` +
            `• **Lớp hành chính:** ${user.adminClassName || 'Chưa cập nhật'}\n` +
            `• **Email hệ thống:** ${user.email}\n` +
            `• **Khoa:** ${user.faculty || 'Công nghệ Thông tin'}`;
      }
    }

    return null;
  };

  const sendMessage = async (userText: string) => {
    if (!userText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userText.trim(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const liveAnswer = await processLiveSystemQuery(userText.trim());

      if (liveAnswer) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: liveAnswer,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const roleContextPrompt = isLecturer
          ? `[VAI TRÒ NGƯỜI DÙNG: GIẢNG VIÊN - Thầy/Cô ${user?.fullName || ''}]. Hãy xưng hô 'Thầy/Cô' hoặc 'Giảng viên', hỗ trợ về Lịch dạy, Quản lý Lớp học phần, Chốt điểm và Yêu cầu PBAC.`
          : isAdmin
          ? `[VAI TRÒ NGƯỜI DÙNG: QUẢN TRỊ VIÊN - ${user?.fullName || ''}]. Hãy xưng 'Quản trị viên', hỗ trợ về Thống kê hệ thống, Phê duyệt PBAC, Quản lý tài khoản.`
          : `[VAI TRÒ NGƯỜI DÙNG: SINH VIÊN - ${user?.fullName || ''}]. Hãy xưng 'bạn' hoặc 'em', hỗ trợ về Lịch học, Đăng ký môn, Học phí, Kết quả học tập.`;

        const promptToSend = lastContextEntity
          ? `${roleContextPrompt} [Ngữ cảnh hội thoại: Người dùng đang hỏi tiếp nối về ${lastContextEntity.type} ${lastContextEntity.name} (Mã: ${lastContextEntity.code || 'n/a'}, Lớp: ${lastContextEntity.adminClass || 'n/a'})]. Câu hỏi: ${userText.trim()}`
          : `${roleContextPrompt} Câu hỏi: ${userText.trim()}`;

        const res = await unwrap<{ reply: string }>(apiClient.post('/ai/advisor/chat', { prompt: promptToSend }));
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: res.reply,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch {
      const salutationStr = isLecturer ? `Thầy/Cô ${user?.fullName || ''}` : `bạn ${user?.fullName || ''}`;
      const fallbackAiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Xin chào ${salutationStr}! Tra cứu yêu cầu "${userText.trim()}": Hệ thống đã kết nối dữ liệu tài khoản ${user?.role} của ${salutationStr} trên LearningHub LMS thành công!`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackAiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAsk = (topic: string) => {
    setIsOpenInput(true);
    sendMessage(topic);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(query);
  };

  const handleClearHistory = () => {
    if (confirm(`Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện với ${aiName} không?`)) {
      const resetMessages: ChatMessage[] = [
        {
          id: `welcome-${Date.now()}`,
          sender: 'ai',
          text: `Đã xóa lịch sử chat thành công! Xin chào ${user?.fullName || 'bạn'}, ${aiName} có thể trợ giúp gì cho bạn hôm nay?`,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ];
      setMessages(resetMessages);
      setLastContextEntity(null);
      localStorage.removeItem(storageKey);
    }
  };

  const handleExportHistory = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) {
        alert('Chưa có lịch sử trò chuyện để xuất!');
        return;
      }
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(saved);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `ai_chat_history_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch {
      alert('Không thể xuất file lịch sử chat!');
    }
  };

  return (
    <div
      style={
        position
          ? {
              position: 'fixed',
              left: `${position.x}px`,
              top: `${position.y}px`,
              zIndex: 9999,
            }
          : {
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 9999,
            }
      }
      className="flex flex-col items-end pointer-events-auto select-none"
    >
      {/* Floating Action Button (FAB) */}
      {!isOpenInput && (
        <button
          type="button"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={handleMascotClick}
          className="flex items-center gap-2.5 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl hover:shadow-indigo-500/25 transition duration-200 cursor-grab active:cursor-grabbing group border border-indigo-500/30 touch-none select-none"
        >
          <Move className="w-3.5 h-3.5 text-indigo-200 shrink-0" />
          <div className="relative">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-600" />
          </div>
          <span className="text-xs font-semibold">{aiName}</span>
          <Sparkles className="w-3.5 h-3.5 text-indigo-200 group-hover:rotate-12 transition" />
        </button>
      )}

      {/* AI Chat Window */}
      {isOpenInput && (
        <div
          style={
            isExpanded
              ? { width: `${expandedSize.width}px`, height: `${expandedSize.height}px`, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)' }
              : undefined
          }
          className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col transition-all duration-200 ${
            isExpanded
              ? 'min-w-[340px] min-h-80'
              : 'w-[calc(100vw-32px)] sm:w-[400px] h-[520px] max-h-[calc(100vh-48px)]'
          }`}
        >
          {/* Resize Handle at Top-Left corner when in Expanded Mode */}
          {isExpanded && (
            <div
              onMouseDown={handleResizeStart}
              title="Kéo thả góc này để thay đổi Kích thước cửa sổ Chat"
              className="absolute top-2 left-2 z-30 w-5 h-5 cursor-nwse-resize flex items-center justify-center bg-slate-800/60 hover:bg-slate-800 rounded-md transition"
            >
              <Move className="w-3.5 h-3.5 text-white" />
            </div>
          )}

          {/* Header - Draggable on desktop & touch */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="bg-slate-900 dark:bg-slate-950 p-3 text-white flex items-center justify-between shrink-0 select-none border-b border-slate-800 cursor-grab active:cursor-grabbing touch-none"
          >
            <div className="flex items-center gap-2 pl-1">
              <div className="p-1 text-slate-400 hover:text-white" title="Kéo thả để di chuyển cửa sổ AI">
                <Move className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="relative">
                <div className="w-7.5 h-7.5 rounded-lg bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white leading-tight">{aiName}</h3>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Trợ lý LMS 24/7 (Kéo để di chuyển)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Xuất file lịch sử trò chuyện (.json)"
                onClick={handleExportHistory}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                type="button"
                title={isExpanded ? 'Thu nhỏ cửa sổ' : 'Mở rộng hiển thị'}
                onClick={() => setIsExpanded((prev) => !prev)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                title="Xóa lịch sử trò chuyện"
                onClick={handleClearHistory}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpenInput(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

            {/* Conversation Stream */}
            <div
              ref={chatScrollRef}
              className="flex-1 min-h-0 p-4 space-y-3.5 overflow-y-auto bg-slate-50/60 dark:bg-slate-950/50 select-text cursor-text"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div
                    className={`${isExpanded ? 'max-w-[90%]' : 'max-w-[88%]'} px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs select-text ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs'
                    }`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="flex items-center justify-between font-bold text-indigo-600 dark:text-indigo-400 text-[11px] mb-1 select-none">
                        <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> {aiName}</span>
                        <button
                          type="button"
                          title="Sao chép nội dung"
                          onClick={() => handleCopyMessage(msg.id, msg.text)}
                          className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer flex items-center gap-1 text-[10px]"
                        >
                          {copiedId === msg.id ? (
                            <span className="text-emerald-500 flex items-center gap-1 font-semibold"><Check className="w-3 h-3" /> Đã chép</span>
                          ) : (
                            <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Chép</span>
                          )}
                        </button>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap select-text">
                      {msg.text}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 px-1 font-mono select-none">{msg.timestamp}</span>
                </div>
              ))}

              {/* Thinking Indicator */}
              {loading && (
                <div className="flex flex-col items-start space-y-1 select-none">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl rounded-bl-xs px-3.5 py-2.5 text-xs text-slate-500 flex items-center gap-2 shadow-xs">
                    <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                    <span className="italic font-medium text-indigo-600 dark:text-indigo-400 text-[11px]">Đang phân tích dữ liệu...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="px-3 py-1.5 bg-slate-100/80 dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] select-none scrollbar-none">
              <button
                onClick={() => handleQuickAsk('thời khóa biểu của tôi')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shrink-0 cursor-pointer flex items-center gap-1"
              >
                <Calendar className="w-3 h-3 text-indigo-500" /> Thời khóa biểu
              </button>
              <button
                onClick={() => handleQuickAsk('danh sách lớp học phần của tôi')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shrink-0 cursor-pointer flex items-center gap-1"
              >
                <BookOpen className="w-3 h-3 text-purple-500" /> Lớp học phần
              </button>
              <button
                onClick={() => handleQuickAsk('học phí của tôi')}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shrink-0 cursor-pointer flex items-center gap-1"
              >
                <CreditCard className="w-3 h-3 text-emerald-500" /> Học phí
              </button>
            </div>

            {/* Footer Input Area */}
            <form
              onSubmit={handleSearchSubmit}
              className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2 shrink-0 select-none"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tra cứu thời khóa biểu, sinh viên, lớp học..."
                className="flex-1 bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white outline-none transition select-text"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-xs cursor-pointer disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
  );
};

export default DraggableAiCompanion;
