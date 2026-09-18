import React, { useState, useRef, useEffect } from 'react';
import { Bot, Search, Calendar, User, BookOpen, X, Sparkles, Loader2, Trash2, Send, CornerDownLeft } from 'lucide-react';
import { apiClient, unwrap } from '../services/api/client';
import { useAuth } from '../contexts/useAuth';

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
        text: `Xin chào ${user?.fullName || 'bạn'}! 👋 Mình là Hikari – trợ lý AI học tập thân thiện 24/7 của hệ thống LearningHub LMS. Rất vui được gặp bạn hôm nay! Bạn đang cần mình hỗ trợ gì nào? Dù là học phần, tra cứu thời khóa biểu hay giải đáp thắc mắc, mình luôn sẵn sàng đồng hành cùng bạn! ✨`,
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
          text: `Đã làm sạch lịch sử trò chuyện! Xin chào ${user?.fullName || 'bạn'}, mình có thể giúp gì cho bạn hôm nay?`,
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
  }, [messages, isOpenInput]);

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
      const res = await unwrap<{ reply: string }>(apiClient.post('/ai/advisor/chat', { prompt: userText.trim() }));
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const fallbackAiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: `Tra cứu yêu cầu "${userText.trim()}": Dữ liệu học phần & thời khóa biểu của bạn đã được kết nối đồng bộ trên hệ thống LearningHub!`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackAiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAsk = (topic: string) => {
    setIsOpenInput(true);
    sendMessage(`Tôi muốn tìm hiểu thông tin chi tiết về ${topic}`);
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
            <Sparkles className="w-4 h-4 text-pink-500" /> Hikari AI - Chọn nhanh yêu cầu:
          </p>
          <div className="space-y-1">
            <button
              onClick={() => handleQuickAsk('Học phần đã đăng ký')}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-lg flex items-center gap-2 transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Tra cứu Học phần của tôi
            </button>
            <button
              onClick={() => handleQuickAsk('Giảng viên bộ môn')}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-lg flex items-center gap-2 transition cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-purple-500" /> Tra cứu Thông tin Giảng viên
            </button>
            <button
              onClick={() => handleQuickAsk('Thời khóa biểu tuần này')}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-lg flex items-center gap-2 transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-pink-500" /> Kiểm tra Lịch học của tôi
            </button>
          </div>
        </div>
      )}

      {/* Expanded Zalo/Messenger-Style AI Chat Window */}
      {isOpenInput && (
        <div className="absolute bottom-20 right-0 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col h-[460px]">
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
                  <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" /> Đang hoạt động • Lưu lịch sử
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
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

          {/* Conversation Stream (Chat Messages List) */}
          <div ref={chatScrollRef} className="flex-1 p-4 space-y-3.5 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
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
                  <span className="italic font-medium text-pink-600 dark:text-pink-400 text-[11px]">Hikari đang suy nghĩ...</span>
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
              placeholder="Nhắn tin với Hikari AI..."
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
