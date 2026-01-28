import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX, Coffee, Brain, Upload, Download, RefreshCw, X } from 'lucide-react';
import { savePomodoroAudio, getPomodoroAudio, clearPomodoroAudio } from '../lib/db';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface TimerSettings {
  work: number;
  shortBreak: number;
  longBreak: number;
}

const DEFAULT_AUDIO_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export const Pomodoro = () => {
  const [mode, setMode] = useState<TimerMode>(() => {
      return (localStorage.getItem('pomodoro-mode') as TimerMode) || 'work';
  });
  
  const [settings, setSettings] = useState<TimerSettings>(() => {
      const saved = localStorage.getItem('pomodoro-settings');
      return saved ? JSON.parse(saved) : { work: 25, shortBreak: 5, longBreak: 15 };
  });

  const [timeLeft, setTimeLeft] = useState(() => {
      const saved = localStorage.getItem('pomodoro-timeLeft');
      const savedTimestamp = localStorage.getItem('pomodoro-lastActive');
      const wasActive = localStorage.getItem('pomodoro-isActive') === 'true';
      
      if (saved && savedTimestamp && wasActive) {
          // If was active, calculate elapsed time
          const elapsed = Math.floor((Date.now() - parseInt(savedTimestamp)) / 1000);
          const remaining = parseInt(saved) - elapsed;
          return remaining > 0 ? remaining : 0;
      }
      return saved ? parseInt(saved) : 25 * 60;
  });

  const [isActive, setIsActive] = useState(() => {
      // Don't auto-start if page reloaded, but maybe we should?
      // Let's default to pause to be safe, or resume if user wants?
      // For now, let's resume if it was running.
      const saved = localStorage.getItem('pomodoro-isActive') === 'true';
      const savedTimestamp = localStorage.getItem('pomodoro-lastActive');
      const savedTimeLeft = localStorage.getItem('pomodoro-timeLeft');
      
      if (saved && savedTimestamp && savedTimeLeft) {
          const elapsed = Math.floor((Date.now() - parseInt(savedTimestamp)) / 1000);
          return parseInt(savedTimeLeft) - elapsed > 0;
      }
      return false;
  });

  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
      return localStorage.getItem('pomodoro-sound') !== 'false';
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioName, setAudioName] = useState('默认提示音');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence
  useEffect(() => {
      localStorage.setItem('pomodoro-mode', mode);
      localStorage.setItem('pomodoro-settings', JSON.stringify(settings));
      localStorage.setItem('pomodoro-sound', String(isSoundEnabled));
  }, [mode, settings, isSoundEnabled]);

  useEffect(() => {
      localStorage.setItem('pomodoro-timeLeft', timeLeft.toString());
      localStorage.setItem('pomodoro-isActive', String(isActive));
      if (isActive) {
          localStorage.setItem('pomodoro-lastActive', Date.now().toString());
      }
  }, [timeLeft, isActive]);

  // Load Audio
  useEffect(() => {
      const loadAudio = async () => {
          const customAudio = await getPomodoroAudio();
          if (customAudio) {
              setAudioUrl(customAudio);
              setAudioName('自定义提示音');
          } else {
              setAudioUrl(DEFAULT_AUDIO_URL);
              setAudioName('默认提示音');
          }
      };
      loadAudio();
  }, []);

  useEffect(() => {
      if (audioUrl) {
          const audio = new Audio(audioUrl);
          audio.preload = 'auto';
          audioRef.current = audio;
      }
  }, [audioUrl]);

  const playSound = useCallback(() => {
    if (isSoundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [isSoundEnabled]);

  const switchMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setTimeLeft(settings[newMode] * 60);
    setIsActive(false);
  }, [settings]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
            const newTime = time - 1;
            if (newTime <= 0) {
                setIsActive(false);
                playSound();
                return 0;
            }
            return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, playSound]);

  // Handle settings change
  const updateSettings = (key: keyof TimerSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // If currently in that mode and not active, update time immediately
    if (mode === key && !isActive) {
      setTimeLeft(value * 60);
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const url = await savePomodoroAudio(file);
              setAudioUrl(url);
              setAudioName(file.name);
              // Preview
              const audio = new Audio(url);
              audio.play().catch(() => {});
          } catch (error) {
              console.error('Audio upload failed', error);
          }
      }
  };

  const resetAudio = async () => {
      await clearPomodoroAudio();
      setAudioUrl(DEFAULT_AUDIO_URL);
      setAudioName('默认提示音');
  };

  const exportSettings = () => {
      const data = JSON.stringify(settings);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pomodoro-settings.json';
      a.click();
  };

  const importSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
              try {
                  const newSettings = JSON.parse(e.target?.result as string);
                  if (newSettings.work && newSettings.shortBreak && newSettings.longBreak) {
                      setSettings(newSettings);
                      // Reset current timer if applicable
                      if (!isActive) {
                          setTimeLeft(newSettings[mode] * 60);
                      }
                  }
              } catch (err) {
                  console.error('Invalid settings file');
              }
          };
          reader.readAsText(file);
      }
  };

  const toggleTimer = () => {
    if (!isActive && timeLeft <= 0) {
      setTimeLeft(settings[mode] * 60);
    }
    setIsActive(!isActive);
  };
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(settings[mode] * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Circular Progress Calculation
  const totalTime = settings[mode] * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const radius = 55; // SVG radius
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getColor = () => {
    switch (mode) {
      case 'work': return 'text-red-500';
      case 'shortBreak': return 'text-emerald-500';
      case 'longBreak': return 'text-blue-500';
      default: return 'text-blue-500';
    }
  };
  
  const getStrokeColor = () => {
    switch (mode) {
      case 'work': return '#ef4444'; // red-500
      case 'shortBreak': return '#10b981'; // emerald-500
      case 'longBreak': return '#3b82f6'; // blue-500
      default: return '#3b82f6';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden select-none text-white shadow-2xl relative group">
      {/* Settings Panel Overlay */}
      {showSettings && (
        <div className="absolute inset-0 bg-zinc-900/95 z-20 flex flex-col p-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                <span className="font-medium text-sm flex items-center gap-2">
                    <Settings size={14} />
                    高级设置
                </span>
                <button onClick={() => setShowSettings(false)} className="text-white/60 hover:text-white transition-colors">
                    <X size={16} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-1">
                {/* Time Settings */}
                <div className="space-y-4">
                    <h4 className="text-xs text-zinc-500 font-medium uppercase tracking-wider">时长设置 (分钟)</h4>
                    
                    {[
                        { key: 'work', label: '专注', color: 'accent-red-500', max: 120 },
                        { key: 'shortBreak', label: '短休息', color: 'accent-emerald-500', max: 60 },
                        { key: 'longBreak', label: '长休息', color: 'accent-blue-500', max: 90 }
                    ].map((item) => (
                        <div key={item.key}>
                            <div className="flex justify-between text-xs mb-1.5">
                                <span className="text-zinc-300">{item.label}</span>
                                <span className="font-mono text-white/80">{settings[item.key as keyof TimerSettings]} min</span>
                            </div>
                            <input 
                                type="range" min="1" max={item.max}
                                value={settings[item.key as keyof TimerSettings]} 
                                onChange={(e) => updateSettings(item.key as keyof TimerSettings, parseInt(e.target.value))}
                                className={`w-full ${item.color} h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer`}
                            />
                        </div>
                    ))}
                </div>

                {/* Audio Settings */}
                <div className="space-y-3">
                    <h4 className="text-xs text-zinc-500 font-medium uppercase tracking-wider">提示音</h4>
                    <div className="flex items-center justify-between bg-zinc-800/50 p-2 rounded-lg border border-white/5">
                        <div className="flex items-center gap-2 overflow-hidden">
                            {isSoundEnabled ? <Volume2 size={14} className="text-blue-400 flex-shrink-0" /> : <VolumeX size={14} className="text-zinc-500 flex-shrink-0" />}
                            <span className="text-xs truncate" title={audioName}>{audioName}</span>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                            <button 
                                onClick={() => {
                                    if (audioRef.current) {
                                        audioRef.current.currentTime = 0;
                                        audioRef.current.play().catch(() => {});
                                    }
                                }}
                                className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                                title="试听"
                            >
                                <Play size={14} />
                            </button>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                                title="上传音频"
                            >
                                <Upload size={14} />
                            </button>
                            <button 
                                onClick={resetAudio}
                                className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
                                title="恢复默认"
                            >
                                <RefreshCw size={14} />
                            </button>
                        </div>
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="audio/*" 
                            onChange={handleAudioUpload}
                            className="hidden" 
                        />
                    </div>
                </div>

                {/* Data Management */}
                <div className="space-y-3">
                    <h4 className="text-xs text-zinc-500 font-medium uppercase tracking-wider">数据管理</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={exportSettings}
                            className="flex items-center justify-center gap-2 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs transition-colors border border-white/5"
                        >
                            <Download size={12} />
                            导出配置
                        </button>
                        <label className="flex items-center justify-center gap-2 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs transition-colors border border-white/5 cursor-pointer">
                            <Upload size={12} />
                            导入配置
                            <input type="file" accept=".json" onChange={importSettings} className="hidden" />
                        </label>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Main UI */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-4">
        {/* Mode Tabs */}
        <div className="absolute top-3 left-0 right-0 flex justify-center gap-2 z-10">
            <button 
                onClick={() => switchMode('work')}
                className={`p-1.5 rounded-full transition-all ${mode === 'work' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/50' : 'text-white/30 hover:text-white/60'}`}
                title="专注模式"
            >
                <Brain size={14} />
            </button>
            <button 
                onClick={() => switchMode('shortBreak')}
                className={`p-1.5 rounded-full transition-all ${mode === 'shortBreak' ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/50' : 'text-white/30 hover:text-white/60'}`}
                title="短休息"
            >
                <Coffee size={14} />
            </button>
            <button 
                onClick={() => switchMode('longBreak')}
                className={`p-1.5 rounded-full transition-all ${mode === 'longBreak' ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50' : 'text-white/30 hover:text-white/60'}`}
                title="长休息"
            >
                <Coffee size={14} className="scale-125" />
            </button>
        </div>

        {/* Circular Timer */}
        <div className="relative w-40 h-40 flex items-center justify-center mt-4">
            {/* SVG Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 transform">
                <circle
                    cx="50%"
                    cy="50%"
                    r={radius}
                    className="stroke-white/5 fill-none"
                    strokeWidth="8"
                />
                <circle
                    cx="50%"
                    cy="50%"
                    r={radius}
                    className="fill-none transition-all duration-500 ease-in-out"
                    strokeWidth="8"
                    strokeLinecap="round"
                    stroke={getStrokeColor()}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                />
            </svg>
            
            {/* Time Display */}
            <div className="flex flex-col items-center z-10">
                <span className={`text-4xl font-light tabular-nums tracking-wider ${getColor()}`}>
                    {formatTime(timeLeft)}
                </span>
                <span className="text-xs text-white/40 mt-1 font-medium tracking-widest uppercase">
                    {isActive ? (mode === 'work' ? '专注中' : '休息中') : '已暂停'}
                </span>
            </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-6">
            <button 
                onClick={toggleTimer}
                className={`p-3 rounded-full transition-all hover:scale-110 active:scale-95 ${isActive ? 'bg-zinc-800 text-white' : 'bg-white text-black'}`}
            >
                {isActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </button>
            
            <button 
                onClick={resetTimer}
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all hover:rotate-180 duration-500"
                title="重置"
            >
                <RotateCcw size={18} />
            </button>
        </div>

        {/* Footer Controls */}
        <div className="absolute bottom-3 left-4 right-4 flex justify-between">
             <button 
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                className="text-white/30 hover:text-white transition-colors"
                title={isSoundEnabled ? "静音" : "开启声音"}
             >
                 {isSoundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
             </button>
             <button 
                onClick={() => setShowSettings(true)}
                className="text-white/30 hover:text-white transition-colors"
                title="设置"
             >
                 <Settings size={14} />
             </button>
        </div>
      </div>
    </div>
  );
};
