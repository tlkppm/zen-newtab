import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useStore } from '../store/useStore';

export const Clock = () => {
  const [time, setTime] = useState(dayjs());
  const showSeconds = useStore((state) => state.showSeconds);

  useEffect(() => {
    // Set locale to zh-cn
    dayjs.locale('zh-cn');
    const timer = setInterval(() => {
      setTime(dayjs());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-white drop-shadow-md select-none">
      <div className="text-8xl font-thin tracking-tight">
        {time.format(showSeconds ? 'HH:mm:ss' : 'HH:mm')}
      </div>
    </div>
  );
};

export const DateWidget = () => {
    const [time, setTime] = useState(dayjs());
  
    useEffect(() => {
      dayjs.locale('zh-cn');
      const timer = setInterval(() => {
        setTime(dayjs());
      }, 60000); // Update every minute is enough for date
      return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-full h-full flex items-center justify-center text-white drop-shadow-md select-none">
            <div className="text-xl font-light opacity-90">
                {time.format('MMMM D, dddd')}
            </div>
        </div>
    );
};
