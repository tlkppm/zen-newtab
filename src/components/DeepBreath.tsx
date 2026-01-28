import { useState, useEffect } from 'react';
import { Wind, Play, Pause, RotateCcw } from 'lucide-react';

export const DeepBreath = () => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'idle'>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [cycles, setCycles] = useState(0);

  // 4-7-8 Breathing Technique
  const PHASES = {
    inhale: 4,
    hold: 7,
    exhale: 8
  };

  useEffect(() => {
    let interval: any;
    
    if (isActive) {
      if (phase === 'idle') {
        setPhase('inhale');
        setTimeLeft(PHASES.inhale);
      }

      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Switch phase
            switch (phase) {
              case 'inhale':
                setPhase('hold');
                return PHASES.hold;
              case 'hold':
                setPhase('exhale');
                return PHASES.exhale;
              case 'exhale':
                setCycles(c => c + 1);
                setPhase('inhale'); // Loop
                return PHASES.inhale;
              default:
                return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setPhase('idle');
      setTimeLeft(0);
    }

    return () => clearInterval(interval);
  }, [isActive, phase]);

  const toggle = () => setIsActive(!isActive);
  const reset = () => {
      setIsActive(false);
      setCycles(0);
      setPhase('idle');
  };

  const getInstruction = () => {
      switch (phase) {
          case 'inhale': return '吸气';
          case 'hold': return '屏气';
          case 'exhale': return '呼气';
          default: return '准备';
      }
  };

  const getScale = () => {
      // Approximate animation scale based on phase
      // This is just for static rendering if we wanted, but we use CSS animation below
      return 1; 
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden text-white shadow-xl relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Breathing Circle Animation */}
          <div 
            className={`
                rounded-full border-2 border-blue-400/30 bg-blue-500/10 backdrop-blur-sm transition-all duration-[4000ms]
                ${phase === 'inhale' ? 'w-48 h-48 opacity-100 duration-[4000ms] ease-out' : ''}
                ${phase === 'hold' ? 'w-48 h-48 opacity-80 duration-0' : ''}
                ${phase === 'exhale' ? 'w-16 h-16 opacity-60 duration-[8000ms] ease-in-out' : ''}
                ${phase === 'idle' ? 'w-24 h-24 opacity-30' : ''}
            `}
          />
          {/* Inner Circle */}
          <div 
            className={`
                absolute rounded-full bg-blue-400 transition-all
                ${phase === 'inhale' ? 'w-4 h-4 opacity-100 duration-[4000ms]' : ''}
                ${phase === 'hold' ? 'w-4 h-4 opacity-50' : ''}
                ${phase === 'exhale' ? 'w-2 h-2 opacity-30 duration-[8000ms]' : ''}
                ${phase === 'idle' ? 'w-3 h-3 opacity-20' : ''}
            `}
          />
      </div>

      <div className="relative z-10 flex flex-col h-full items-center justify-between p-6">
          <div className="flex items-center gap-2 text-blue-300">
              <Wind size={18} />
              <span className="font-medium text-sm">深呼吸</span>
          </div>

          <div className="text-center">
              <h2 className={`text-3xl font-bold transition-all duration-500 ${phase === 'hold' ? 'text-blue-200' : 'text-white'}`}>
                  {isActive ? getInstruction() : '开始'}
              </h2>
              {isActive && (
                  <div className="text-4xl font-mono mt-2 opacity-50 font-light">
                      {timeLeft}
                  </div>
              )}
          </div>

          <div className="flex gap-4">
              <button 
                onClick={toggle}
                className="p-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95"
              >
                  {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
              </button>
              {isActive && (
                  <button 
                    onClick={reset}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all"
                  >
                      <RotateCcw size={20} />
                  </button>
              )}
          </div>
          
          <div className="text-[10px] text-zinc-500 font-medium">
              已完成 {cycles} 次循环
          </div>
      </div>
    </div>
  );
};
