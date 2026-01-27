import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Upload, Clock as ClockIcon, Book, History, Terminal, Puzzle, Move, RotateCcw, MonitorPlay, Eye, EyeOff, Scaling, Cloud, Quote as QuoteIcon, Calendar } from 'lucide-react';
import { useStore } from './store/useStore';
import { Background } from './components/Background';
import { Clock, DateWidget } from './components/Clock';
import { Search } from './components/Search';
import { Bookmarks } from './components/Bookmarks';
import { HistoryViewer } from './components/HistoryViewer';
import { DevTools } from './components/DevTools';
import { MediaPlayer } from './components/MediaPlayer';
import { ExtensionsViewer } from './components/ExtensionsViewer';
import { Weather } from './components/Weather';
import { Quote } from './components/Quote';
import { ErrorBoundary } from './components/ErrorBoundary';
import { saveVideoToDB, clearVideoFromDB, saveImageToDB, getImageFromDB, getVideoFromDB, clearImageFromDB } from './lib/db';

type ViewMode = 'home' | 'bookmarks' | 'history' | 'devtools' | 'extensions';

// Helper for resizing and dragging
const ResizableDraggable = ({ 
    id, 
    children, 
    x, 
    y, 
    w, 
    h, 
    onUpdate, 
    isEditing,
    visible 
}: { 
    id: string; 
    children: React.ReactNode; 
    x: number; 
    y: number; 
    w: number; 
    h: number; 
    onUpdate: (id: string, updates: { x?: number, y?: number, w?: number, h?: number }) => void;
    isEditing: boolean;
    visible: boolean;
}) => {
    const [pos, setPos] = useState({ x, y });
    const [size, setSize] = useState({ w, h });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const startPos = useRef({ x: 0, y: 0 });
    const initialDragPos = useRef({ x: 0, y: 0 });
    const initialSize = useRef({ w: 0, h: 0 });

    useEffect(() => {
        setPos({ x, y });
        setSize({ w, h });
    }, [x, y, w, h]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isEditing) return;
        // Prevent drag if clicking on resize handle
        if ((e.target as HTMLElement).closest('.resize-handle')) return;
        
        e.preventDefault();
        setIsDragging(true);
        startPos.current = { x: e.clientX, y: e.clientY };
        initialDragPos.current = { ...pos };
    };

    const handleResizeStart = (e: React.MouseEvent) => {
        if (!isEditing) return;
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        startPos.current = { x: e.clientX, y: e.clientY };
        initialSize.current = { ...size };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const dx = e.clientX - startPos.current.x;
                const dy = e.clientY - startPos.current.y;
                setPos({
                    x: initialDragPos.current.x + dx,
                    y: initialDragPos.current.y + dy
                });
            } else if (isResizing) {
                const dx = e.clientX - startPos.current.x;
                const dy = e.clientY - startPos.current.y;
                setSize({
                    w: Math.max(100, initialSize.current.w + dx),
                    h: Math.max(50, initialSize.current.h + dy)
                });
            }
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                onUpdate(id, { x: pos.x, y: pos.y });
            }
            if (isResizing) {
                setIsResizing(false);
                onUpdate(id, { w: size.w, h: size.h });
            }
        };

        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, id, onUpdate, pos, size]);

    // 条件返回必须在所有 hooks 之后
    if (!visible) return null;

    return (
        <div 
            style={{ 
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                width: size.w,
                height: size.h
            }}
            className={`absolute transition-transform duration-75 ${isEditing ? 'cursor-move ring-2 ring-blue-500/50 rounded-xl bg-black/20 backdrop-blur-sm' : ''}`}
            onMouseDown={handleMouseDown}
        >
            {isEditing && (
                <>
                    <div className="absolute -top-3 -right-3 bg-blue-500 text-white p-1 rounded-full shadow-sm z-50 pointer-events-none">
                        <Move size={12} />
                    </div>
                    {/* Resize Handle */}
                    <div 
                        className="resize-handle absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-center justify-center text-white/50 hover:text-white z-50"
                        onMouseDown={handleResizeStart}
                    >
                        <Scaling size={16} fill="currentColor" />
                    </div>
                </>
            )}
            <div className="w-full h-full overflow-visible relative">
                {children}
            </div>
        </div>
    );
};

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  
  const { 
    showSeconds, 
    toggleShowSeconds, 
    setBackgroundImage, 
    backgroundType, 
    setBackgroundType, 
    backgroundImageSource,
    applyLocalImage,
    applyVideo,
    searchEngine,
    setSearchEngine,
    layout,
    updateLayout,
    resetLayout,
    exportLayout,
    importLayout
  } = useStore();
  
  // ... existing state ...
  const [bgUrlInput, setBgUrlInput] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [imageUploadStatus, setImageUploadStatus] = useState('');
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  const [localVideoPreview, setLocalVideoPreview] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{x: number, y: number} | null>(null);

  // Context Menu Handler
  useEffect(() => {
      const handleContextMenu = (e: MouseEvent) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY });
      };
      const handleClick = () => setContextMenu(null);
      
      window.addEventListener('contextmenu', handleContextMenu);
      window.addEventListener('click', handleClick);
      return () => {
          window.removeEventListener('contextmenu', handleContextMenu);
          window.removeEventListener('click', handleClick);
      };
  }, []);

  const handleUpdate = useCallback((id: string, updates: { x?: number, y?: number, w?: number, h?: number }) => {
      // @ts-ignore
      updateLayout(id, updates);
  }, [updateLayout]);
  
  const toggleVisibility = useCallback((id: string) => {
      // @ts-ignore
      updateLayout(id, { visible: !(layout[id]?.visible ?? false) });
  }, [updateLayout, layout]);


  // Load previews when settings open
  useEffect(() => {
    if (isSettingsOpen) {
      getImageFromDB().then(url => setLocalImagePreview(url));
      getVideoFromDB().then(url => setLocalVideoPreview(url));
    }
  }, [isSettingsOpen]);

  // Listen for download completion and show notification
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.downloads) {
      const handleDownloadChanged = (delta: { id: number; state?: { current?: string } }) => {
        if (delta.state?.current === 'complete') {
          chrome.downloads.search({ id: delta.id }, (results) => {
            if (results && results.length > 0) {
              const item = results[0];
              const filename = item.filename.split(/[/\\]/).pop() || 'Unknown file';
              
              if (chrome.notifications) {
                chrome.notifications.create(`download-${delta.id}`, {
                  type: 'basic',
                  iconUrl: '/icon48.png',
                  title: '下载完成',
                  message: filename,
                  priority: 1
                });
              }
            }
          });
        }
      };
      
      chrome.downloads.onChanged.addListener(handleDownloadChanged);
      return () => {
        // Cleanup not strictly needed for extension lifecycle but good practice
      };
    }
  }, []);
  
  // Reset view to home when clicking background (optional, maybe distracting)
  // const handleBackgroundClick = (e: React.MouseEvent) => {
  //    if (e.target === e.currentTarget) setViewMode('home');
  // };

  const handleBgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bgUrlInput) {
      setBackgroundImage(bgUrlInput);
      setBgUrlInput('');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setImageUploadStatus('图片过大 (最大 10MB)');
        return;
      }
      try {
        setImageUploadStatus('正在上传...');
        const url = await saveImageToDB(file);
        setLocalImagePreview(url);
        applyLocalImage();
        setImageUploadStatus('上传成功！');
      } catch (error) {
        console.error(error);
        setImageUploadStatus('上传失败');
      }
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        setUploadStatus('视频过大 (最大 50MB)');
        return;
      }
      try {
        setUploadStatus('正在上传...');
        const url = await saveVideoToDB(file);
        setLocalVideoPreview(url);
        applyVideo();
        setUploadStatus('上传成功！');
      } catch (error) {
        console.error(error);
        setUploadStatus('上传失败');
      }
    }
  };

  const switchToImage = async () => {
      await clearVideoFromDB();
      setBackgroundType('image');
  };

  return (
    <div className="relative h-screen w-screen flex flex-col overflow-hidden">
      <Background />
      
      {/* Edit Mode Overlay/Hint */}
      {isEditingLayout && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg z-[100] flex items-center gap-2 animate-bounce-in">
              <span>布局编辑模式</span>
              <div className="h-4 w-px bg-white/30"></div>
              <button onClick={resetLayout} className="hover:text-blue-200" title="重置布局"><RotateCcw size={16}/></button>
              <button onClick={() => setIsEditingLayout(false)} className="hover:text-blue-200 font-bold ml-2">完成</button>
          </div>
      )}

      {/* Top Navigation Bar */}
      <nav className={`absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50 pointer-events-none transition-opacity ${isEditingLayout ? 'opacity-0' : 'opacity-100'}`}>
          {/* Left: View Switcher */}
          <div className="flex flex-col gap-4 pointer-events-auto">
              <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md p-1 rounded-full border border-white/10">
                  <button 
                    onClick={() => setViewMode('home')}
                    className={`p-2 rounded-full transition-all ${viewMode === 'home' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                    title="主页"
                  >
                      <ClockIcon size={20} />
                  </button>
                  <button 
                    onClick={() => setViewMode('bookmarks')}
                    className={`p-2 rounded-full transition-all ${viewMode === 'bookmarks' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                    title="收藏夹"
                  >
                      <Book size={20} />
                  </button>
                  <button 
                    onClick={() => setViewMode('history')}
                    className={`p-2 rounded-full transition-all ${viewMode === 'history' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                    title="历史记录"
                  >
                      <History size={20} />
                  </button>
                  <button 
                    onClick={() => setViewMode('devtools')}
                    className={`p-2 rounded-full transition-all ${viewMode === 'devtools' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                    title="开发者工具"
                  >
                      <Terminal size={20} />
                  </button>
                  <button 
                    onClick={() => setViewMode('extensions')}
                    className={`p-2 rounded-full transition-all ${viewMode === 'extensions' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                    title="扩展程序管理"
                  >
                      <Puzzle size={20} />
                  </button>
              </div>
          </div>
          
          {/* Right: Settings (Bottom-Right originally, moved to keep layout clean or keep at bottom?) 
              Let's keep settings at bottom left, but we have nav at top left.
              Let's move Settings to Top Right for symmetry? Or keep it bottom left.
              User didn't specify. I'll keep Settings at bottom left.
          */}
      </nav>

      {/* Context Menu */}
      {contextMenu && (
        <div 
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed bg-zinc-900/90 border border-white/10 rounded-lg shadow-2xl py-1 z-[9999] min-w-[180px] backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
        >
            <button 
                onClick={() => { setIsEditingLayout(!isEditingLayout); setContextMenu(null); }}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center gap-2"
            >
                <Move size={14} />
                {isEditingLayout ? '退出布局编辑' : '编辑当前布局'}
            </button>
            
            <div className="border-t border-white/5 my-1" />
            <div className="px-4 py-1 text-xs text-white/40 font-medium">组件显示</div>
            
            {Object.entries({
                clock: '时钟',
                date: '日期',
                search: '搜索栏',
                shortcuts: '收藏夹',
                mediaPlayer: '媒体播放器',
                weather: '天气',
                quote: '每日一言'
            }).map(([key, label]) => (
                <button
                    key={key}
                    // @ts-ignore
                    onClick={() => { toggleVisibility(key); }}
                    className="w-full text-left px-4 py-1.5 text-sm text-white hover:bg-white/10 flex items-center gap-2"
                >
                    {/* @ts-ignore */}
                    {layout[key]?.visible ? <Eye size={14} className="text-blue-400" /> : <EyeOff size={14} className="text-zinc-500" />}
                    {/* @ts-ignore */}
                    <span className={layout[key]?.visible ? 'text-white' : 'text-zinc-500'}>{label}</span>
                </button>
            ))}

            <div className="border-t border-white/5 my-1" />

            <button 
                onClick={() => { setIsSettingsOpen(true); setContextMenu(null); }}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center gap-2"
            >
                <Settings size={14} />
                页面设置
            </button>
            <button 
                onClick={() => { resetLayout(); setContextMenu(null); }}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 flex items-center gap-2"
            >
                <RotateCcw size={14} />
                重置布局
            </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full h-full">
        
        {/* Home View */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 transform ${viewMode === 'home' ? 'opacity-100 visible' : 'opacity-0 pointer-events-none invisible'}`}>
             <div className="relative w-full h-full flex items-center justify-center">
                 {/* Clock */}
                 <ResizableDraggable 
                    id="clock" 
                    x={layout.clock.x} 
                    y={layout.clock.y} 
                    w={layout.clock.w} 
                    h={layout.clock.h} 
                    onUpdate={handleUpdate} 
                    isEditing={isEditingLayout}
                    visible={layout.clock.visible}
                 >
                     <Clock />
                 </ResizableDraggable>

                 {/* Date */}
                 {/* @ts-ignore */}
                 <ResizableDraggable 
                    id="date" 
                    // @ts-ignore
                    x={layout.date?.x || 0} 
                    // @ts-ignore
                    y={layout.date?.y || -20} 
                    // @ts-ignore
                    w={layout.date?.w || 400} 
                    // @ts-ignore
                    h={layout.date?.h || 50} 
                    onUpdate={handleUpdate} 
                    isEditing={isEditingLayout}
                    // @ts-ignore
                    visible={layout.date?.visible ?? false}
                 >
                     <DateWidget />
                 </ResizableDraggable>

                 {/* Search */}
                 <ResizableDraggable 
                    id="search" 
                    x={layout.search.x} 
                    y={layout.search.y} 
                    w={layout.search.w} 
                    h={layout.search.h} 
                    onUpdate={handleUpdate} 
                    isEditing={isEditingLayout}
                    visible={layout.search.visible}
                 >
                     <Search />
                 </ResizableDraggable>

                 {/* Shortcuts/Bookmarks Widget */}
                 <ResizableDraggable 
                    id="shortcuts" 
                    x={layout.shortcuts.x} 
                    y={layout.shortcuts.y} 
                    w={layout.shortcuts.w} 
                    h={layout.shortcuts.h} 
                    onUpdate={handleUpdate} 
                    isEditing={isEditingLayout}
                    visible={layout.shortcuts.visible}
                 >
                     <Bookmarks />
                 </ResizableDraggable>

                 {/* Media Player Widget */}
                 {/* @ts-ignore */}
                 <ResizableDraggable 
                    id="mediaPlayer" 
                    // @ts-ignore
                    x={layout.mediaPlayer?.x || 300} 
                    // @ts-ignore
                    y={layout.mediaPlayer?.y || 200} 
                    // @ts-ignore
                    w={layout.mediaPlayer?.w || 300} 
                    // @ts-ignore
                    h={layout.mediaPlayer?.h || 100} 
                    onUpdate={handleUpdate} 
                    isEditing={isEditingLayout}
                    // @ts-ignore
                    visible={layout.mediaPlayer?.visible ?? true}
                 >
                     <MediaPlayer showPlaceholder={isEditingLayout} />
                 </ResizableDraggable>

                 {/* Weather Widget */}
                 {/* @ts-ignore */}
                 <ResizableDraggable 
                    id="weather" 
                    // @ts-ignore
                    x={layout.weather?.x || 300} 
                    // @ts-ignore
                    y={layout.weather?.y || -200} 
                    // @ts-ignore
                    w={layout.weather?.w || 250} 
                    // @ts-ignore
                    h={layout.weather?.h || 120} 
                    onUpdate={handleUpdate} 
                    isEditing={isEditingLayout}
                    // @ts-ignore
                    visible={layout.weather?.visible ?? false}
                 >
                     <Weather />
                 </ResizableDraggable>

                 {/* Quote Widget */}
                 {/* @ts-ignore */}
                 <ResizableDraggable 
                    id="quote" 
                    // @ts-ignore
                    x={layout.quote?.x || -300} 
                    // @ts-ignore
                    y={layout.quote?.y || 200} 
                    // @ts-ignore
                    w={layout.quote?.w || 300} 
                    // @ts-ignore
                    h={layout.quote?.h || 100} 
                    onUpdate={handleUpdate} 
                    isEditing={isEditingLayout}
                    // @ts-ignore
                    visible={layout.quote?.visible ?? false}
                 >
                     <Quote />
                 </ResizableDraggable>
             </div>
        </div>

        {/* Bookmarks View */}
        <div className={`absolute inset-0 flex flex-col items-center pt-24 pb-10 transition-all duration-500 transform ${viewMode === 'bookmarks' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
             <div className="w-full max-w-6xl h-full overflow-y-auto custom-scrollbar px-4">
                 <Bookmarks />
             </div>
        </div>

        {/* History View */}
        <div className={`absolute inset-0 flex flex-col items-center pt-24 pb-10 transition-all duration-500 transform ${viewMode === 'history' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
             <div className="w-full max-w-4xl h-full bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl overflow-hidden">
                 <div className="flex items-center gap-2 mb-6 text-white/80 border-b border-white/10 pb-4">
                     <History size={24} />
                     <h2 className="text-xl font-medium">历史记录</h2>
                 </div>
                 <HistoryViewer />
             </div>
        </div>

        {/* DevTools View */}
        <div className={`absolute inset-0 flex flex-col items-center pt-24 pb-10 transition-all duration-500 transform ${viewMode === 'devtools' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
             <div className="w-full max-w-5xl h-full bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl overflow-hidden flex flex-col">
                 <div className="flex items-center gap-2 mb-4 text-white/80 border-b border-white/10 pb-4">
                     <Terminal size={24} />
                     <h2 className="text-xl font-medium">开发者工具箱</h2>
                 </div>
                 <div className="flex-1 min-h-0">
                    <DevTools />
                 </div>
             </div>
        </div>

        {/* Extensions View */}
        <div className={`absolute inset-0 flex flex-col items-center pt-24 pb-10 transition-all duration-500 transform ${viewMode === 'extensions' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
             <div className="w-full max-w-6xl h-full bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl overflow-hidden">
                 <ExtensionsViewer />
             </div>
        </div>

      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/50 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-96 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-white text-lg font-medium mb-6">设置</h3>
            
            <div className="space-y-6">
              {/* Clock Settings */}
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">显示秒数</span>
                <button 
                  onClick={toggleShowSeconds}
                  className={`w-12 h-6 rounded-full transition-colors relative ${showSeconds ? 'bg-blue-600' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${showSeconds ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Search Engine Settings */}
              <div>
                <span className="text-zinc-300 block mb-2 font-medium">默认搜索引擎</span>
                <div className="flex gap-2">
                    {['google', 'bing', 'baidu'].map((engine) => (
                        <button
                            key={engine}
                            onClick={() => setSearchEngine(engine as any)}
                            className={`flex-1 py-2 rounded-lg text-sm capitalize transition-colors ${searchEngine === engine ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                        >
                            {engine}
                        </button>
                    ))}
                </div>
              </div>

              <div className="h-px bg-zinc-800" />

              {/* Background Settings */}
              <div>
                <span className="text-zinc-300 block mb-2 font-medium">背景设置</span>
                
                <div className="flex gap-2 mb-4">
                    <button 
                        onClick={switchToImage}
                        className={`flex-1 py-2 rounded-lg text-sm transition-colors ${backgroundType === 'image' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                    >
                        图片
                    </button>
                    <button 
                        onClick={() => setBackgroundType('video')}
                        className={`flex-1 py-2 rounded-lg text-sm transition-colors ${backgroundType === 'video' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                    >
                        视频
                    </button>
                </div>

                {backgroundType === 'image' ? (
                    <>
                        <div className="mb-4">
                            <span className="text-zinc-400 text-xs block mb-2">本地图片</span>
                            {localImagePreview ? (
                                <div className="space-y-2">
                                    <div className="relative rounded-lg overflow-hidden h-24">
                                        <img src={localImagePreview} alt="本地图片预览" className="w-full h-full object-cover" />
                                        {backgroundImageSource === 'local' && (
                                            <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">使用中</div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {backgroundImageSource !== 'local' && (
                                            <button 
                                                onClick={() => applyLocalImage()}
                                                className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors"
                                            >
                                                使用本地图片
                                            </button>
                                        )}
                                        <label className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors cursor-pointer text-center">
                                            重新上传
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                        </label>
                                    </div>
                                    {imageUploadStatus && <span className="text-blue-400 text-xs">{imageUploadStatus}</span>}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-xl p-4 hover:border-zinc-500 transition-colors cursor-pointer relative group">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <Upload className="text-zinc-400 mb-2 group-hover:text-white transition-colors" />
                                    <span className="text-zinc-400 text-sm group-hover:text-white transition-colors">点击上传本地图片 (Max 10MB)</span>
                                    {imageUploadStatus && <span className="text-blue-400 text-xs mt-2">{imageUploadStatus}</span>}
                                </div>
                            )}
                        </div>

                        <span className="text-zinc-400 text-xs block mb-2">或者使用网络图片链接</span>
                        <form onSubmit={handleBgSubmit} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="https://..."
                            value={bgUrlInput}
                            onChange={(e) => setBgUrlInput(e.target.value)}
                            className="flex-1 bg-zinc-800 text-white px-3 py-2 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm"
                        />
                        <button type="submit" className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-zinc-700 text-sm transition-colors">
                            应用
                        </button>
                        </form>
                        <div className="mt-2 text-xs text-zinc-500">
                        提示: 如果上传了本地图片，将优先显示本地图片。输入链接并应用可切换回网络图片。
                        </div>
                    </>
                ) : (
                    <div>
                        {localVideoPreview ? (
                            <div className="space-y-2">
                                <div className="relative rounded-lg overflow-hidden h-24">
                                    <video src={localVideoPreview} className="w-full h-full object-cover" muted />
                                    <div className="absolute top-1 right-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">已上传</div>
                                </div>
                                <div className="flex gap-2">
                                    <label className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors cursor-pointer text-center">
                                        重新上传视频
                                        <input type="file" accept="video/mp4,video/webm" onChange={handleVideoUpload} className="hidden" />
                                    </label>
                                </div>
                                {uploadStatus && <span className="text-blue-400 text-xs">{uploadStatus}</span>}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-xl p-4 hover:border-zinc-500 transition-colors cursor-pointer relative group">
                                <input 
                                    type="file" 
                                    accept="video/mp4,video/webm"
                                    onChange={handleVideoUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <Upload className="text-zinc-400 mb-2 group-hover:text-white transition-colors" />
                                <span className="text-zinc-400 text-sm group-hover:text-white transition-colors">点击上传本地视频 (Max 50MB)</span>
                                {uploadStatus && <span className="text-blue-400 text-xs mt-2">{uploadStatus}</span>}
                            </div>
                        )}
                    </div>
                )}
              </div>

              <div className="h-px bg-zinc-800" />

              <button
                onClick={() => { setIsSettingsOpen(false); setIsShareOpen(true); }}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors font-medium"
              >
                布局分享与导入
              </button>
            </div>

            <div className="mt-8 flex justify-end">
              <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors">关闭</button>
            </div>
          </div>
        </div>
      )}

      {isShareOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/50 backdrop-blur-sm" onClick={() => setIsShareOpen(false)}>
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-[420px] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <h3 className="text-white text-xl font-bold">静谧新标签页</h3>
              <p className="text-zinc-500 text-xs mt-1">布局分享 · 让美好与他人共享</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-zinc-800/50 rounded-xl">
                <h4 className="text-zinc-300 text-sm font-medium mb-3">导出我的布局</h4>
                <button
                  onClick={() => {
                    const code = exportLayout();
                    setShareCode(code);
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors font-medium"
                >
                  生成分享码
                </button>
                {shareCode && (
                  <div className="mt-3 p-3 bg-zinc-900 rounded-lg border border-zinc-700">
                    <p className="text-xs text-zinc-300 break-all font-mono leading-relaxed select-all">{shareCode}</p>
                    <button
                      onClick={() => {
                        const shareText = `【静谧新标签页】布局分享\n\n我正在使用「静谧新标签页」，这是我的布局配置，复制下方代码即可导入：\n\n${shareCode}\n\n下载扩展：https://github.com/tlkppm/zen-newtab`;
                        navigator.clipboard.writeText(shareText);
                        setShareMessage('已复制分享内容');
                        setTimeout(() => setShareMessage(''), 2000);
                      }}
                      className="w-full mt-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded-lg transition-colors"
                    >
                      复制分享内容
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-xl">
                <h4 className="text-zinc-300 text-sm font-medium mb-3">导入他人布局</h4>
                <input
                  type="text"
                  value={importCode}
                  onChange={(e) => setImportCode(e.target.value)}
                  placeholder="粘贴分享码 ZEN://..."
                  className="w-full bg-zinc-900 text-white px-3 py-2.5 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm font-mono"
                />
                <button
                  onClick={() => {
                    if (importLayout(importCode)) {
                      setShareMessage('导入成功');
                      setImportCode('');
                      setShareCode('');
                    } else {
                      setShareMessage('分享码无效');
                    }
                    setTimeout(() => setShareMessage(''), 2000);
                  }}
                  className="w-full mt-3 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg transition-colors font-medium"
                >
                  应用布局
                </button>
              </div>

              {shareMessage && (
                <p className={`text-center text-sm font-medium ${shareMessage.includes('成功') ? 'text-green-400' : 'text-red-400'}`}>
                  {shareMessage}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-center">
              <button onClick={() => { setIsShareOpen(false); setShareCode(''); setImportCode(''); }} className="px-6 py-2 text-zinc-400 hover:text-white transition-colors">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
