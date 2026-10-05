const fs = require('fs');

let content = fs.readFileSync('src/components/DraggableAiCompanion.tsx', 'utf8');

// 1. Add savedBubblePos ref
if (!content.includes('savedBubblePos')) {
    content = content.replace(
        'const dragStartPos = useRef({ x: 0, y: 0 });',
        'const dragStartPos = useRef({ x: 0, y: 0 });\n  const savedBubblePos = useRef<{ x: number, y: number } | null>(null);'
    );
}

// 2. Change estWidth and bounds
content = content.replace(
    'const buttonWidth = 100;',
    'const buttonWidth = 48;'
);
content = content.replace(
    'x: window.innerWidth - 124,',
    'x: window.innerWidth - 72,'
);
content = content.replace(
    'const estWidth = isOpenInput ? (isExpanded ? expandedSize.width : (isMobile ? window.innerWidth - 32 : 380)) : 140;',
    'const estWidth = isOpenInput ? (isExpanded ? expandedSize.width : (isMobile ? window.innerWidth - 32 : 380)) : 48;'
);
content = content.replace(
    'const maxX = Math.max(10, window.innerWidth - estWidth - 10);\n    const maxY = Math.max(10, window.innerHeight - estHeight - 10);\n\n    const newX = Math.max(10, Math.min(maxX, initialBotPos.current.x + dx));\n    const newY = Math.max(10, Math.min(maxY, initialBotPos.current.y + dy));',
    'const maxX = Math.max(2, window.innerWidth - estWidth - 2);\n    const maxY = Math.max(2, window.innerHeight - estHeight - 2);\n\n    const newX = Math.max(2, Math.min(maxX, initialBotPos.current.x + dx));\n    const newY = Math.max(2, Math.min(maxY, initialBotPos.current.y + dy));'
);

// In handleStartDrag, reset savedBubblePos
if (content.includes('isDraggingRef.current = true;')) {
    content = content.replace(
        'isDraggingRef.current = true;\n    hasMovedRef.current = false;',
        'isDraggingRef.current = true;\n    hasMovedRef.current = false;\n    if (isOpenInput) savedBubblePos.current = null;'
    );
}

// 3. Add effect to shift position on open/close
const effectCode = `
  useEffect(() => {
    if (isOpenInput && position) {
      // Save bubble position before expanding
      savedBubblePos.current = { ...position };
      const isMobile = window.innerWidth < 640;
      const estWidth = isExpanded ? expandedSize.width : (isMobile ? window.innerWidth - 32 : 380);
      const estHeight = isExpanded ? expandedSize.height : 500;
      
      let newX = position.x;
      let newY = position.y;
      
      const maxX = Math.max(2, window.innerWidth - estWidth - 2);
      const maxY = Math.max(2, window.innerHeight - estHeight - 2);
      
      if (newX > maxX) newX = maxX;
      if (newY > maxY) newY = maxY;
      
      if (newX !== position.x || newY !== position.y) {
         setPosition({ x: newX, y: newY });
      }
    } else if (!isOpenInput && savedBubblePos.current) {
      setPosition(savedBubblePos.current);
      savedBubblePos.current = null;
    }
  }, [isOpenInput]);
`;

if (!content.includes('savedBubblePos.current = { ...position };')) {
    content = content.replace(
        'const [isOpenInput, setIsOpenInput] = useState(false);',
        'const [isOpenInput, setIsOpenInput] = useState(false);' + effectCode
    );
}

// 4. Update the trigger button
const oldButton = `{/* Floating Subtle Trigger Button */}
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
      )}`;

const newButton = `{/* Floating Subtle Trigger Button */}
      {!isOpenInput && (
        <button
          type="button"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={handleMascotClick}
          className="group relative flex items-center justify-center w-12 h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-lg border border-slate-700/80 transition-all duration-200 cursor-pointer touch-none select-none hover:scale-105 active:scale-95"
        >
          <Bot className="w-6 h-6 text-accent-400" />
          
          {/* Comic Bubble Tooltip */}
          <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-max pointer-events-none origin-bottom scale-95 group-hover:scale-100 z-50">
            Bạn cần hỗ trợ gì?
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-800 border-r border-b border-slate-200 dark:border-slate-700 rotate-45"></div>
          </div>
        </button>
      )}`;

content = content.replace(oldButton, newButton);

fs.writeFileSync('src/components/DraggableAiCompanion.tsx', content);
console.log('done');
