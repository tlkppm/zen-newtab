import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { Solar, Lunar, HolidayUtil } from 'lunar-javascript';
import dayjs from 'dayjs';

export const CalendarWidget = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());

  // Generate calendar days
  const calendarData = useMemo(() => {
    const year = currentDate.year();
    const month = currentDate.month() + 1; // dayjs month is 0-11
    
    const firstDay = currentDate.startOf('month');
    const lastDay = currentDate.endOf('month');
    
    // Calculate start padding (Monday as first day)
    // dayjs day(): 0(Sun) - 6(Sat)
    // We want Mon(1) - Sun(7). So 0->7.
    let startDayOfWeek: number = firstDay.day();
    if (startDayOfWeek === 0) startDayOfWeek = 7;
    
    const days = [];
    
    // Previous month padding
    const prevMonthLastDay = firstDay.subtract(1, 'day');
    for (let i = startDayOfWeek - 1; i > 0; i--) {
        const d = firstDay.subtract(i, 'day');
        days.push({ date: d, isCurrentMonth: false });
    }
    
    // Current month
    for (let i = 1; i <= lastDay.date(); i++) {
        days.push({ date: currentDate.date(i), isCurrentMonth: true });
    }
    
    // Next month padding (fill up to 42 days - 6 rows)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
        days.push({ date: lastDay.add(i, 'day'), isCurrentMonth: false });
    }
    
    return days.map(item => {
        const d = item.date;
        const solar = Solar.fromYmd(d.year(), d.month() + 1, d.date());
        const lunar = solar.getLunar();
        const holiday = HolidayUtil.getHoliday(d.year(), d.month() + 1, d.date());
        
        // Festivals
        let festival = '';
        const solarFestivals = solar.getFestivals();
        const lunarFestivals = lunar.getFestivals();
        const jieQi = lunar.getJieQi();
        
        if (holiday) {
            festival = holiday.getName();
        } else if (lunarFestivals.length > 0) {
            festival = lunarFestivals[0];
        } else if (solarFestivals.length > 0) {
            festival = solarFestivals[0];
        } else if (jieQi) {
            festival = jieQi;
        } else {
            festival = lunar.getDayInChinese();
        }
        
        // Priority for display: Holiday > Festival > Term > Lunar Day
        // For the "small number/text", we prefer short text.
        let label = festival;
        if (label === '初一') label = lunar.getMonthInChinese() + '月';
        
        // Limit label length
        if (label.length > 4) label = label.substring(0, 3) + '..';

        return {
            ...item,
            solar,
            lunar,
            holiday,
            label,
            fullFestival: festival // For tooltip
        };
    });
  }, [currentDate]);

  const goToToday = () => {
    const now = dayjs();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const prevMonth = () => setCurrentDate(currentDate.subtract(1, 'month'));
  const nextMonth = () => setCurrentDate(currentDate.add(1, 'month'));

  const weeks = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden select-none text-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg">
                <CalendarIcon size={16} />
            </div>
            <span className="font-medium text-lg tracking-wide">
                {currentDate.format('YYYY年 M月')}
            </span>
        </div>
        <div className="flex items-center gap-1">
            <button onClick={goToToday} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white" title="回到今天">
                <RotateCcw size={14} />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button onClick={prevMonth} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                <ChevronLeft size={16} />
            </button>
            <button onClick={nextMonth} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white">
                <ChevronRight size={16} />
            </button>
        </div>
      </div>

      {/* Week Header */}
      <div className="grid grid-cols-7 text-center py-2 bg-white/5 text-xs text-white/50 font-medium border-b border-white/5">
        {weeks.map(w => <div key={w}>{w}</div>)}
      </div>

      {/* Days Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 p-2 gap-1">
        {calendarData.map((day, idx) => {
            const isToday = day.date.isSame(dayjs(), 'day');
            const isSelected = day.date.isSame(selectedDate, 'day');
            const isWeekend = day.date.day() === 0 || day.date.day() === 6;
            
            // Holiday Color Logic
            // Red for official holidays (work=false), Blue for workdays (work=true, shift), Green for festivals
            let badgeColor = 'text-white/40';
            let bgColor = '';
            
            if (day.holiday) {
                if (day.holiday.isWork()) {
                    // Shift workday (班)
                    badgeColor = 'text-zinc-400';
                    bgColor = 'bg-zinc-800/50';
                } else {
                    // Holiday (休)
                    badgeColor = 'text-red-400';
                    bgColor = 'bg-red-500/10 border-red-500/20';
                }
            } else if (isWeekend) {
                badgeColor = 'text-white/60';
            }

            return (
                <div 
                    key={idx}
                    onClick={() => setSelectedDate(day.date)}
                    className={`
                        relative flex flex-col items-center justify-start pt-1 rounded-lg cursor-pointer transition-all duration-200 group
                        ${day.isCurrentMonth ? 'opacity-100' : 'opacity-30'}
                        ${isSelected ? 'bg-blue-600 shadow-lg shadow-blue-900/20 z-10 scale-[1.05]' : 'hover:bg-white/10'}
                        ${isToday && !isSelected ? 'ring-1 ring-blue-500 bg-blue-500/10' : ''}
                        ${!isSelected && day.holiday && !day.holiday.isWork() ? 'bg-red-500/10' : ''}
                        ${!isSelected && day.holiday && day.holiday.isWork() ? 'bg-zinc-700/30' : ''}
                    `}
                    title={`${day.date.format('YYYY-MM-DD')} ${day.fullFestival || ''} ${day.holiday ? (day.holiday.isWork() ? '[调休上班]' : '[节假日]') : ''}`}
                >
                    {/* Holiday/Work Badge (Top Right) */}
                    {day.holiday && (
                        <span className={`absolute top-0.5 right-0.5 text-[9px] px-1 rounded-sm scale-90 origin-top-right ${day.holiday.isWork() ? 'bg-zinc-600 text-white' : 'bg-red-500 text-white'}`}>
                            {day.holiday.isWork() ? '班' : '休'}
                        </span>
                    )}

                    {/* Gregorian Date */}
                    <span className={`text-sm font-medium ${isSelected ? 'text-white' : (day.holiday && !day.holiday.isWork() ? 'text-red-300' : 'text-white/90')}`}>
                        {day.date.date()}
                    </span>

                    {/* Lunar / Festival Label */}
                    <span className={`text-[10px] scale-90 mt-[-2px] truncate max-w-full px-1 ${isSelected ? 'text-white/80' : (day.holiday && !day.holiday.isWork() ? 'text-red-400' : 'text-white/40')}`}>
                        {day.label}
                    </span>
                    
                    {/* Dot for today if not selected */}
                    {isToday && !isSelected && (
                        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500" />
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};
