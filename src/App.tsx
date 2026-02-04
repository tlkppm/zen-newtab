import { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Upload, Clock as ClockIcon, Book, History, Terminal, Puzzle, Move, RotateCcw, MonitorPlay, Eye, EyeOff, Scaling, Cloud, Quote as QuoteIcon, Calendar, Plus, Grid, Info, Home, Code, Search as SearchIcon, Star, CheckSquare, StickyNote, Timer, Music, CalendarDays, Menu, Sparkles, Bot, Hexagon } from 'lucide-react';
import { useStore } from './store/useStore';
import { Background } from './components/Background';
import { Clock, DateWidget } from './components/Clock';
import { Search } from './components/Search';
import { Bookmarks } from './components/Bookmarks';
import { HistoryViewer } from './components/HistoryViewer';
import { DevTools } from './components/DevTools';
import { MediaPlayer } from './components/MediaPlayer';
import { AboutPage } from './components/AboutPage';
import { ExtensionsViewer } from './components/ExtensionsViewer';
import { Weather } from './components/Weather';
import { Quote } from './components/Quote';
import { TodoList } from './components/TodoList';
import { Memo } from './components/Memo';
import { CalendarWidget } from './components/CalendarWidget';
import { Pomodoro } from './components/Pomodoro';
import { DevUtils } from './components/DevUtils';
import { FocusSounds } from './components/FocusSounds';
import { DeepBreath } from './components/DeepBreath';
import { Tiles, SingleTile, TileEditor } from './components/Tiles';
import { PhotoGridGenerator } from './components/PhotoGridGenerator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UpdateNotification } from './components/UpdateNotification';
import { WidgetEditor, CustomWidgetRenderer } from './components/WidgetEditor';
import { saveVideoToDB, clearVideoFromDB, saveImageToDB, getImageFromDB, getVideoFromDB, clearImageFromDB } from './lib/db';
import { ToastContainer } from './components/Toast';
import { useToastStore } from './store/useToastStore';
import { SettingsModal } from './components/SettingsModal';
import { BirthdaySetupModal } from './components/BirthdaySetupModal';
import { BirthdayGreeting } from './components/BirthdayGreeting';
import { AIChat } from './components/AIChat';
import dayjs from 'dayjs';

type ViewMode = 'home' | 'bookmarks' | 'history' | 'devtools' | 'extensions' | 'about' | 'ai-chat';

// Alignment detection threshold in pixels
const SNAP_THRESHOLD = 8;

