import { useState, useEffect } from 'react';
import { CalendarHeart, Minus, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useToastStore } from '../store/useToastStore';

export const BirthdaySetupModal = () => {
  const { birthday, setBirthday } = useStore();
  const { addToast } = useToastStore();
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);

  useEffect(() => {
    if (birthday === null) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [birthday]);

  if (!isOpen || birthday) return null;

  const handleSubmit = () => {
    // Format MM-DD
    const formatted = `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    setBirthday(formatted);

    // Add to Calendar Events
    try {
        const existing = localStorage.getItem('zen-calendar-events');
        const events = existing ? JSON.parse(existing) : [];
        // Check if already exists
        const eventId = 'birthday-event';
        // Remove old if any
        const filtered = events.filter((e: any) => e.id !== eventId);
        
        // Add recurring event for current and next year
        const currentYear = new Date().getFullYear();
        const event1 = {
            id: eventId + '-' + currentYear,
            title: '🎂 我的生日',
            date: `${currentYear}-${formatted}`,
            time: '00:00',
            color: 'pink'
        };
        const event2 = {
            id: eventId + '-' + (currentYear + 1),
            title: '🎂 我的生日',
            date: `${currentYear + 1}-${formatted}`,
            time: '00:00',
            color: 'pink'
        };
        
        filtered.push(event1, event2);
        localStorage.setItem('zen-calendar-events', JSON.stringify(filtered));
    } catch (e) {}

    addToast({ type: 'success', message: '生日已设置！我们会为您准备惊喜 🎉' });
    setIsOpen(false);
  };

  const handleSkip = () => {
      setBirthday('skip');
      setIsOpen(false);
  };

  const adjustValue = (type: 'month' | 'day', delta: number) => {
      if (type === 'month') {
          let next = month + delta;
          if (next < 1) next = 12;
          if (next > 12) next = 1;
          setMonth(next);
      } else {
          let next = day + delta;
          const maxDays = new Date(2024, month, 0).getDate(); // Leap year safe enough for UI
          if (next < 1) next = maxDays;
          if (next > maxDays) next = 1;
          setDay(next);
      }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl w-[400px] shadow-2xl text-center relative overflow-hidden">
        {/* Decor */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CalendarHeart className="text-pink-400" size={32} />
        </div>

        <h3 className="text-xl font-bold text-white mb-2">欢迎来到静谧新标签页</h3>
        <p className="text-zinc-400 text-sm mb-8">告诉我们您的生日，让我们在那个特别的日子为您送上祝福。</p>

        <div className="flex gap-4 mb-8 justify-center items-center">
            {/* Month Picker */}
            <div className="flex flex-col items-center gap-2">
                <button 
                    onClick={() => adjustValue('month', 1)}
                    className="p-1 text-zinc-500 hover:text-white transition-colors"
                >
                    <Plus size={16} />
                </button>
                <div className="w-20 h-16 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center relative group">
                    <span className="text-2xl font-medium text-white">{month.toString().padStart(2, '0')}</span>
                    <span className="absolute right-2 bottom-1 text-[10px] text-zinc-500">月</span>
                </div>
                <button 
                    onClick={() => adjustValue('month', -1)}
                    className="p-1 text-zinc-500 hover:text-white transition-colors"
                >
                    <Minus size={16} />
                </button>
            </div>

            <div className="text-zinc-600 text-2xl font-light pb-2">/</div>

            {/* Day Picker */}
            <div className="flex flex-col items-center gap-2">
                <button 
                    onClick={() => adjustValue('day', 1)}
                    className="p-1 text-zinc-500 hover:text-white transition-colors"
                >
                    <Plus size={16} />
                </button>
                <div className="w-20 h-16 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center relative group">
                    <span className="text-2xl font-medium text-white">{day.toString().padStart(2, '0')}</span>
                    <span className="absolute right-2 bottom-1 text-[10px] text-zinc-500">日</span>
                </div>
                <button 
                    onClick={() => adjustValue('day', -1)}
                    className="p-1 text-zinc-500 hover:text-white transition-colors"
                >
                    <Minus size={16} />
                </button>
            </div>
        </div>

        <div className="flex flex-col gap-3">
            <button 
              onClick={handleSubmit}
              className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-pink-900/20 active:scale-[0.98]"
            >
              确认设置
            </button>
            <button 
              onClick={handleSkip}
              className="text-zinc-500 hover:text-zinc-300 text-xs py-2 transition-colors"
            >
              跳过 (稍后在设置中配置)
            </button>
        </div>
      </div>
    </div>
  );
};
