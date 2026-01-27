import { useState, useEffect } from 'react';
import { ExternalLink, Volume2, VolumeX, Music, Disc } from 'lucide-react';

interface MediaTab {
  id: number;
  title: string;
  url: string;
  favIconUrl: string;
  audible: boolean;
  mutedInfo?: {
    muted: boolean;
  };
}

export const MediaPlayer = ({ showPlaceholder = false }: { showPlaceholder?: boolean }) => {
  const [activeTab, setActiveTab] = useState<MediaTab | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkAudioTabs = () => {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ audible: true }, (tabs) => {
          if (tabs && tabs.length > 0) {
            const tab = tabs[0];
            setActiveTab({
              id: tab.id!,
              title: tab.title || 'Unknown Media',
              url: tab.url || '',
              favIconUrl: tab.favIconUrl || '',
              audible: tab.audible || false,
              mutedInfo: tab.mutedInfo
            });
            setIsVisible(true);
          } else {
             setIsVisible(false);
             setActiveTab(null);
          }
        });
      } else {
          // Dev mock
          // setIsVisible(true);
          // setActiveTab({ id: 1, title: 'Mock Song', url: '', favIconUrl: '', audible: true });
      }
    };
    
    const interval = setInterval(checkAudioTabs, 2000);
    checkAudioTabs();
    return () => clearInterval(interval);
  }, []);

  const goToTab = () => {
    if (!activeTab?.id || typeof chrome === 'undefined' || !chrome.tabs) return;
    chrome.tabs.update(activeTab.id, { active: true });
  };

  const toggleMute = () => {
      if (!activeTab?.id || !chrome.tabs) return;
      const newMutedState = !activeTab.mutedInfo?.muted;
      chrome.tabs.update(activeTab.id, { muted: newMutedState });
      setActiveTab(prev => prev ? { ...prev, mutedInfo: { muted: newMutedState } } : null);
  };

  if (!isVisible && !activeTab && !showPlaceholder) return null;

  const displayTab = activeTab || {
      title: '等待媒体播放...',
      url: '',
      favIconUrl: '',
      mutedInfo: { muted: false }
  };

  return (
    <div className="w-full h-full animate-fade-in overflow-hidden">
      <div className="bg-zinc-900/60 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl w-full h-full flex gap-4 items-center">
        {/* Cover Art / Favicon */}
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-black/50 flex-shrink-0 flex items-center justify-center border border-white/5 group">
            {displayTab.favIconUrl ? (
                <img src={displayTab.favIconUrl} alt="Cover" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            ) : (
                <Disc size={32} className="text-zinc-600 animate-spin-slow" />
            )}
            {/* Equalizer animation overlay */}
            {activeTab && (
                <div className="absolute inset-0 flex items-end justify-center gap-1 pb-1 opacity-60">
                    <div className="w-1 bg-blue-400 animate-music-bar-1 h-3"></div>
                    <div className="w-1 bg-blue-400 animate-music-bar-2 h-5"></div>
                    <div className="w-1 bg-blue-400 animate-music-bar-3 h-2"></div>
                </div>
            )}
        </div>

        {/* Info & Controls */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
            <div className="flex flex-col">
                <h4 className="text-white text-sm font-medium truncate" title={displayTab.title}>
                    {displayTab.title}
                </h4>
                <div className="text-zinc-400 text-xs truncate flex items-center gap-1">
                    <Music size={10} />
                    <span>{activeTab ? '正在播放' : '未检测到音频'}</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button 
                    onClick={goToTab}
                    disabled={!activeTab}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="跳转到标签页"
                >
                    <ExternalLink size={12} />
                    <span>打开</span>
                </button>

                <button 
                    onClick={toggleMute}
                    disabled={!activeTab}
                    className={`p-2 rounded-lg transition-colors ${displayTab.mutedInfo?.muted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 hover:bg-white/20 text-white'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={displayTab.mutedInfo?.muted ? "取消静音" : "静音"}
                >
                    {displayTab.mutedInfo?.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
