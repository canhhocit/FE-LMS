import React, { useState, useRef } from 'react';
import { Bot, MessageSquare, Search, Calendar, User, BookOpen, X, Sparkles } from 'lucide-react';

export const DraggableAiCompanion: React.FC = () => {
  const [position, setPosition] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 180 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isOpenInput, setIsOpenInput] = useState(false);
  const [query, setQuery] = useState('');
  const [aiReply, setAiReply] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = Math.max(10, Math.min(window.innerWidth - 90, e.clientX - dragOffset.x));
    const newY = Math.max(10, Math.min(window.innerHeight - 90, e.clientY - dragOffset.y));
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleQuickAsk = (topic: string) => {
    setIsOpenInput(true);
    setQuery(`Tôi muốn tìm hiểu về ${topic}`);
    setAiReply(`🤖 Hikari AI: Đang tra cứu thông tin chi tiết về [${topic}] trong hệ thống LearningHub LMS...`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setAiReply(`🤖 Hikari AI: Trả lời yêu cầu "${query}": Dữ liệu học phần & lịch học của bạn đã được cập nhật mới nhất!`);
  };

  return (
    <div
      ref={containerRef}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="fixed z-50 select-none transition-shadow cursor-grab active:cursor-grabbing"
    >
      {/* Floating Mascot Button */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => !isOpenInput && setIsHovered(false)}
        onMouseDown={handleMouseDown}
        onClick={() => setIsOpenInput(!isOpenInput)}
        className="relative group"
      >
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-1 shadow-2xl hover:scale-110 transition duration-300 flex items-center justify-center">
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
              onClick={() => handleQuickAsk('Học phần A')}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-lg flex items-center gap-2 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Tra cứu Học phần A
            </button>
            <button
              onClick={() => handleQuickAsk('Giảng viên A')}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-lg flex items-center gap-2 transition"
            >
              <User className="w-3.5 h-3.5 text-purple-500" /> Tra cứu Giảng viên A
            </button>
            <button
              onClick={() => handleQuickAsk('Lịch học của tôi')}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-950/40 rounded-lg flex items-center gap-2 transition"
            >
              <Calendar className="w-3.5 h-3.5 text-pink-500" /> Kiểm tra Lịch học của tôi
            </button>
          </div>
        </div>
      )}

      {/* Expanded Interactive AI Dialog Box */}
      {isOpenInput && (
        <div className="absolute bottom-20 right-0 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6 text-pink-300" />
              <div>
                <h3 className="text-sm font-bold">Hikari AI Companion</h3>
                <p className="text-[10px] text-pink-100">Hỗ trợ tra cứu học tập thông minh 24/7</p>
              </div>
            </div>
            <button onClick={() => setIsOpenInput(false)} className="text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
            {aiReply ? (
              <div className="p-3 bg-pink-50 dark:bg-pink-950/40 rounded-xl border border-pink-200 dark:border-pink-900 text-xs text-gray-800 dark:text-gray-200 space-y-1">
                <p className="font-semibold text-pink-700 dark:text-pink-300">{aiReply}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hãy nhập bất kỳ câu hỏi nào về môn học, giảng viên hoặc thời khóa biểu của bạn bên dưới!
              </p>
            )}
          </div>

          <form onSubmit={handleSearchSubmit} className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ví dụ: tôi muốn tìm hiểu về học phần A..."
              className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:brightness-110 transition shadow"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default DraggableAiCompanion;
