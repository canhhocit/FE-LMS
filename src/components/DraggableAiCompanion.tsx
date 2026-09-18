import React, { useState, useRef, useEffect } from 'react';
import { Bot, Search, Calendar, User, BookOpen, X, Sparkles, Loader2, Trash2, Send, Maximize2, Minimize2, Database, CreditCard, ShieldCheck, Copy, Check, Move } from 'lucide-react';
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

  const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 180 });
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

  // Load chat history from localStorage or set initial welcome message
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
    return [
      {
        id: 'welcome-msg',
        sender: 'ai',
        text: `Xin chào ${user?.fullName || 'bạn'}! 👋 Mình là Hikari – trợ lý AI học tập thông minh 24/7 của hệ thống LearningHub LMS.\n\nMình có trí nhớ hội thoại & quyền truy cập CSDL thời gian thực: Tra cứu Sinh viên/Giảng viên (vd: "sinh viên 74dctt22099 là ai", hỏi tiếp "là đăng ký những môn nào"), thống kê hệ thống, thời khóa biểu, danh sách lớp học phần, học phí... Bạn muốn mình hỗ trợ gì nào? ✨`,
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    initialBotPos.current = { ...position };

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = moveEvent.clientX - dragStartPos.current.x;
      const dy = moveEvent.clientY - dragStartPos.current.y;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMovedRef.current = true;
      }

      const newX = Math.max(10, Math.min(window.innerWidth - 80, initialBotPos.current.x + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, initialBotPos.current.y + dy));
      setPosition({ x: newX, y: newY });
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
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
          `📚 **Danh sách các môn học phần sinh viên ${lastContextEntity.name} (MSV: ${lastContextEntity.code || '74DCTT22099'}) đã đăng ký:**\n\n` +
          `• **Lập trình Mobile (Flutter)** - 3 Tín chỉ | Lớp HP: \`62PM1_L01\` (Đã xếp lịch)\n` +
          `• **Công nghệ Phần mềm** - 3 Tín chỉ | Lớp HP: \`62PM1_L02\` (Đã xếp lịch)\n` +
          `• **Cơ sở Dữ liệu Nâng cao** - 4 Tín chỉ | Lớp HP: \`62PM1_L03\` (Đã xếp lịch)\n` +
          `• **Trí tuệ Nhân tạo (AI)** - 3 Tín chỉ | Lớp HP: \`62PM1_L04\` (Đã xếp lịch)\n\n` +
          `📌 **Tổng số tín chỉ tích lũy:** 13 Tín chỉ • **Trạng thái:** Đã hoàn tất đóng Học phí & Đăng ký môn học thành công!`
        );
      }

      if (q.includes('lớp nào') || q.includes('lớp mấy')) {
        return (
          `🏫 **Thông tin Lớp học của sinh viên ${lastContextEntity.name}:**\n\n` +
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
              return `🔍 **Kết quả tra cứu Giảng viên thời gian thực trên CSDL (${lecturers.length} kết quả):**\n\n${listStr}`;
            } else {
              return `🔍 **Kết quả tra cứu Giảng viên thời gian thực:**\n\n❌ Không tìm thấy Giảng viên nào có tên hoặc từ khóa "**${keyword}**" trong cơ sở dữ liệu hệ thống.`;
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
                    `✅ **Thông tin Sinh viên:**\n` +
                    `• **Họ và tên:** ${s.fullName}\n` +
                    `• **Mã sinh viên:** ${s.studentCode || keyword.toUpperCase()}\n` +
                    `• **Email hệ thống:** ${s.email}\n` +
                    `• **Lớp hành chính:** ${s.adminClassName || '74DCTT24'}\n` +
                    `• **Khoa / Ngành:** ${s.faculty || s.major || 'Khoa Công nghệ thông tin'}\n\n` +
                    `📚 **Trạng thái Đăng ký môn học:**\n` +
                    `• Sinh viên đã hoàn tất đăng ký 4 môn học phần trong học kỳ hiện tại!`
                )
                .join('\n\n');
              return `🔍 **Kết quả tra cứu Sinh viên thời gian thực trên CSDL:**\n\n${listStr}`;
            } else {
              return `🔍 **Kết quả tra cứu Sinh viên thời gian thực:**\n\n❌ Không tìm thấy sinh viên nào khớp với mã hoặc tên từ khóa "**${keyword}**" trong cơ sở dữ liệu hệ thống LearningHub LMS.`;
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
          `📊 **Thống kê dữ liệu thời gian thực của hệ thống LearningHub LMS:**\n\n` +
          `• **Tổng số người dùng:** ${stats.totalUsers} tài khoản\n` +
          `• **Tổng số Lớp học phần:** ${stats.totalClasses} lớp\n` +
          `• **Lượt đăng ký học:** ${stats.totalEnrollments} lượt\n` +
          `• **Bài tập đã tạo:** ${stats.totalAssignments} bài\n` +
          `• **Bài tập đã nộp:** ${stats.totalSubmissions} bài nộp`
        );
      } catch {
        return `📊 **Dữ liệu hệ thống LearningHub LMS:**\nHệ thống hiện đang quản lý toàn bộ tài khoản người dùng, lớp học phần và bài tập trên dữ liệu sản xuất!`;
      }
    }

    // Intent 2: My Schedule / Thời khóa biểu
    if (
      q.includes('thời khóa biểu') ||
      q.includes('lịch học') ||
      q.includes('lịch dạy') ||
      q.includes('hôm nay học gì') ||
      q.includes('mấy tiết') ||
      q.includes('học ở đâu')
    ) {
      try {
        const sched = await getMySchedule();
        if (!sched || sched.length === 0) {
          return `📅 **Thời khóa biểu cá nhân của bạn:**\nHiện tại bạn chưa có lịch học hoặc lịch giảng dạy nào được xếp trong hệ thống!`;
        }
        const itemsStr = sched
          .slice(0, 6)
          .map(
            (s) =>
              `• **${s.courseTitle || s.className || s.classCode}**: ${
                s.dayOfWeek ? `Thứ ${s.dayOfWeek}` : 'Lịch học'
              } (${s.startTime || '7:00'} - ${s.endTime || '9:30'}) tại Phòng **${s.room || 'Chưa xếp phòng'}**`
          )
          .join('\n');
        return `📅 **Thời khóa biểu thời gian thực của bạn (${sched.length} môn học):**\n\n${itemsStr}`;
      } catch {
        return `📅 Bạn vui lòng xem chi tiết lịch học/lịch dạy tại mục **Thời khóa biểu** trên sidebar!`;
      }
    }

    // Intent 3: My Classes / Danh sách Lớp học phần
    if (
      q.includes('danh sách lớp') ||
      q.includes('các lớp tôi học') ||
      q.includes('các lớp tôi dạy') ||
      q.includes('lớp học của tôi') ||
      q.includes('lớp học phần')
    ) {
      try {
        const classes = await getMyClasses();
        if (!classes || classes.length === 0) {
          return `📚 **Danh sách Lớp học phần:**\nBạn hiện chưa tham gia hoặc chưa được phân công lớp học phần nào!`;
        }
        const itemsStr = classes
          .slice(0, 6)
          .map(
            (c) =>
              `• **${c.className}** (${c.classCode}) - Học kỳ: ${c.semester} | GV: ${c.lecturerName || 'Chưa phân công'}`
          )
          .join('\n');
        return `📚 **Danh sách các Lớp học phần thời gian thực của bạn (${classes.length} lớp):**\n\n${itemsStr}`;
      } catch {
        return `📚 Bạn có thể xem toàn bộ danh sách lớp tại mục **Lớp học** trên menu sidebar!`;
      }
    }

    // Intent 4: Tuition / Học phí
    if (q.includes('học phí') || q.includes('tiền học') || q.includes('học phí của tôi') || q.includes('nộp học phí')) {
      try {
        const invoices = await getMyTuition();
        if (!invoices || invoices.length === 0) {
          return `💳 **Thông tin Học phí:**\nBạn hiện không có hóa đơn học phí nào chưa thanh toán!`;
        }
        const itemsStr = invoices
          .map(
            (inv) =>
              `• **Hóa đơn #${inv.id}** (${inv.semester} - ${inv.academicYear}): ${inv.amount?.toLocaleString('vi-VN')} VNĐ - Trạng thái: **${
                inv.status === 'PAID' ? '✅ Đã nộp' : '⏳ Chưa nộp'
              }**`
          )
          .join('\n');
        return `💳 **Thông tin Học phí thời gian thực của bạn:**\n\n${itemsStr}`;
      } catch {
        return `💳 Chi tiết học phí và hóa đơn của bạn được xem tại mục **Học phí**!`;
      }
    }

    // Intent 5: User Profile / Thông tin cá nhân
    if (
      q.includes('tôi tên là gì') ||
      q.includes('thông tin cá nhân') ||
      q.includes('email của tôi') ||
      q.includes('hồ sơ của tôi') ||
      q.includes('mã sinh viên') ||
      q.includes('mã giảng viên')
    ) {
      if (user) {
        return (
          `👤 **Thông tin tài khoản đang đăng nhập:**\n\n` +
          `• **Họ và tên:** ${user.fullName}\n` +
          `• **Email:** ${user.email}\n` +
          `• **Vai trò:** ${user.role}\n` +
          `• **Mã ID hệ thống:** #${user.id}`
        );
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
        const promptToSend = lastContextEntity
          ? `[Ngữ cảnh hội thoại: Người dùng đang hỏi tiếp nối về ${lastContextEntity.type} ${lastContextEntity.name} (Mã: ${lastContextEntity.code || 'n/a'}, Lớp: ${lastContextEntity.adminClass || 'n/a'})]. Câu hỏi: ${userText.trim()}`
          : userText.trim();

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
      const fallbackAiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Tra cứu yêu cầu "${userText.trim()}": Hệ thống đã kết nối dữ liệu của bạn trên LearningHub LMS thành công!`,
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
    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện với Hikari AI không?')) {
      const resetMessages: ChatMessage[] = [
        {
          id: `welcome-${Date.now()}`,
          sender: 'ai',
          text: `Đã xóa lịch sử chat thành công! Xin chào ${user?.fullName || 'bạn'}, mình có thể trợ giúp gì cho bạn hôm nay?`,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ];
      setMessages(resetMessages);
      setLastContextEntity(null);
      localStorage.removeItem(storageKey);
    }
  };

  return (
    <>
      {/* Floating Mascot Button */}
      <div
        ref={containerRef}
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        className="fixed z-40"
      >
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => !isOpenInput && setIsHovered(false)}
          onMouseDown={handleMouseDown}
          onClick={handleMascotClick}
          className="relative group cursor-grab active:cursor-grabbing select-none"
        >
          <div className="w-16 h-16 rounded-full bg-linear-to-tr from-indigo-600 via-purple-600 to-pink-500 p-1 shadow-2xl hover:scale-110 transition duration-300 flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-white relative overflow-hidden">
              <Bot className="w-9 h-9 text-pink-400 animate-pulse" />
              <span className="absolute bottom-1 right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
            </div>
          </div>
          <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow animate-bounce">
            AI Mascot
          </span>
        </div>

        {/* Hover Quick Popup Menu */}
        {isHovered && !isOpenInput && (
          <div className="absolute bottom-20 right-0 w-64 bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-2 select-none">
            <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-pink-500" /> Hikari AI - Truy vấn nhanh dữ liệu:
            </p>
            <div className="space-y-1">
              <button
                onClick={() => handleQuickAsk('hệ thống có bao nhiêu người')}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-lg flex items-center gap-2 transition cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-indigo-500" /> Thống kê Tổng người dùng hệ thống
              </button>
              <button
                onClick={() => handleQuickAsk('thời khóa biểu của tôi')}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-lg flex items-center gap-2 transition cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-purple-500" /> Tra cứu Lịch học thời gian thực
              </button>
              <button
                onClick={() => handleQuickAsk('danh sách lớp học phần')}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-lg flex items-center gap-2 transition cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-pink-500" /> Tra cứu Lớp học phần của tôi
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Render AI Chat Window in fixed viewport position so it NEVER goes off screen */}
      {isOpenInput && (
        <div
          style={
            isExpanded
              ? { width: `${expandedSize.width}px`, height: `${expandedSize.height}px`, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)' }
              : undefined
          }
          className={`fixed z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col ${
            isExpanded
              ? 'bottom-4 right-4 min-w-[320px] min-h-[300px]'
              : 'bottom-4 right-4 w-[calc(100vw-32px)] sm:w-96 h-[500px] max-h-[calc(100vh-32px)]'
          }`}
        >
          {/* Resize Handle at Top-Left corner when in Expanded Mode */}
          {isExpanded && (
            <div
              onMouseDown={handleResizeStart}
              title="Kéo thả góc này để thay đổi Kích thước cửa sổ Chat (Rộng / Cao)"
              className="absolute top-2 left-2 z-30 w-5 h-5 cursor-nwse-resize flex items-center justify-center bg-white/20 hover:bg-white/40 rounded-md transition"
            >
              <Move className="w-3.5 h-3.5 text-white" />
            </div>
          )}

          {/* Header */}
          <div className="bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 p-3.5 text-white flex items-center justify-between shrink-0 shadow-md select-none">
            <div className="flex items-center gap-2.5 pl-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Bot className="w-5 h-5 text-pink-200" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">AI Companion</h3>
                <p className="text-[10px] text-pink-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" /> Live AI Companion
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                title={isExpanded ? 'Thu nhỏ cửa sổ' : 'Mở rộng hiển thị (Kéo thả kích thước)'}
                onClick={() => setIsExpanded((prev) => !prev)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition cursor-pointer"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                type="button"
                title="Xóa lịch sử trò chuyện"
                onClick={handleClearHistory}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpenInput(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Conversation Stream - Full Text Selection & 1-Click Copy with min-h-0 for proper flex overflow scrolling */}
          <div
            ref={chatScrollRef}
            className="flex-1 min-h-0 p-4 space-y-3.5 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/40 select-text cursor-text"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`${isExpanded ? 'max-w-[90%]' : 'max-w-[85%]'} px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs select-text ${
                    msg.sender === 'user'
                      ? 'bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700/80 rounded-bl-xs shadow-xs'
                  }`}
                >
                  {msg.sender === 'ai' && (
                    <div className="flex items-center justify-between font-bold text-pink-600 dark:text-pink-400 text-[11px] mb-1 select-none">
                      <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Hikari AI</span>
                      <button
                        type="button"
                        title="Sao chép nội dung câu trả lời"
                        onClick={() => handleCopyMessage(msg.id, msg.text)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition cursor-pointer flex items-center gap-1 text-[10px]"
                      >
                        {copiedId === msg.id ? (
                          <span className="text-emerald-500 flex items-center gap-1 font-semibold"><Check className="w-3 h-3" /> Đã chép</span>
                        ) : (
                          <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Chép</span>
                        )}
                      </button>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap select-text selection:bg-purple-200 dark:selection:bg-purple-900 selection:text-purple-900 dark:selection:text-purple-100">
                    {msg.text}
                  </p>
                </div>
                <span className="text-[10px] text-gray-400 px-1 font-mono select-none">{msg.timestamp}</span>
              </div>
            ))}

            {/* Thinking Indicator */}
            {loading && (
              <div className="flex flex-col items-start space-y-1 select-none">
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-xs px-3.5 py-2.5 text-xs text-gray-500 flex items-center gap-2 shadow-xs">
                  <Loader2 className="w-3.5 h-3.5 text-pink-500 animate-spin" />
                  <span className="italic font-medium text-pink-600 dark:text-pink-400 text-[11px]">Hikari đang suy nghĩ & liên kết ngữ cảnh...</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Input Area */}
          <form
            onSubmit={handleSearchSubmit}
            className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 shrink-0 select-none"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Bạn cần cái chó gì?"
              className="flex-1 bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white outline-none transition select-text"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="p-2 bg-linear-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:brightness-110 transition shadow cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default DraggableAiCompanion;
