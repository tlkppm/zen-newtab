import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw, Plus, Trash2, Clock, Settings2 } from 'lucide-react';
import { Solar, Lunar, HolidayUtil } from 'lunar-javascript';
import dayjs from 'dayjs';
import { useToastStore } from '../store/useToastStore';

// Types
interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  color?: string;
}

type ViewMode = 'month' | 'week';
type ThemeColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink';

const THEME_COLORS: Record<ThemeColor, string> = {
  blue: 'bg-blue-600',
  purple: 'bg-purple-600',
  green: 'bg-emerald-600',
  orange: 'bg-orange-600',
  pink: 'bg-pink-600',
};

const THEME_TEXT_COLORS: Record<ThemeColor, string> = {
  blue: 'text-blue-400',
  purple: 'text-purple-400',
  green: 'text-emerald-400',
  orange: 'text-orange-400',
  pink: 'text-pink-400',
};

export const CalendarWidget = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [theme, setTheme] = useState<ThemeColor>('blue');
  
  // UI States
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  
  const { addToast } = useToastStore();

  // Load data from local storage
  useEffect(() => {
    const savedEvents = localStorage.getItem('zen-calendar-events');
    if (savedEvents) {
      try {
        setEvents(JSON.parse(savedEvents));
      } catch (e) {}
    }
    
    const savedTheme = localStorage.getItem('zen-calendar-theme');
    if (savedTheme) {
      setTheme(savedTheme as ThemeColor);
    }
  }, []);

  // Generate calendar days
  const calendarData = useMemo(() => {
    const days = [];
    
    if (viewMode === 'month') {
        const year = currentDate.year();
        const month = currentDate.month(); // 0-11
        const firstDay = currentDate.startOf('month');
        const lastDay = currentDate.endOf('month');
        
        // Start from Monday (1) -> Sunday (7)
        // dayjs.day(): 0(Sun) - 6(Sat)
        let startDayOfWeek = firstDay.day() as number; 
        if (startDayOfWeek === 0) startDayOfWeek = 7;
        
        // Previous month padding
        for (let i = startDayOfWeek - 1; i > 0; i--) {
            days.push({ date: firstDay.subtract(i, 'day'), isCurrentRange: false });
        }
        
        // Current month
        for (let i = 1; i <= lastDay.date(); i++) {
            days.push({ date: currentDate.date(i), isCurrentRange: true });
        }
        
        // Next month padding (fill 42 grids)
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ date: lastDay.add(i, 'day'), isCurrentRange: false });
        }
    } else {
        // Week view
        const startOfWeek = currentDate.startOf('week').add(1, 'day'); // Monday
        // If Sunday, startOf('week') is Sunday. We want Monday.
        // Adjust for locale if needed, but simple math is reliable.
        // Let's rely on dayjs locale or manual calculation.
        // Assuming ISO week (Monday start):
        const monday = currentDate.day(1); 
        for (let i = 0; i < 7; i++) {
            days.push({ date: monday.add(i, 'day'), isCurrentRange: true });
        }
    }
    
    return days.map(item => {
        const d = item.date;
        const solar = Solar.fromYmd(d.year(), d.month() + 1, d.date());
        const lunar = solar.getLunar();
        const holiday = HolidayUtil.getHoliday(d.year(), d.month() + 1, d.date());
        
        // Festivals logic
        let festival = '';
        const solarFestivals = solar.getFestivals();
        const lunarFestivals = lunar.getFestivals();
        const jieQi = lunar.getJieQi();
        const lunarDay = lunar.getDayInChinese();
        
        if (lunarFestivals.length > 0) festival = lunarFestivals[0];
        else if (solarFestivals.length > 0) festival = solarFestivals[0];
        else if (jieQi) festival = jieQi;
        else festival = lunarDay;
        
        let label = festival;
        if (label === '初一') label = lunar.getMonthInChinese() + '月';
        if (label.length > 4) label = label.substring(0, 3) + '..';

        const dayEvents = events.filter(e => e.date === d.format('YYYY-MM-DD'));

        return {
            ...item,
            solar,
            lunar,
            holiday,
            label,
            fullFestival: festival,
            dayEvents
        };
    });
  }, [currentDate, viewMode, events]);

  const handleDateClick = (date: dayjs.Dayjs) => {
    setSelectedDate(date);
    if (viewMode === 'month' && !date.isSame(currentDate, 'month')) {
        setCurrentDate(date);
    }
  };

  const addEvent = () => {
    if (!newEventTitle.trim()) return;
    const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: newEventTitle,
        date: selectedDate.format('YYYY-MM-DD'),
        time: dayjs().format('HH:mm'),
        color: theme
    };
    const newEvents = [...events, newEvent];
    setEvents(newEvents);
    localStorage.setItem('zen-calendar-events', JSON.stringify(newEvents));
    setNewEventTitle('');
    setShowEventModal(false);
    addToast({ type: 'success', message: '日程已添加' });
  };

  const deleteEvent = (id: string) => {
    const newEvents = events.filter(e => e.id !== id);
    setEvents(newEvents);
    localStorage.setItem('zen-calendar-events', JSON.stringify(newEvents));
    addToast({ type: 'success', message: '日程已删除' });
  };

  const changeTheme = (c: ThemeColor) => {
      setTheme(c);
      localStorage.setItem('zen-calendar-theme', c);
  };

  // Navigation
  const prev = () => setCurrentDate(viewMode === 'month' ? currentDate.subtract(1, 'month') : currentDate.subtract(1, 'week'));
  const next = () => setCurrentDate(viewMode === 'month' ? currentDate.add(1, 'month') : currentDate.add(1, 'week'));
  const today = () => {
      const now = dayjs();
      setCurrentDate(now);
      setSelectedDate(now);
  };

  const weeks = ['一', '二', '三', '四', '五', '六', '日'];
  const selectedEvents = events.filter(e => e.date === selectedDate.format('YYYY-MM-DD'));

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden select-none text-white shadow-2xl relative group">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 shrink-0">
        <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg transition-colors ${THEME_COLORS[theme]}`}>
                <CalendarIcon size={16} />
            </div>
            <div className="flex flex-col">
                <span className="font-medium text-sm tracking-wide leading-none">
                    {currentDate.format('YYYY年 M月')}
                </span>
                <span className="text-[10px] text-white/50 leading-none mt-1">
                    {viewMode === 'month' ? '月视图' : '周视图'}
                </span>
            </div>
        </div>
        <div className="flex items-center gap-1">
            <button onClick={() => setViewMode(v => v === 'month' ? 'week' : 'month')} className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded-md transition-colors mr-1">
                {viewMode === 'month' ? '切到周' : '切到月'}
            </button>
            <button onClick={today} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white" title="回到今天">
                <RotateCcw size={14} />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button onClick={prev} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                <ChevronLeft size={16} />
            </button>
            <button onClick={next} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                <ChevronRight size={16} />
            </button>
        </div>
      </div>

      {/* Week Header */}
      <div className="grid grid-cols-7 text-center py-2 bg-white/5 text-xs text-white/50 font-medium border-b border-white/5 shrink-0">
        {weeks.map(w => <div key={w}>{w}</div>)}
      </div>

      {/* Days Grid */}
      <div className={`flex-1 grid grid-cols-7 ${viewMode === 'month' ? 'grid-rows-6' : 'grid-rows-1'} p-2 gap-1 overflow-hidden`}>
        {calendarData.map((day, idx) => {
            const isToday = day.date.isSame(dayjs(), 'day');
            const isSelected = day.date.isSame(selectedDate, 'day');
            const hasEvents = day.dayEvents.length > 0;
            
            // Colors
            let textColor = 'text-white/90';
            let subTextColor = 'text-white/40';
            
            if (day.holiday) {
                if (!day.holiday.isWork()) { // Holiday
                    textColor = 'text-red-300';
                    subTextColor = 'text-red-400/70';
                }
            } else if (day.date.day() === 0 || day.date.day() === 6) {
                textColor = 'text-white/60';
            }

            if (isSelected) {
                textColor = 'text-white';
                subTextColor = 'text-white/80';
            }

            return (
                <div 
                    key={idx}
                    onClick={() => handleDateClick(day.date)}
                    className={`
                        relative flex flex-col items-center justify-start pt-1 rounded-lg cursor-pointer transition-all duration-200 group
                        ${day.isCurrentRange ? 'opacity-100' : 'opacity-30'}
                        ${isSelected ? `${THEME_COLORS[theme]} shadow-lg z-10 scale-[1.05]` : 'hover:bg-white/10'}
                        ${isToday && !isSelected ? `ring-1 ring-${theme}-500 bg-white/5` : ''}
                        ${!isSelected && day.holiday && !day.holiday.isWork() ? 'bg-red-500/10' : ''}
                        ${!isSelected && day.holiday && day.holiday.isWork() ? 'bg-zinc-700/30' : ''}
                    `}
                    title={`${day.date.format('YYYY-MM-DD')} ${day.fullFestival || ''}`}
                >
                    {/* Holiday Badge */}
                    {day.holiday && (
                        <span className={`absolute top-0.5 right-0.5 text-[8px] px-1 rounded-sm scale-75 origin-top-right ${day.holiday.isWork() ? 'bg-zinc-600 text-white' : 'bg-red-500 text-white'}`}>
                            {day.holiday.isWork() ? '班' : '休'}
                        </span>
                    )}

                    {/* Date */}
                    <span className={`text-sm font-medium ${textColor}`}>
                        {day.date.date()}
                    </span>

                    {/* Lunar/Festival */}
                    <span className={`text-[9px] scale-90 mt-[-2px] truncate max-w-full px-1 ${subTextColor}`}>
                        {day.label}
                    </span>
                    
                    {/* Event Dots */}
                    <div className="flex gap-0.5 mt-0.5 h-1">
                        {day.dayEvents.slice(0, 3).map((_, i) => (
                            <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : THEME_COLORS[theme]}`} />
                        ))}
                    </div>
                </div>
            );
        })}
      </div>

      {/* Event List / Selected Date Info */}
      <div className="h-28 border-t border-white/10 bg-black/20 p-3 flex flex-col shrink-0">
          <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-white/70">
                  {selectedDate.format('M月D日')} · {selectedDate.format('dddd')}
              </span>
              <button 
                onClick={() => setShowEventModal(true)}
                className={`p-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white`}
                title="添加日程"
              >
                  <Plus size={14} />
              </button>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
              {selectedEvents.length > 0 ? (
                  selectedEvents.map(event => (
                      <div key={event.id} className="flex items-center justify-between group/event p-1.5 rounded hover:bg-white/5 transition-colors text-xs">
                          <div className="flex items-center gap-2 overflow-hidden">
                              <div className={`w-1.5 h-1.5 rounded-full ${THEME_COLORS[theme]} shrink-0`} />
                              <span className="truncate text-zinc-300">{event.title}</span>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }}
                            className="opacity-0 group-hover/event:opacity-100 text-zinc-500 hover:text-red-400 transition-all"
                          >
                              <Trash2 size={12} />
                          </button>
                      </div>
                  ))
              ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white/20 text-xs">
                      <span>暂无日程</span>
                  </div>
              )}
          </div>
      </div>

      {/* Settings Toggle */}
      <button 
        onClick={() => setShowSettings(!showSettings)}
        className="absolute top-4 right-28 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-white/10 rounded-lg text-white/50 hover:text-white"
        title="自定义样式"
      >
          <Settings2 size={14} />
      </button>

      {/* Theme Settings Panel */}
      {showSettings && (
          <div className="absolute top-12 right-4 bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-2xl z-20 animate-in fade-in slide-in-from-top-2">
              <div className="text-xs text-zinc-400 mb-2">主题颜色</div>
              <div className="flex gap-2">
                  {(Object.keys(THEME_COLORS) as ThemeColor[]).map(color => (
                      <button
                        key={color}
                        onClick={() => changeTheme(color)}
                        className={`w-6 h-6 rounded-full ${THEME_COLORS[color]} ring-2 ring-offset-2 ring-offset-zinc-900 ${theme === color ? 'ring-white' : 'ring-transparent'} transition-all`}
                      />
                  ))}
              </div>
          </div>
      )}

      {/* Add Event Modal */}
      {showEventModal && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-zinc-800 border border-zinc-700 rounded-xl w-full max-w-[240px] p-4 shadow-2xl animate-in zoom-in-95">
                  <h4 className="text-sm font-medium text-white mb-3">新日程</h4>
                  <input
                    autoFocus
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="日程内容..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 mb-3"
                    onKeyDown={(e) => e.key === 'Enter' && addEvent()}
                  />
                  <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => setShowEventModal(false)}
                        className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                      >
                          取消
                      </button>
                      <button 
                        onClick={addEvent}
                        className={`px-3 py-1.5 text-xs ${THEME_COLORS[theme]} text-white rounded-lg hover:opacity-90 transition-opacity`}
                      >
                          添加
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