interface AlignmentGuide {
    type: 'vertical' | 'horizontal';
    position: number; // screen position
}

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
    visible,
    onDragState,
    allBounds
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
    onDragState?: (id: string, bounds: { x: number, y: number, w: number, h: number } | null) => void;
    allBounds?: Record<string, { x: number, y: number, w: number, h: number }>;
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
                let newX = initialDragPos.current.x + dx;
                let newY = initialDragPos.current.y + dy;
                
                // Snap to other elements
                if (allBounds) {
                    const screenCenterX = window.innerWidth / 2;
                    const screenCenterY = window.innerHeight / 2;
                    const myLeft = screenCenterX + newX;
                    const myRight = myLeft + size.w;
                    const myCenterX = myLeft + size.w / 2;
                    const myTop = screenCenterY + newY;
                    const myBottom = myTop + size.h;
                    const myCenterY = myTop + size.h / 2;
                    
                    Object.entries(allBounds).forEach(([otherId, other]) => {
                        if (otherId === id) return;
                        const otherLeft = screenCenterX + other.x;
                        const otherRight = otherLeft + other.w;
                        const otherCenterX = otherLeft + other.w / 2;
                        const otherTop = screenCenterY + other.y;
                        const otherBottom = otherTop + other.h;
                        const otherCenterY = otherTop + other.h / 2;
                        
                        // Snap X
                        if (Math.abs(myLeft - otherLeft) < SNAP_THRESHOLD) newX = other.x;
                        else if (Math.abs(myRight - otherRight) < SNAP_THRESHOLD) newX = other.x + other.w - size.w;
                        else if (Math.abs(myLeft - otherRight) < SNAP_THRESHOLD) newX = other.x + other.w;
                        else if (Math.abs(myRight - otherLeft) < SNAP_THRESHOLD) newX = other.x - size.w;
                        else if (Math.abs(myCenterX - otherCenterX) < SNAP_THRESHOLD) newX = other.x + (other.w - size.w) / 2;
                        
                        // Snap Y
                        if (Math.abs(myTop - otherTop) < SNAP_THRESHOLD) newY = other.y;
                        else if (Math.abs(myBottom - otherBottom) < SNAP_THRESHOLD) newY = other.y + other.h - size.h;
                        else if (Math.abs(myTop - otherBottom) < SNAP_THRESHOLD) newY = other.y + other.h;
                        else if (Math.abs(myBottom - otherTop) < SNAP_THRESHOLD) newY = other.y - size.h;
                        else if (Math.abs(myCenterY - otherCenterY) < SNAP_THRESHOLD) newY = other.y + (other.h - size.h) / 2;
                    });
                    
                    // Snap to screen center
                    if (Math.abs(myCenterX - screenCenterX) < SNAP_THRESHOLD) newX = -size.w / 2;
                    if (Math.abs(myCenterY - screenCenterY) < SNAP_THRESHOLD) newY = -size.h / 2;
                }
                
                setPos({ x: newX, y: newY });
                onDragState?.(id, { x: newX, y: newY, w: size.w, h: size.h });
            } else if (isResizing) {
                const dx = e.clientX - startPos.current.x;
                const dy = e.clientY - startPos.current.y;
                const newW = Math.max(100, initialSize.current.w + dx);
                const newH = Math.max(50, initialSize.current.h + dy);
                setSize({ w: newW, h: newH });
                onDragState?.(id, { x: pos.x, y: pos.y, w: newW, h: newH });
            }
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                onUpdate(id, { x: pos.x, y: pos.y });
                onDragState?.(id, null);
            }
            if (isResizing) {
                setIsResizing(false);
                onUpdate(id, { w: size.w, h: size.h });
                onDragState?.(id, null);
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
            className={`absolute transition-transform duration-75 ${isEditing ? 'cursor-move ring-1 ring-white/20 rounded-xl bg-white/5 backdrop-blur-sm' : ''}`}
            onMouseDown={handleMouseDown}
        >
            {isEditing && (
                <>
                    <div className="absolute -top-3 -right-3 bg-white/20 backdrop-blur-md text-white p-1 rounded-full shadow-sm z-50 pointer-events-none ring-1 ring-white/10">
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
  const [showBirthdayGreeting, setShowBirthdayGreeting] = useState(false);
  
  const { 
    showSeconds, 
    toggleShowSeconds, 
    backgroundImage,
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
    importLayout,
    tiles,
    addTile,
    customWidgets,
    isNavBarVisible,
    toggleNavBar,
    showBookmarksOnStartup,
    toggleShowBookmarksOnStartup,
    bookmarkIconSize,
    setBookmarkIconSize,
    navBarConfig,
    setNavBarConfig,
    birthday,
    setBirthday,
    isBirthdayMode,
    setIsBirthdayMode,
    generatedBirthdayImage,
    setGeneratedBirthdayImage,
    preBirthdayBackground,
    setPreBirthdayBackground,
    lastGreetingDate,
    setLastGreetingDate
  } = useStore();
  const { addToast } = useToastStore();
  
  // Initialize view mode based on settings
  useEffect(() => {
    // Self-healing: Ensure clock is visible and has a valid position
    if (!layout.clock || !layout.clock.visible) {
        // Force reset clock visibility and position if missing
        updateLayout('clock', { visible: true, x: 0, y: -100, w: 600, h: 200 });
    }

    if (showBookmarksOnStartup) {
      setViewMode('bookmarks');
    }
    
    // Birthday Check
    if (birthday && birthday !== 'skip') {
        const today = dayjs().format('MM-DD');
        const todayFull = dayjs().format('YYYY-MM-DD');

        if (birthday === today) {
            // Check if we should show greeting on mount/update
            if (!isBirthdayMode) {
                setPreBirthdayBackground({ image: backgroundImage, source: backgroundImageSource });
                setIsBirthdayMode(true);
                
                // Only show greeting if it hasn't been shown today
                if (lastGreetingDate !== todayFull) {
                    setShowBirthdayGreeting(true);
                }
                
                if (!generatedBirthdayImage) {
                    const prompt = "warm birthday party atmosphere, birthday cake with candles, colorful balloons, soft golden lighting, cozy living room, photorealistic, 8k resolution, cinematic composition, celebrating life, no text";
                    const url = `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_16_9`;
                    setGeneratedBirthdayImage(url);
                    setBackgroundImage(url);
                    addToast({ type: 'info', message: '正在为您生成专属生日背景...' });
                } else {
                    setBackgroundImage(generatedBirthdayImage);
                }
            }
        } else {
            if (isBirthdayMode) {
                setIsBirthdayMode(false);
                if (preBirthdayBackground) {
                    if (preBirthdayBackground.source === 'local') {
                        useStore.getState().applyLocalImage();
                    } else {
                        setBackgroundImage(preBirthdayBackground.image);
                    }
                    setPreBirthdayBackground(null);
                }
            }
        }
    } else {
        if (isBirthdayMode) {
            setIsBirthdayMode(false);
            if (preBirthdayBackground) {
                if (preBirthdayBackground.source === 'local') {
                    useStore.getState().applyLocalImage();
                } else {
                    setBackgroundImage(preBirthdayBackground.image);
                }
                setPreBirthdayBackground(null);
            }
        }
    }
  }, [birthday, isBirthdayMode, generatedBirthdayImage, preBirthdayBackground, backgroundImage, backgroundImageSource, lastGreetingDate]);

  // Navbar Drag Logic
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!isEditingLayout || navBarConfig.position !== 'floating') return;
    const el = navRef.current;
    if (!el) return;

    let isDragging = false;
    let startX = 0, startY = 0;
    let initX = navBarConfig.x || 100;
    let initY = navBarConfig.y || 100;

    const handleDown = (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        el.style.cursor = 'grabbing';
    };

    const handleMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        el.style.transform = `translate(${initX + dx}px, ${initY + dy}px)`;
    };

    const handleUp = (e: MouseEvent) => {
        if (!isDragging) return;
        isDragging = false;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        setNavBarConfig({ x: initX + dx, y: initY + dy });
        el.style.cursor = 'grab';
    };

    el.addEventListener('mousedown', handleDown);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
        el.removeEventListener('mousedown', handleDown);
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
    };
  }, [isEditingLayout, navBarConfig]);

  // Navbar Style Classes
  const getNavStyle = () => {
      const base = "flex items-center gap-1 p-1 rounded-full transition-all duration-300";
      switch (navBarConfig.style) {
          case 'solid': return `${base} bg-zinc-900 border border-zinc-800`;
          case 'transparent': return `${base} bg-transparent`;
          default: return `${base} bg-black/20 backdrop-blur-md border border-white/10`;
      }
  };

  const getNavPosition = () => {
      if (navBarConfig.position === 'floating') {
          return { 
              position: 'fixed' as const, 
              left: 0, 
              top: 0, 
              transform: `translate(${navBarConfig.x || 100}px, ${navBarConfig.y || 100}px)` 
          };
      }
      if (navBarConfig.position === 'bottom') {
          return { position: 'absolute' as const, bottom: 0, left: 0, right: 0, padding: '1.5rem', display: 'flex', justifyContent: 'center' };
      }
      return { position: 'absolute' as const, top: 0, left: 0, right: 0, padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
  };
  
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
  const [isTileEditorOpen, setIsTileEditorOpen] = useState(false);
  const [isPhotoGridOpen, setIsPhotoGridOpen] = useState(false);
  const [isWidgetEditorOpen, setIsWidgetEditorOpen] = useState(false);
  const [clipboardShareCode, setClipboardShareCode] = useState<string | null>(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  useEffect(() => {
    const extractShareCode = (text: string): string | null => {
      const zenMatch = text.match(/ZEN:\/\/[A-Za-z0-9+/=]+/);
      if (zenMatch) return zenMatch[0];
      const zenCompactMatch = text.match(/ZEN[A-Za-z0-9_-]{20,}/);
      if (zenCompactMatch) return zenCompactMatch[0];
      return null;
    };

    const checkClipboard = async () => {
      try {
        if (!document.hasFocus()) return;
        const text = await navigator.clipboard.readText();
        const shareCode = extractShareCode(text);
        if (shareCode) {
          const lastHandled = sessionStorage.getItem('lastHandledShareCode');
          if (lastHandled !== shareCode) {
            setClipboardShareCode(shareCode);
          }
        }
      } catch {
      }
    };

    checkClipboard();

    const handleFocus = () => checkClipboard();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleClipboardImport = () => {
    if (clipboardShareCode && importLayout(clipboardShareCode)) {
      sessionStorage.setItem('lastHandledShareCode', clipboardShareCode);
      setClipboardShareCode(null);
    }
  };

  const dismissClipboardPrompt = () => {
    if (clipboardShareCode) {
      sessionStorage.setItem('lastHandledShareCode', clipboardShareCode);
      setClipboardShareCode(null);
    }
  };

  // Drag state for alignment guides
  const [dragBounds, setDragBounds] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);

  // Get all element bounds for snapping
  const getAllBounds = useCallback(() => {
    const bounds: Record<string, { x: number, y: number, w: number, h: number }> = {};
    Object.entries(layout).forEach(([key, item]) => {
      if (item.visible) {
        bounds[key] = { x: item.x, y: item.y, w: item.w, h: item.h };
      }
    });
    return bounds;
  }, [layout]);

  // Handle drag state updates and calculate alignment guides
  const handleDragState = useCallback((id: string, bounds: { x: number, y: number, w: number, h: number } | null) => {
    setDragBounds(bounds);
    if (!bounds) {
      setAlignmentGuides([]);
      return;
    }

    const guides: AlignmentGuide[] = [];
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;
    const myLeft = screenCenterX + bounds.x;
    const myRight = myLeft + bounds.w;
    const myCenterX = myLeft + bounds.w / 2;
    const myTop = screenCenterY + bounds.y;
    const myBottom = myTop + bounds.h;
    const myCenterY = myTop + bounds.h / 2;

    // Check screen center alignment
    if (Math.abs(myCenterX - screenCenterX) < SNAP_THRESHOLD) {
      guides.push({ type: 'vertical', position: screenCenterX });
    }
    if (Math.abs(myCenterY - screenCenterY) < SNAP_THRESHOLD) {
      guides.push({ type: 'horizontal', position: screenCenterY });
    }

    // Check alignment with other elements
    Object.entries(layout).forEach(([otherId, other]) => {
      if (otherId === id || !other.visible) return;
      const otherLeft = screenCenterX + other.x;
      const otherRight = otherLeft + other.w;
      const otherCenterX = otherLeft + other.w / 2;
      const otherTop = screenCenterY + other.y;
      const otherBottom = otherTop + other.h;
      const otherCenterY = otherTop + other.h / 2;

      // Vertical guides (X alignment)
      if (Math.abs(myLeft - otherLeft) < SNAP_THRESHOLD) guides.push({ type: 'vertical', position: otherLeft });
      if (Math.abs(myRight - otherRight) < SNAP_THRESHOLD) guides.push({ type: 'vertical', position: otherRight });
      if (Math.abs(myLeft - otherRight) < SNAP_THRESHOLD) guides.push({ type: 'vertical', position: otherRight });
      if (Math.abs(myRight - otherLeft) < SNAP_THRESHOLD) guides.push({ type: 'vertical', position: otherLeft });
      if (Math.abs(myCenterX - otherCenterX) < SNAP_THRESHOLD) guides.push({ type: 'vertical', position: otherCenterX });

      // Horizontal guides (Y alignment)
      if (Math.abs(myTop - otherTop) < SNAP_THRESHOLD) guides.push({ type: 'horizontal', position: otherTop });
      if (Math.abs(myBottom - otherBottom) < SNAP_THRESHOLD) guides.push({ type: 'horizontal', position: otherBottom });
      if (Math.abs(myTop - otherBottom) < SNAP_THRESHOLD) guides.push({ type: 'horizontal', position: otherBottom });
      if (Math.abs(myBottom - otherTop) < SNAP_THRESHOLD) guides.push({ type: 'horizontal', position: otherTop });
      if (Math.abs(myCenterY - otherCenterY) < SNAP_THRESHOLD) guides.push({ type: 'horizontal', position: otherCenterY });
    });

    setAlignmentGuides(guides);
  }, [layout]);

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
          <>
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg z-[100] flex items-center gap-2 animate-bounce-in">
                  <span>布局编辑模式</span>
                  <div className="h-4 w-px bg-white/30"></div>
                  <button onClick={resetLayout} className="hover:text-blue-200" title="重置布局"><RotateCcw size={16}/></button>
                  <button onClick={() => setIsEditingLayout(false)} className="hover:text-blue-200 font-bold ml-2">完成</button>
              </div>
              
              {/* Dynamic Alignment Guide Lines */}
              <div className="absolute inset-0 pointer-events-none z-[90]">
                  {alignmentGuides.map((guide, i) => (
                      guide.type === 'vertical' ? (
                          <div 
                              key={`v-${i}`}
                              className="absolute top-0 bottom-0 w-px bg-magenta-500"
                              style={{ 
                                  left: guide.position, 
                                  background: 'linear-gradient(to bottom, transparent, #f0f, transparent)',
                                  boxShadow: '0 0 8px #f0f'
                              }} 
                          />
                      ) : (
                          <div 
                              key={`h-${i}`}
                              className="absolute left-0 right-0 h-px"
                              style={{ 
                                  top: guide.position,
                                  background: 'linear-gradient(to right, transparent, #f0f, transparent)',
                                  boxShadow: '0 0 8px #f0f'
                              }} 
                          />
                      )
                  ))}
              </div>
          </>
      )}

      {/* Top Navigation Bar */}
      <nav 
        ref={navRef}
        style={getNavPosition()}
        className={`z-50 transition-all duration-300 ${isEditingLayout || !isNavBarVisible ? (isEditingLayout ? 'visible opacity-100 cursor-move' : 'opacity-0 -translate-y-4 pointer-events-none invisible') : 'opacity-100 translate-y-0 visible'}`}
      >
          {/* Left: View Switcher */}
          <div className="flex flex-col gap-4 pointer-events-auto">
              <div className={getNavStyle()}>
                  <button 
                    onClick={() => setViewMode('home')}
                    className={`p-2 rounded-full transition-all ${viewMode === 'home' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                    title="主页"
                  >
                      <Home size={20} />
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
                  <button 
                    onClick={() => setViewMode('ai-chat')}
                    className={`p-2 rounded-full transition-all ${viewMode === 'ai-chat' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                    title="Trae 助手"
                    data-ai-entry
                  >
                      <Bot size={20} />
                  </button>
                  <button 
                    onClick={() => setViewMode('about')}
                    className={`p-2 rounded-full transition-all ${viewMode === 'about' ? 'bg-white text-black shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                    title="关于"
                  >
                      <Info size={20} />
                  </button>
              </div>
          </div>
      </nav>

      {/* Context Menu */}
      {contextMenu && (
        <div 
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed bg-zinc-900/95 border border-white/10 rounded-xl shadow-2xl py-2 z-[9999] min-w-[220px] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="px-2 pb-2">
                <div className="grid grid-cols-4 gap-1">
                    {Object.entries({
                        clock: { label: '时钟', icon: <ClockIcon size={18} /> },
                        date: { label: '日期', icon: <CalendarDays size={18} /> },
                        calendar: { label: '日历', icon: <Calendar size={18} /> },
                        search: { label: '搜索', icon: <SearchIcon size={18} /> },
                        shortcuts: { label: '收藏', icon: <Star size={18} /> },
                        weather: { label: '天气', icon: <Cloud size={18} /> },
                        quote: { label: '语录', icon: <QuoteIcon size={18} /> },
                        todo: { label: '待办', icon: <CheckSquare size={18} /> },
                        memo: { label: '便签', icon: <StickyNote size={18} /> },
                        pomodoro: { label: '番茄', icon: <Timer size={18} /> },
                        mediaPlayer: { label: '音乐', icon: <Music size={18} /> },
                        devUtils: { label: '工具', icon: <Code size={18} /> },
                        focusSounds: { label: '白噪音', icon: <Cloud size={18} /> },
                        deepBreath: { label: '深呼吸', icon: <Scaling size={18} /> },
                    }).map(([key, { label, icon }]) => (
                        <button
                            key={key}
                            onClick={() => { toggleVisibility(key); }}
                            className={`flex flex-col items-center gap-1.5 p-2 rounded-xl text-xs transition-all ${
                                // @ts-ignore
                                layout[key]?.visible 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                                    : 'text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                            }`}
                            title={label}
                        >
                            <span className="opacity-90">{icon}</span>
                            <span className="truncate w-full text-center text-[10px] font-medium opacity-80">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="border-t border-white/10 my-1" />

            <button 
                onClick={() => { toggleNavBar(); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-2"
            >
                {isNavBarVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                {isNavBarVisible ? '隐藏菜单栏' : '显示菜单栏'}
            </button>

            <button 
                onClick={() => { setIsEditingLayout(!isEditingLayout); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-2"
            >
                <Move size={14} />
                {isEditingLayout ? '退出编辑' : '编辑布局'}
            </button>

            <div className="border-t border-white/10 my-1" />

            <button 
                onClick={() => { setIsTileEditorOpen(true); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-2"
            >
                <Plus size={14} />
                添加磁贴
            </button>
            <button 
                onClick={() => { setIsPhotoGridOpen(true); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-2"
            >
                <Grid size={14} />
                图片拼图
            </button>
            <button 
                onClick={() => { setIsWidgetEditorOpen(true); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-2"
            >
                <Code size={14} />
                自定义组件
            </button>

            <div className="border-t border-white/10 my-1" />

            <button 
                onClick={() => { setIsSettingsOpen(true); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-2"
            >
                <Settings size={14} />
                页面设置
            </button>
            <button 
                onClick={() => { resetLayout(); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5 flex items-center gap-2"
            >
                <RotateCcw size={14} />
                重置布局
            </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 md:p-8 transition-all duration-500 overflow-hidden">
        
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
                    onDragState={handleDragState}
                    allBounds={getAllBounds()}
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
                    onDragState={handleDragState}
                    allBounds={getAllBounds()}
                 >
                     <DateWidget />
                 </ResizableDraggable>

                 {/* Calendar Widget */}
                 {/* @ts-ignore */}
                 <ResizableDraggable 
                    id="calendar" 
                    // @ts-ignore
                    x={layout.calendar?.x || 400} 
                    // @ts-ignore
                    y={layout.calendar?.y || -100} 
                    // @ts-ignore
                    w={layout.calendar?.w || 360} 
                    // @ts-ignore
                    h={layout.calendar?.h || 340} 
                    onUpdate={handleUpdate} 
                    isEditing={isEditingLayout}
                    // @ts-ignore
                    visible={layout.calendar?.visible ?? false}
                    onDragState={handleDragState}
                    allBounds={getAllBounds()}
                 >
                     <CalendarWidget />
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
                    onDragState={handleDragState}
                    allBounds={getAllBounds()}
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
                    onDragState={handleDragState}
                    allBounds={getAllBounds()}
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
                    onDragState={handleDragState}
                    allBounds={getAllBounds()}
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
                    onDragState={handleDragState}
                    allBounds={getAllBounds()}
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
                    onDragState={handleDragState}
                    allBounds={getAllBounds()}
                 >
                     <Quote />
                 </ResizableDraggable>

                 {/* Todo List Widget */}
                 {/* @ts-ignore */}
                 <ResizableDraggable 
                    id="todo" 
                    // @ts-ignore
                    x={layout.todo?.x || -400} 
                    // @ts-ignore
                    y={layout.todo?.y || 0} 
                    // @ts-ignore
                    w={layout.todo?.w || 300} 
                    // @ts-ignore
                    h={layout.todo?.h || 400} 
                    onUpdate={handleUpdate} 
                    isEditing={isEditingLayout}
                    // @ts-ignore
                    visible={layout.todo?.visible ?? false}
                    onDragState={handleDragState}
                    allBounds={getAllBounds()}
                 >
                     <TodoList />
                 </ResizableDraggable>

                 {/* Memo Widget */}
                 {/* @ts-ignore */}
                 <ResizableDraggable 
                    id="memo" 
                    // @ts-ignore
                    x={layout.memo?.x || 400} 
                    // @ts-ignore
                    y={layout.memo?.y || 0} 
                    // @ts-ignore
                    w={layout.memo?.w || 300} 
                    // @ts-ignore
                    h={layout.memo?.h || 300} 
                    onUpdate={handleUpdate} 
                    isEditing={isEditingLayout}
                    // @ts-ignore
                    visible={layout.memo?.visible ?? false}
                    onDragState={handleDragState}
                    allBounds={getAllBounds()}
                 >
                     <Memo />
                 </ResizableDraggable>

                 {/* Pomodoro Widget */}
                 {/* @ts-ignore */}
                 <ResizableDraggable 
                    id="pomodoro" 
                    // @ts-ignore
                    x={layout.pomodoro?.x || 0} 
                    // @ts-ignore
                    y={layout.pomodoro?.y || 200} 
                    // @ts-ignore
                    w={layout.pomodoro?.w || 300} 
                    // @ts-ignore
                    h={layout.pomodoro?.h || 320} 
                    onUpdate={handleUpdate} 
                    isEditing={isEditingLayout}
                    // @ts-ignore
                    visible={layout.pomodoro?.visible ?? false}
                    onDragState={handleDragState}
                    allBounds={getAllBounds()}
                 >
                     <Pomodoro />
                 </ResizableDraggable>

                 {/* Dev Utils Widget */}
                 {/* @ts-ignore */}
                 <ResizableDraggable 
                    id="devUtils" 
                    // @ts-ignore
                    x={layout.devUtils?.x || -300} 
                    // @ts-ignore
                    y={layout.devUtils?.y || -200} 
                    // @ts-ignore
                    w={layout.devUtils?.w || 300} 
                    // @ts-ignore
                    h={layout.devUtils?.h || 300} 
                    onUpdate={handleUpdate} 
                    isEditing={isEditingLayout}
                    // @ts-ignore
                    visible={layout.devUtils?.visible ?? false}
                    onDragState={handleDragState}
                    allBounds={getAllBounds()}
                 >
                     <DevUtils />
                 </ResizableDraggable>

                 {/* Focus Sounds Widget */}
                 {/* @ts-ignore */}
                 <ResizableDraggable 
                    id="focusSounds" 
                    // @ts-ignore
                    x={layout.focusSounds?.x || 300} 
                    // @ts-ignore
                    y={layout.focusSounds?.y || 200} 
                    // @ts-ignore
                    w={layout.focusSounds?.w || 280} 
                    // @ts-ignore
                    h={layout.focusSounds?.h || 240} 
                    onUpdate={handleUpdate} 
                    isEditing={isEditingLayout}
                    // @ts-ignore
                    visible={layout.focusSounds?.visible ?? false}
                    onDragState={handleDragState}
                    allBounds={getAllBounds()}
                 >
                     <FocusSounds />
                 </ResizableDraggable>

                 {/* Deep Breath Widget */}
                 {/* @ts-ignore */}
                 <ResizableDraggable 
                    id="deepBreath" 
                    // @ts-ignore
                    x={layout.deepBreath?.x || 0} 
                    // @ts-ignore
                    y={layout.deepBreath?.y || 0} 
                    // @ts-ignore
                    w={layout.deepBreath?.w || 300} 
                    // @ts-ignore
                    h={layout.deepBreath?.h || 300} 
                    onUpdate={handleUpdate} 
                    isEditing={isEditingLayout}
                    // @ts-ignore
                    visible={layout.deepBreath?.visible ?? false}
                    onDragState={handleDragState}
                    allBounds={getAllBounds()}
                 >
                     <DeepBreath />
                 </ResizableDraggable>

                 {/* Individual Tiles */}
                 {tiles.map((tile) => {
                     const layoutId = `tile_${tile.id}`;
                     const tileLayout = layout[layoutId];
                     
                     // If no layout data exists yet (newly added), use defaults or don't render until updated
                     if (!tileLayout) return null;

                     return (
                         <ResizableDraggable
                            key={tile.id}
                            id={layoutId}
                            x={tileLayout.x}
                            y={tileLayout.y}
                            w={tileLayout.w}
                            h={tileLayout.h}
                            onUpdate={handleUpdate}
                            isEditing={isEditingLayout}
                            visible={tileLayout.visible}
                            onDragState={handleDragState}
                            allBounds={getAllBounds()}
                         >
                             <SingleTile tile={tile} isEditing={isEditingLayout} />
                         </ResizableDraggable>
                     );
                 })}

                 {/* Custom Widgets */}
                 {customWidgets.map(widget => {
                     const layoutId = `widget_${widget.id}`;
                     const widgetLayout = layout[layoutId];
                     if (!widgetLayout) return null;

                     return (
                         <ResizableDraggable
                            key={widget.id}
                            id={layoutId}
                            x={widgetLayout.x}
                            y={widgetLayout.y}
                            w={widgetLayout.w}
                            h={widgetLayout.h}
                            onUpdate={handleUpdate}
                            isEditing={isEditingLayout}
                            visible={widgetLayout.visible}
                            onDragState={handleDragState}
                            allBounds={getAllBounds()}
                         >
                             <div className="w-full h-full bg-black/20 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                                 <CustomWidgetRenderer widget={widget} />
                             </div>
                         </ResizableDraggable>
                     );
                 })}
             </div>
        </div>

        {/* Tile Editor Modal (for adding new tiles via context menu) */}
        <TileEditor 
            isOpen={isTileEditorOpen} 
            onClose={() => setIsTileEditorOpen(false)}
            onSave={(tile) => {
                addTile(tile);
            }}
        />

        {/* Photo Grid Generator Modal */}
        <PhotoGridGenerator
            isOpen={isPhotoGridOpen}
            onClose={() => setIsPhotoGridOpen(false)}
            onSave={(newTiles, rows, cols) => {
                newTiles.forEach((tile, index) => {
                    addTile(tile);
                    const row = Math.floor(index / cols);
                    const col = index % cols;
                    const tileSize = 120; // slightly larger
                    const startX = -((cols * tileSize) / 2) + (tileSize / 2);
                    const startY = -((rows * tileSize) / 2) + (tileSize / 2);
                    
                    const x = startX + (col * tileSize);
                    const y = startY + (row * tileSize);
                    
                    setTimeout(() => {
                        // @ts-ignore
                        updateLayout(`tile_${tile.id}`, { x, y, w: tileSize, h: tileSize });
                    }, 0);
                });
            }}
        />

        {/* Widget Editor Modal */}
        {isWidgetEditorOpen && (
            <WidgetEditor onClose={() => setIsWidgetEditorOpen(false)} />
        )}

        {/* Bookmarks View */}
        <div className={`absolute inset-0 flex flex-col items-center pt-36 pb-10 transition-all duration-500 transform ${viewMode === 'bookmarks' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
             <div className="w-full max-w-6xl h-full overflow-y-auto custom-scrollbar px-4">
                 <Bookmarks />
             </div>
        </div>

        {/* History View */}
        <div className={`absolute inset-0 flex flex-col items-center pt-36 pb-10 transition-all duration-500 transform ${viewMode === 'history' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
             <div className="w-full max-w-4xl h-full bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl overflow-hidden">
                 <div className="flex items-center gap-2 mb-6 text-white/80 border-b border-white/10 pb-4">
                     <History size={24} />
                     <h2 className="text-xl font-medium">历史记录</h2>
                 </div>
                 <HistoryViewer />
             </div>
        </div>

        {/* DevTools View */}
        <div className={`absolute inset-0 flex flex-col items-center pt-36 pb-10 transition-all duration-500 transform ${viewMode === 'devtools' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
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
        <div className={`absolute inset-0 flex flex-col items-center pt-36 pb-10 transition-all duration-500 transform ${viewMode === 'extensions' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
             <div className="w-full max-w-6xl h-full bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl overflow-hidden">
                 <ExtensionsViewer />
             </div>
        </div>

        {/* About View */}
        <div className={`absolute inset-0 flex flex-col items-center pt-36 pb-10 transition-all duration-500 transform ${viewMode === 'about' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
             <div className="w-full max-w-4xl h-full bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl overflow-hidden">
                 <AboutPage />
             </div>
        </div>

        {/* AI Chat View */}
        <div className={`absolute inset-0 flex flex-col items-center pt-36 pb-10 transition-all duration-500 transform ${viewMode === 'ai-chat' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
             <AIChat />
        </div>

      </main>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        onPreviewBirthday={() => setShowBirthdayGreeting(true)}
      />
      
      {/* Update Notification */}
      <UpdateNotification />
      <ToastContainer />

      {/* 剪贴板分享码提示 */}
      {clipboardShareCode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                <Upload size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-medium">检测到分享码</h3>
                <p className="text-zinc-400 text-sm">剪贴板中包含布局分享码</p>
              </div>
            </div>
            <div className="bg-zinc-800 rounded-lg p-3 mb-4 font-mono text-xs text-zinc-400 break-all max-h-20 overflow-y-auto">
              {clipboardShareCode.length > 100 
                ? clipboardShareCode.slice(0, 100) + '...' 
                : clipboardShareCode}
            </div>
            <p className="text-zinc-500 text-sm mb-4">
              是否导入此布局？导入后将覆盖当前布局设置。
            </p>
            <div className="flex gap-3">
              <button
                onClick={dismissClipboardPrompt}
                className="flex-1 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                忽略
              </button>
              <button
                onClick={handleClipboardImport}
                className="flex-1 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                导入布局
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
