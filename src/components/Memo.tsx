import { useState, useEffect } from 'react';
import { StickyNote } from 'lucide-react';

export const Memo = () => {
  const [content, setContent] = useState(() => {
    return localStorage.getItem('zen-memo') || '';
  });

  useEffect(() => {
    localStorage.setItem('zen-memo', content);
  }, [content]);

  return (
    <div className="w-full h-full flex flex-col p-4 text-white select-none bg-yellow-200/10 backdrop-blur-md rounded-2xl border border-yellow-200/20 transition-all duration-300 hover:bg-yellow-200/20">
      <div className="flex items-center gap-2 mb-2 text-yellow-100/80">
        <StickyNote size={18} />
        <span className="font-medium text-sm">便签</span>
      </div>
      
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="在此记录想法..."
        className="flex-1 w-full bg-transparent resize-none focus:outline-none text-sm leading-relaxed text-white/90 placeholder-white/30 custom-scrollbar"
        spellCheck={false}
      />
    </div>
  );
};
