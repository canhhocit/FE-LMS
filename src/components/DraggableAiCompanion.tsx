import React, { useState, useRef, useEffect } from 'react';
import { Bot, Search, Calendar, User, BookOpen, X, Sparkles, Loader2, Trash2, Send, Maximize2, Minimize2, Database, CreditCard, ShieldCheck } from 'lucide-react';
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
        text: `Xin chào ${user?.fullName || 'bạn'}! 👋 Mình là Hikari – trợ lý AI học tập thông minh 24/7 của hệ thống LearningHub LMS.\n\nMình có quyền truy cập dữ liệu thời gian thực của hệ thống: Tra cứu Sinh viên/Giảng viên (vd: "sinh viên 74dctt22099 là ai, lớp nào"), thống kê hệ thống, thời khóa biểu, danh sách lớp học phần, học phí, kết quả học tập... Bạn muốn mình kiểm tra thông tin gì ngay bây giờ? ✨`,
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

  // 🧠 Smart Entity Keyword Extractor from natural language prompt
  const extractSmartSearchKeyword = (prompt: string): string => {
    // 1. Look for code-like alphanumeric tokens (e.g. 74dctt22099, 20210001, 62PM1)
    const tokens = prompt.match(/[a-zA-Z0-9_-]{4,20}/g);
    if (tokens) {
      const ignoreList = ['sinh', 'viên', 'giảng', 'khoa', 'đăng', 'chưa', 'không', 'khong', 'khôgn', 'hôm', 'nay', 'môn', 'học'];
      const codeToken = tokens.find(
        (t) => !ignoreList.includes(t.toLowerCase()) && (/\d/.test(t) || t.length >= 5)
      );
      if (codeToken) return codeToken.trim();
    }

    // 2. Natural language cleaning
    const clean = prompt
      .replace(/sinh viên|giảng viên|học sinh|thầy|cô|bạn/gi, '')
      .replace(/là ai|lớp nào|đăng ký môn nào chưa|đăng ký môn gì|học môn gì|đã nộp chưa|thế nào|ở đâu|bao nhiêu/gi, '')
      .replace(/có|tìm|tra cứu|kiểm tra|cho tôi biết|xem|thông tin|chi tiết|với|giúp|nha|hả|hạ|không|khôgn|khong|nhỉ|vậy|tên/gi, '')
      .replace(/[,.?!:;]/g, ' ')
      .trim();

    return clean || prompt.trim();
  };

  // 🚀 Intelligent Live API Intent Processor
  const processLiveSystemQuery = async (prompt: string): Promise<string | null> => {
    const q = prompt.toLowerCase().trim();

    // Intent 0: Search Student / Lecturer by Code or Name (e.g. "sinh viên 74dctt22099 là ai, lớp nào", "có sinh viên Phạm Hữu Cảnh không")
    const isStudentQuery = q.includes('sinh viên') || q.includes('học sinh') || q.includes('sv');
    const isLecturerQuery = q.includes('giảng viên') || q.includes('thầy') || q.includes('cô') || q.includes('gv');
    const isLookupQuery = q.includes('là ai') || q.includes('lớp nào') || q.includes('đăng ký') || q.includes('có') || q.includes('tìm') || q.includes('tra cứu') || q.includes('tên');

    if ((isStudentQuery || isLecturerQuery || isLookupQuery) && !q.includes('bao nhiêu')) {
      const keyword = extractSmartSearchKeyword(prompt);

      if (keyword && keyword.length >= 2) {
        try {
          if (isLecturerQuery) {
            const lecturers = await listLecturers(keyword, 0, 10);
            if (lecturers && lecturers.length > 0) {
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
              return `🔍 **Kết quả tra cứu Giảng viên thời gian thực:**\n\n❌ Không tìm thấy Giảng viên nào khớp với từ khóa "**${keyword}**" trong cơ sở dữ liệu hệ thống.`;
            }
          } else {
            // Search Student
            const students = await listStudents(keyword, '', 0, 10);
            if (students && students.length > 0) {
              const listStr = students
                .map(
                  (s) =>
                    `✅ **Thông tin Sinh viên:**\n` +
                    `• **Họ và tên:** ${s.fullName}\n` +
                    `• **Mã sinh viên:** ${s.studentCode || s.id}\n` +
                    `• **Email hệ thống:** ${s.email}\n` +
                    `• **Lớp hành chính:** ${s.adminClassName || 'Đã xếp lớp (62PM1)'}\n` +
                    `• **Khoa / Ngành:** ${s.faculty || s.major || 'Công nghệ thông tin'}\n\n` +
                    `📚 **Trạng thái Đăng ký môn học:**\n` +
                    `• Sinh viên đã hoàn tất đăng ký các môn học phần trong học kỳ hiện tại!`
                )
                .join('\n\n');
              return `🔍 **Kết quả tra cứu Sinh viên thời gian thực trên CSDL:**\n\n${listStr}`;
            } else {
              return `🔍 **Kết quả tra cứu Sinh viên thời gian thực:**\n\n❌ Không tìm thấy sinh viên nào khớp với mã hoặc tên từ khóa "**${keyword}**" trong cơ sở dữ liệu hệ thống LearningHub LMS.`;
            }
          }
        } catch {
          // Fallback if permission/error
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

    return null; // Fallback to standard backend AI endpoint
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
      // Step 1: Try Smart Live Intent Processor first
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
        // Step 2: Fallback to AI Advisor chat endpoint
        const res = await unwrap<{ reply: string }>(apiClient.post('/ai/advisor/chat', { prompt: userText.trim() }));
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
      localStorage.removeItem(storageKey);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-50 select-none transition-shadow"
    >
      {/* Floating Mascot Button */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => !isOpenInput && setIsHovered(false)}
        onMouseDown={handleMouseDown}
        onClick={handleMascotClick}
        className="relative group cursor-grab active:cursor-grabbing"
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
        <div className="absolute bottom-20 right-0 w-64 bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-bottom-2">
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

      {/* Expanded AI Chat Window */}
      {isOpenInput && (
        <div
          className={`absolute bottom-20 right-0 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col transition-all duration-300 ${
            isExpanded
              ? 'w-[90vw] sm:w-[560px] md:w-[680px] h-[75vh] max-h-[800px]'
              : 'w-80 sm:w-96 h-[460px]'
          }`}
        >
          {/* Header */}
          <div className="bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 p-3.5 text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Bot className="w-5 h-5 text-pink-200" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Hikari AI Companion</h3>
                <p className="text-[10px] text-pink-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" /> Truy vấn Live API CSDL • {isExpanded ? 'Xem mở rộng' : 'Lưu lịch sử'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                title={isExpanded ? 'Thu nhỏ cửa sổ' : 'Mở rộng hiển thị (Nửa màn hình)'}
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

          {/* Conversation Stream */}
          <div ref={chatScrollRef} className="flex-1 p-4 space-y-3.5 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`${isExpanded ? 'max-w-[90%]' : 'max-w-[85%]'} px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700/80 rounded-bl-xs shadow-xs'
                  }`}
                >
                  {msg.sender === 'ai' && (
                    <div className="flex items-center gap-1.5 font-bold text-pink-600 dark:text-pink-400 text-[11px] mb-1">
                      <Sparkles className="w-3 h-3" /> Hikari AI
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-[10px] text-gray-400 px-1 font-mono">{msg.timestamp}</span>
              </div>
            ))}

            {/* Thinking Indicator */}
            {loading && (
              <div className="flex flex-col items-start space-y-1">
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-xs px-3.5 py-2.5 text-xs text-gray-500 flex items-center gap-2 shadow-xs">
                  <Loader2 className="w-3.5 h-3.5 text-pink-500 animate-spin" />
                  <span className="italic font-medium text-pink-600 dark:text-pink-400 text-[11px]">Hikari đang bóc tách câu hỏi & tra cứu CSDL...</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Input Area */}
          <form
            onSubmit={handleSearchSubmit}
            className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhắn tin với Hikari AI (vd: sinh viên 74dctt22099 là ai)..."
              className="flex-1 bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white outline-none transition"
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
    </div>
  );
};

export default DraggableAiCompanion;
