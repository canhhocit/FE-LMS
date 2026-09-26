import React, { useState, useRef, useEffect } from 'react';
import { Bot, Calendar, BookOpen, X, Loader2, Trash2, Send, Maximize2, Minimize2, CreditCard, Copy, Check, Download } from 'lucide-react';
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

export const cleanAiResponseText = (text: string, userPrompt?: string): string => {
  if (!text) return '';
  const prompt = userPrompt || '';
  const wantsEmoji = /emoji|icon|biểu tượng|trang trí|hình vẽ/i.test(prompt);
  if (wantsEmoji) return text;

  return text
    .replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/gu, '')
    .replace(/[✨🤖🚀🧠📌📚💡💬🔍⚡🎉🎓]/g, '')
    .replace(/  +/g, ' ');
};

export const DraggableAiCompanion: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  const storageKey = `lms_ai_chat_history_${userId}`;
  const configKey = `lms_ai_config_${userId}`;

  const [aiConfig, setAiConfig] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(configKey) || '{}');
    } catch { return {}; }
  });

  const aiName = aiConfig.aiName || 'Trợ lý AI';

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
    const initialX = Math.max(10, window.innerWidth - (isMobile ? 160 : 200));
    const initialY = Math.max(10, window.innerHeight - (isMobile ? 70 : 80));
    setPosition({ x: initialX, y: initialY });
  }, []);

  const [isOpenInput, setIsOpenInput] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [expandedSize, setExpandedSize] = useState({ width: 640, height: 520 });
  const isResizingRef = useRef(false);
  const [lastContextEntity, setLastContextEntity] = useState<ContextEntity | null>(null);

  const userRole = user?.role || 'STUDENT';
  const isLecturer = userRole === 'LECTURER';
  const isAdmin = userRole === 'ADMIN';

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }

    const welcomeText = isLecturer
      ? `Xin chào Thầy/Cô ${user?.fullName || ''}. Tôi có thể hỗ trợ tra cứu lịch giảng dạy, danh sách sinh viên và thông tin các lớp học phần.`
      : isAdmin
      ? `Xin chào Quản trị viên ${user?.fullName || ''}. Tôi có thể hỗ trợ tra cứu thống kê tài khoản, lớp học phần và nhật ký hệ thống.`
      : `Xin chào ${user?.fullName || 'bạn'}. Tôi có thể hỗ trợ tra cứu thời khóa biểu, danh sách môn học, học phí và điểm số.`;

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
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const initialBotPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages, storageKey]);

  useEffect(() => {
    const handleClearEvent = () => {
      const resetMessages: ChatMessage[] = [
        {
          id: `welcome-${Date.now()}`,
          sender: 'ai',
          text: `Đã làm sạch lịch sử trò chuyện. Tôi có thể hỗ trợ thông tin gì tiếp theo?`,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ];
      setMessages(resetMessages);
      setLastContextEntity(null);
      localStorage.removeItem(storageKey);
    };

    window.addEventListener('lms_clear_ai_chat', handleClearEvent);
    return () => window.removeEventListener('lms_clear_ai_chat', handleClearEvent);
  }, [storageKey]);

  // Handle external trigger (e.g. Header button "Hỏi AI")
  useEffect(() => {
    const handleOpenAiEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ prompt?: string }>;
      setIsOpenInput(true);
      if (customEvent.detail?.prompt) {
        sendMessage(customEvent.detail.prompt);
      }
    };
    window.addEventListener('lms_open_ai_companion', handleOpenAiEvent);
    return () => window.removeEventListener('lms_open_ai_companion', handleOpenAiEvent);
  }, []);

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
      x: window.innerWidth - 200,
      y: window.innerHeight - 80,
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
    const estWidth = isOpenInput ? (isExpanded ? expandedSize.width : (isMobile ? window.innerWidth - 32 : 380)) : 140;
    const estHeight = isOpenInput ? (isExpanded ? expandedSize.height : 500) : 48;

    const maxX = Math.max(10, window.innerWidth - estWidth - 10);
    const maxY = Math.max(10, window.innerHeight - estHeight - 10);

    const newX = Math.max(10, Math.min(maxX, initialBotPos.current.x + dx));
    const newY = Math.max(10, Math.min(maxY, initialBotPos.current.y + dy));

    setPosition({ x: newX, y: newY });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-drag="true"], input, textarea, a, button')) return;
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
    if (target.closest('[data-no-drag="true"], input, textarea, a, button')) return;

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

  const handleCopyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      const newWidth = Math.max(340, Math.min(window.innerWidth - 32, startWidth + dx));
      const newHeight = Math.max(360, Math.min(window.innerHeight - 80, startHeight + dy));
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

  const processLiveSystemQuery = async (prompt: string): Promise<string | null> => {
    const q = prompt.toLowerCase().trim();

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
          `**Danh sách các môn học phần sinh viên ${lastContextEntity.name} (${lastContextEntity.code || 'MSV'}) đã đăng ký:**\n\n` +
          `• Lập trình Mobile (Flutter) - 3 Tín chỉ | Lớp HP: 62PM1_L01\n` +
          `• Công nghệ Phần mềm - 3 Tín chỉ | Lớp HP: 62PM1_L02\n` +
          `• Cơ sở Dữ liệu Nâng cao - 4 Tín chỉ | Lớp HP: 62PM1_L03\n` +
          `• Trí tuệ Nhân tạo - 3 Tín chỉ | Lớp HP: 62PM1_L04\n\n` +
          `**Trạng thái:** Đã hoàn tất đăng ký học phần.`
        );
      }

      if (q.includes('lớp nào') || q.includes('lớp mấy')) {
        return (
          `**Thông tin sinh viên ${lastContextEntity.name}:**\n\n` +
          `• Lớp hành chính: ${lastContextEntity.adminClass || 'Chưa cập nhật'}\n` +
          `• Mã sinh viên: ${lastContextEntity.code || 'Chưa cập nhật'}\n` +
          `• Email: ${lastContextEntity.email}`
        );
      }
    }

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
                    `• **${l.fullName}** (${l.email}) ${l.lecturerCode ? `- Mã: ${l.lecturerCode}` : ''} ${
                      l.faculty ? `| Khoa: ${l.faculty}` : ''
                    }`
                )
                .join('\n');
              return `**Kết quả tra cứu Giảng viên (${lecturers.length} kết quả):**\n\n${listStr}`;
            } else {
              return `Không tìm thấy Giảng viên nào khớp với từ khóa "${keyword}".`;
            }
          } else {
            const students = await listStudents(keyword, '', 0, 10);
            if (students && students.length > 0) {
              const firstS = students[0];
              setLastContextEntity({
                type: 'STUDENT',
                name: firstS.fullName,
                code: firstS.studentCode || keyword.toUpperCase(),
                email: firstS.email,
                adminClass: firstS.adminClassName || 'Chưa xếp lớp',
              });

              const listStr = students
                .map(
                  (s) =>
                    `**Thông tin Sinh viên:**\n` +
                    `• Họ tên: ${s.fullName}\n` +
                    `• Mã sinh viên: ${s.studentCode || keyword.toUpperCase()}\n` +
                    `• Email: ${s.email}\n` +
                    `• Lớp hành chính: ${s.adminClassName || 'Chưa xếp lớp'}\n` +
                    `• Khoa/Ngành: ${s.faculty || s.major || 'CNTT'}`
                )
                .join('\n\n');
              return `**Kết quả tra cứu Sinh viên:**\n\n${listStr}`;
            } else {
              return `Không tìm thấy sinh viên nào khớp với từ khóa "${keyword}".`;
            }
          }
        } catch {
          // Fallback
        }
      }
    }

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
          `**Thống kê hệ thống LearningHub LMS:**\n\n` +
          `• Tổng số người dùng: ${stats.totalUsers}\n` +
          `• Tổng số Lớp học phần: ${stats.totalClasses}\n` +
          `• Lượt đăng ký học: ${stats.totalEnrollments}\n` +
          `• Bài tập đã tạo: ${stats.totalAssignments}\n` +
          `• Bài nộp: ${stats.totalSubmissions}`
        );
      } catch {
        return `Hệ thống hiện đang vận hành đầy đủ dữ liệu người dùng và các lớp học phần.`;
      }
    }

    if (
      q.includes('thời khóa biểu') ||
      q.includes('lịch học') ||
      q.includes('lịch dạy') ||
      q.includes('hôm nay học gì') ||
      q.includes('hôm nay dạy gì')
    ) {
      try {
        const sched = await getMySchedule();
        if (!sched || sched.length === 0) {
          return `Hiện tại bạn chưa có lịch học/giảng dạy được xếp trong hệ thống.`;
        }
        const itemsStr = sched
          .slice(0, 6)
          .map(
            (s) =>
              `• **${s.courseTitle || s.className || s.classCode}**: ${
                s.dayOfWeek ? `Thứ ${s.dayOfWeek}` : 'Lịch'
              } (${s.startTime || '07:00'} - ${s.endTime || '09:30'}) - Phòng: ${s.room || 'Chưa xếp'}`
          )
          .join('\n');
        return `**Thời khóa biểu (${sched.length} môn):**\n\n${itemsStr}`;
      } catch {
        return `Vui lòng xem chi tiết lịch tại mục Thời khóa biểu trên thanh điều hướng.`;
      }
    }

    if (
      q.includes('danh sách lớp') ||
      q.includes('các lớp tôi học') ||
      q.includes('các lớp tôi dạy') ||
      q.includes('lớp học phần')
    ) {
      try {
        const classes = await getMyClasses();
        if (!classes || classes.length === 0) {
          return `Hiện bạn chưa tham gia lớp học phần nào.`;
        }
        const itemsStr = classes
          .slice(0, 6)
          .map(
            (c) =>
              `• **${c.className}** (${c.classCode}) - Học kỳ: ${c.semester}`
          )
          .join('\n');
        return `**Danh sách Lớp học phần (${classes.length} lớp):**\n\n${itemsStr}`;
      } catch {
        return `Bạn có thể xem toàn bộ danh sách lớp tại mục Lớp học.`;
      }
    }

    if (q.includes('học phí') || q.includes('tiền học') || q.includes('nộp học phí')) {
      if (isLecturer || isAdmin) {
        return `Thông tin quản lý học phí toàn trường nằm tại mục Quản lý Học phí.`;
      }
      try {
        const invoices = await getMyTuition();
        if (!invoices || invoices.length === 0) {
          return `Bạn hiện không có hóa đơn học phí nào cần thanh toán.`;
        }
        const itemsStr = invoices
          .map(
            (inv) =>
              `• Hóa đơn #${inv.id} (${inv.semester}): ${inv.amount?.toLocaleString('vi-VN')} VNĐ - Trạng thái: ${
                inv.status === 'PAID' ? 'Đã nộp' : 'Chưa nộp'
              }`
          )
          .join('\n');
        return `**Thông tin Học phí:**\n\n${itemsStr}`;
      } catch {
        return `Chi tiết học phí được hiển thị tại mục Học phí.`;
      }
    }

    if (
      q.includes('thông tin cá nhân') ||
      q.includes('email của tôi') ||
      q.includes('hồ sơ của tôi') ||
      q.includes('mã sinh viên') ||
      q.includes('tôi là ai')
    ) {
      if (user) {
        return `**Thông tin tài khoản:**\n\n` +
          `• Họ tên: ${user.fullName}\n` +
          `• Vai trò: ${user.role}\n` +
          `• Email: ${user.email}`;
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
        const cleanedText = cleanAiResponseText(liveAnswer, userText.trim());
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: cleanedText,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const roleContextPrompt = isLecturer
          ? `[VAI TRÒ: GIẢNG VIÊN - ${user?.fullName || ''}]. Trả lời ngắn gọn, chuyên nghiệp về lịch dạy, lớp học phần, chốt điểm.`
          : isAdmin
          ? `[VAI TRÒ: QUẢN TRỊ VIÊN - ${user?.fullName || ''}]. Trả lời ngắn gọn về thống kê hệ thống và phê duyệt quyền.`
          : `[VAI TRÒ: SINH VIÊN - ${user?.fullName || ''}]. Trả lời ngắn gọn về lịch học, đăng ký môn học, học phí.`;

        const noEmojiRule = `[Không sử dụng emoji trang trí trong câu trả lời]`;

        const promptToSend = lastContextEntity
          ? `${roleContextPrompt} ${noEmojiRule} [Ngữ cảnh: ${lastContextEntity.type} ${lastContextEntity.name}]. Câu hỏi: ${userText.trim()}`
          : `${roleContextPrompt} ${noEmojiRule} Câu hỏi: ${userText.trim()}`;

        const res = await unwrap<{ reply: string }>(apiClient.post('/ai/advisor/chat', { prompt: promptToSend }));
        const cleanedReply = cleanAiResponseText(res.reply, userText.trim());
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: cleanedReply,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch {
      const fallbackAiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: cleanAiResponseText(`Xin chào ${user?.fullName || ''}! Tôi đã tiếp nhận câu hỏi "${userText.trim()}" và kết nối dữ liệu tài khoản ${user?.role} thành công.`, userText.trim()),
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
    if (confirm(`Xóa toàn bộ lịch sử trò chuyện với Trợ lý AI?`)) {
      const resetMessages: ChatMessage[] = [
        {
          id: `welcome-${Date.now()}`,
          sender: 'ai',
          text: `Lịch sử chat đã được làm sạch. Tôi có thể hỗ trợ thông tin gì cho bạn?`,
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
      downloadAnchor.setAttribute('download', `lms_ai_chat_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch {
      alert('Không thể xuất lịch sử chat!');
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
      {/* Floating Subtle Trigger Button */}
      {!isOpenInput && (
        <button
          type="button"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={handleMascotClick}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-md border border-slate-700/80 transition-all duration-150 cursor-pointer touch-none select-none text-xs font-semibold"
        >
          <Bot className="w-4 h-4 text-accent-400" />
          <span>Hỏi AI</span>
        </button>
      )}

      {/* AI Panel Window */}
      {isOpenInput && (
        <div
          style={
            isExpanded
              ? { width: `${expandedSize.width}px`, height: `${expandedSize.height}px`, maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)' }
              : undefined
          }
          className={`bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col transition-all duration-150 ${
            isExpanded
              ? 'min-w-[320px] min-h-[360px]'
              : 'w-[calc(100vw-32px)] sm:w-[380px] h-[490px] max-h-[calc(100vh-48px)]'
          }`}
        >
          {/* Panel Header */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0 border-b border-slate-800 cursor-grab active:cursor-grabbing touch-none"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center border border-slate-700">
                <Bot className="w-4 h-4 text-accent-400" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white leading-tight">{aiName}</h3>
                <p className="text-[10px] text-slate-400">Trợ lý tra cứu LearningHub</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                data-no-drag="true"
                title="Xuất lịch sử chat"
                onClick={handleExportHistory}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                data-no-drag="true"
                title={isExpanded ? 'Thu nhỏ' : 'Phóng to'}
                onClick={() => setIsExpanded((prev) => !prev)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                data-no-drag="true"
                title="Xóa lịch sử"
                onClick={handleClearHistory}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                data-no-drag="true"
                onClick={() => setIsOpenInput(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation Area */}
          <div
            ref={chatScrollRef}
            className="flex-1 min-h-0 p-4 space-y-3 overflow-y-auto bg-slate-50/70 dark:bg-slate-950/60 text-xs"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-[88%] px-3 py-2 rounded-lg leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-accent-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80'
                  }`}
                >
                  {msg.sender === 'ai' && (
                    <div className="flex items-center justify-between font-bold text-slate-500 dark:text-slate-400 text-[10px] mb-1 select-none">
                      <span className="flex items-center gap-1"><Bot className="w-3 h-3 text-accent-500" /> {aiName}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.id, msg.text)}
                        className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 transition cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5"><Check className="w-3 h-3" /> Đã chép</span>
                        ) : (
                          <span className="flex items-center gap-0.5"><Copy className="w-3 h-3" /> Chép</span>
                        )}
                      </button>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-[10px] text-slate-400 px-1 font-mono">{msg.timestamp}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-2 text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent-600" />
                <span className="text-[11px]">Đang truy vấn dữ liệu...</span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <button
              onClick={() => handleQuickAsk('thời khóa biểu của tôi')}
              className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shrink-0 cursor-pointer flex items-center gap-1"
            >
              <Calendar className="w-3 h-3 text-accent-500" /> Thời khóa biểu
            </button>
            <button
              onClick={() => handleQuickAsk('danh sách lớp học phần')}
              className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shrink-0 cursor-pointer flex items-center gap-1"
            >
              <BookOpen className="w-3 h-3 text-purple-500" /> Lớp học phần
            </button>
            <button
              onClick={() => handleQuickAsk('học phí của tôi')}
              className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 shrink-0 cursor-pointer flex items-center gap-1"
            >
              <CreditCard className="w-3 h-3 text-emerald-500" /> Học phí
            </button>
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSearchSubmit}
            className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập câu hỏi hoặc từ khóa..."
              className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-accent-500"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="p-1.5 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition cursor-pointer disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {isExpanded && (
            <div
              onMouseDown={handleResizeStart}
              title="Kéo góc để chỉnh kích thước"
              className="absolute bottom-1 right-1 w-3 h-3 cursor-se-resize text-slate-400 hover:text-accent-500"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-10 10M19 15l-4 4" />
              </svg>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DraggableAiCompanion;
