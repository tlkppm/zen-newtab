import { useState, useMemo, useEffect } from 'react';
import { 
  X, Search, Monitor, Image as ImageIcon, Video, Upload, 
  Link, Clock, Layout, Share2, Download, UploadCloud,
  Palette, Smartphone, MousePointer2, Keyboard, Zap,
  Menu, ChevronRight, Bot, Key, Globe
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { saveImageToDB, saveVideoToDB, clearVideoFromDB, getImageFromDB, getVideoFromDB } from '../lib/db';
import { useToastStore } from '../store/useToastStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreviewBirthday?: () => void;
}

type SettingsTab = 'general' | 'appearance' | 'background' | 'data' | 'ai';

export const SettingsModal = ({ isOpen, onClose, onPreviewBirthday }: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { 
    showSeconds, toggleShowSeconds,
    showBookmarksOnStartup, toggleShowBookmarksOnStartup,
    bookmarkIconSize, setBookmarkIconSize,
    navBarConfig, setNavBarConfig,
    birthday, setBirthday,
    searchEngine, setSearchEngine,
    backgroundType, setBackgroundType,
    backgroundImageSource,
    applyLocalImage, applyVideo,
    exportLayout, importLayout,
    setBackgroundImage,
    aiConfig, setAiConfig
  } = useStore();

  const { addToast } = useToastStore();

  const [bgUrlInput, setBgUrlInput] = useState('');
  const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
  const [localVideoPreview, setLocalVideoPreview] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState('');
  const [importCode, setImportCode] = useState('');

  useEffect(() => {
    if (isOpen) {
      getImageFromDB().then(url => {
        if (url) setLocalImagePreview(url);
      });
      getVideoFromDB().then(url => {
        if (url) setLocalVideoPreview(url);
      });
    }
  }, [isOpen]);

  // Group settings for search
  const settingsGroups = useMemo(() => {
    return [
      {
        id: 'general',
        icon: <Zap size={18} />,
        label: '常规',
        items: [
          { id: 'search-engine', label: '搜索引擎', keywords: ['google', 'bing', 'baidu', 'search'] },
          { id: 'startup', label: '启动设置', keywords: ['startup', 'bookmark', 'open'] },
          { id: 'birthday', label: '生日设置', keywords: ['birthday', 'date', 'party'] },
        ]
      },
      {
        id: 'appearance',
        icon: <Palette size={18} />,
        label: '外观',
        items: [
          { id: 'navbar', label: '菜单栏', keywords: ['menu', 'nav', 'bar', 'style', 'position'] },
          { id: 'clock', label: '时钟显示', keywords: ['clock', 'seconds', 'time'] },
          { id: 'bookmark-size', label: '书签图标', keywords: ['icon', 'size', 'bookmark'] },
        ]
      },
      {
        id: 'background',
        icon: <ImageIcon size={18} />,
        label: '背景',
        items: [
          { id: 'bg-type', label: '背景类型', keywords: ['image', 'video', 'wallpaper'] },
          { id: 'bg-upload', label: '上传背景', keywords: ['upload', 'local'] },
        ]
      },
      {
        id: 'data',
        icon: <Share2 size={18} />,
        label: '数据与备份',
        items: [
          { id: 'export', label: '导出布局', keywords: ['export', 'share', 'backup'] },
          { id: 'import', label: '导入布局', keywords: ['import', 'restore'] },
        ]
      },
      {
        id: 'ai',
        icon: <Bot size={18} />,
        label: 'AI 设置',
        items: [
          { id: 'api-endpoint', label: 'API 端点', keywords: ['api', 'endpoint', 'url', 'deepseek'] },
          { id: 'api-key', label: 'API 密钥', keywords: ['key', 'token', 'auth'] },
        ]
      }
    ];
  }, []);

  // Filter tabs based on search
  const filteredTabs = useMemo(() => {
    if (!searchQuery) return settingsGroups;
    return settingsGroups.filter(group => 
      group.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.items.some(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    );
  }, [searchQuery, settingsGroups]);

  // Handle file uploads
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        addToast({ type: 'error', message: '图片过大 (最大 10MB)' });
        return;
      }
      try {
        addToast({ type: 'info', message: '正在上传图片...' });
        const url = await saveImageToDB(file);
        setLocalImagePreview(url);
        applyLocalImage();
        addToast({ type: 'success', message: '图片上传成功' });
      } catch (error) {
        addToast({ type: 'error', message: '上传失败' });
      }
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        addToast({ type: 'error', message: '视频过大 (最大 50MB)' });
        return;
      }
      try {
        addToast({ type: 'info', message: '正在上传视频...' });
        const url = await saveVideoToDB(file);
        setLocalVideoPreview(url);
        applyVideo();
        addToast({ type: 'success', message: '视频上传成功' });
      } catch (error) {
        addToast({ type: 'error', message: '上传失败' });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-2xl w-[800px] h-[600px] shadow-2xl flex overflow-hidden animate-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className="w-64 bg-zinc-900/50 border-r border-zinc-800 flex flex-col">
          <div className="p-6 pb-4">
            <h2 className="text-xl font-bold text-white mb-1">设置</h2>
            <p className="text-xs text-zinc-500">个性化您的新标签页</p>
          </div>

          <div className="px-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
              <input
                type="text"
                placeholder="搜索设置..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-800 text-white pl-9 pr-3 py-2 rounded-lg text-sm border border-zinc-700 focus:border-blue-500 focus:outline-none transition-colors placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
            {filteredTabs.map(group => (
              <button
                key={group.id}
                onClick={() => setActiveTab(group.id as SettingsTab)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  activeTab === group.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                {group.icon}
                <span className="font-medium">{group.label}</span>
                {activeTab === group.id && <ChevronRight className="ml-auto opacity-50" size={14} />}
              </button>
            ))}
          </div>
          
          <div className="p-4 border-t border-zinc-800">
            <div className="text-xs text-center text-zinc-600">
              Zen New Tab v1.0.0
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-zinc-900 flex flex-col min-w-0">
          {/* Header */}
          <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
            <h3 className="text-lg font-medium text-white">
              {settingsGroups.find(g => g.id === activeTab)?.label}
            </h3>
            <button 
              onClick={onClose}
              className="p-2 rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-2xl mx-auto space-y-8">
              
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 fade-in">
                  <section>
                    <h4 className="text-sm font-medium text-blue-400 mb-4 uppercase tracking-wider">搜索引擎</h4>
                    <div className="bg-zinc-800/50 rounded-xl p-1 flex gap-1">
                      {['google', 'bing', 'baidu'].map((engine) => (
                        <button
                          key={engine}
                          onClick={() => setSearchEngine(engine as any)}
                          className={`flex-1 py-2.5 rounded-lg text-sm capitalize transition-all duration-200 ${
                            searchEngine === engine 
                              ? 'bg-zinc-700 text-white shadow-sm ring-1 ring-white/10' 
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                          }`}
                        >
                          {engine}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-medium text-blue-400 mb-4 uppercase tracking-wider">启动行为</h4>
                    <div className="bg-zinc-800/30 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <div className="text-white text-sm font-medium">启动时显示书签栏</div>
                          <div className="text-zinc-500 text-xs mt-0.5">每次打开新标签页时自动展开书签视图</div>
                        </div>
                        <button 
                          onClick={toggleShowBookmarksOnStartup}
                          className={`w-11 h-6 rounded-full transition-colors relative ${showBookmarksOnStartup ? 'bg-blue-600' : 'bg-zinc-700'}`}
                        >
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${showBookmarksOnStartup ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>
                  </section>
                  
                  <section>
                    <h4 className="text-sm font-medium text-blue-400 mb-4 uppercase tracking-wider">生日设置</h4>
                    <div className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white text-sm font-medium">我的生日</div>
                          <div className="text-zinc-500 text-xs mt-0.5">
                              {birthday && birthday !== 'skip' ? `当前设置: ${birthday} (每年自动为您庆祝)` : '尚未设置生日'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {birthday && birthday !== 'skip' && onPreviewBirthday && (
                            <button 
                              onClick={() => { onClose(); setTimeout(onPreviewBirthday, 100); }}
                              className="px-3 py-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 text-xs rounded-lg transition-colors border border-pink-500/20"
                            >
                              预览祝福
                            </button>
                          )}
                          {birthday && birthday !== 'skip' ? (
                            <button 
                              onClick={() => { setBirthday('skip'); addToast({ type: 'success', message: '生日已重置' }); }}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors border border-red-500/20"
                            >
                              重置
                            </button>
                          ) : (
                            <button 
                              onClick={() => { setBirthday(null); onClose(); }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors"
                            >
                              去设置
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 fade-in">
                   <section>
                    <h4 className="text-sm font-medium text-blue-400 mb-4 uppercase tracking-wider">菜单栏设置</h4>
                    <div className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-4 space-y-4">
                      {/* Position */}
                      <div>
                          <div className="text-white text-sm font-medium mb-2">位置布局</div>
                          <div className="flex gap-2 bg-zinc-800 p-1 rounded-lg">
                              {['top', 'bottom', 'floating'].map((pos) => (
                                  <button
                                      key={pos}
                                      onClick={() => setNavBarConfig({ position: pos as any })}
                                      className={`flex-1 py-1.5 rounded-md text-xs transition-all ${
                                          navBarConfig.position === pos 
                                              ? 'bg-blue-600 text-white shadow-sm' 
                                              : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                                      }`}
                                  >
                                      {{ top: '顶部固定', bottom: '底部固定', floating: '悬浮拖拽' }[pos]}
                                  </button>
                              ))}
                          </div>
                      </div>
                      
                      {/* Style */}
                      <div>
                          <div className="text-white text-sm font-medium mb-2">视觉风格</div>
                          <div className="flex gap-2 bg-zinc-800 p-1 rounded-lg">
                              {['glass', 'solid', 'transparent'].map((style) => (
                                  <button
                                      key={style}
                                      onClick={() => setNavBarConfig({ style: style as any })}
                                      className={`flex-1 py-1.5 rounded-md text-xs transition-all ${
                                          navBarConfig.style === style 
                                              ? 'bg-blue-600 text-white shadow-sm' 
                                              : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
                                      }`}
                                  >
                                      {{ glass: '磨砂玻璃', solid: '纯色背景', transparent: '完全透明' }[style]}
                                  </button>
                              ))}
                          </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-medium text-blue-400 mb-4 uppercase tracking-wider">时钟组件</h4>
                    <div className="bg-zinc-800/30 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <div className="text-white text-sm font-medium">显示秒数</div>
                          <div className="text-zinc-500 text-xs mt-0.5">在主时钟上显示秒针跳动</div>
                        </div>
                        <button 
                          onClick={toggleShowSeconds}
                          className={`w-11 h-6 rounded-full transition-colors relative ${showSeconds ? 'bg-blue-600' : 'bg-zinc-700'}`}
                        >
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${showSeconds ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-medium text-blue-400 mb-4 uppercase tracking-wider">书签显示</h4>
                    <div className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-4">
                      <div className="text-white text-sm font-medium mb-3">图标尺寸</div>
                      <div className="grid grid-cols-3 gap-3">
                        {['small', 'medium', 'large'].map((size) => (
                          <button
                            key={size}
                            onClick={() => setBookmarkIconSize(size as any)}
                            className={`py-3 px-4 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2 ${
                              bookmarkIconSize === size 
                                ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' 
                                : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-600'
                            }`}
                          >
                            <div className={`rounded-md bg-current opacity-20 ${
                              size === 'small' ? 'w-4 h-4' : size === 'medium' ? 'w-6 h-6' : 'w-8 h-8'
                            }`} />
                            <span className="text-xs font-medium">
                              {{ small: '紧凑', medium: '标准', large: '宽敞' }[size]}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {/* Background Tab */}
              {activeTab === 'background' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 fade-in">
                  <section>
                    <h4 className="text-sm font-medium text-blue-400 mb-4 uppercase tracking-wider">背景模式</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => { clearVideoFromDB(); setBackgroundType('image'); }}
                        className={`p-4 rounded-xl border transition-all text-left group ${
                          backgroundType === 'image'
                            ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/20'
                            : 'bg-zinc-800/30 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <ImageIcon className={`mb-3 ${backgroundType === 'image' ? 'text-blue-400' : 'text-zinc-400'}`} />
                        <div className={`font-medium mb-1 ${backgroundType === 'image' ? 'text-blue-100' : 'text-zinc-200'}`}>静态图片</div>
                        <div className="text-xs text-zinc-500">支持 JPG, PNG, WebP</div>
                      </button>
                      <button
                        onClick={() => setBackgroundType('video')}
                        className={`p-4 rounded-xl border transition-all text-left group ${
                          backgroundType === 'video'
                            ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/20'
                            : 'bg-zinc-800/30 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <Video className={`mb-3 ${backgroundType === 'video' ? 'text-blue-400' : 'text-zinc-400'}`} />
                        <div className={`font-medium mb-1 ${backgroundType === 'video' ? 'text-blue-100' : 'text-zinc-200'}`}>动态视频</div>
                        <div className="text-xs text-zinc-500">支持 MP4, WebM (Max 50MB)</div>
                      </button>
                    </div>
                  </section>

                  {backgroundType === 'image' ? (
                    <section className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-5">
                       <h4 className="text-sm font-medium text-white mb-4">自定义图片</h4>
                       
                       {/* URL Input */}
                       <form onSubmit={(e) => {
                          e.preventDefault();
                          if (bgUrlInput) {
                            setBackgroundImage(bgUrlInput);
                            setBgUrlInput('');
                            addToast({ type: 'success', message: '网络图片已应用' });
                          }
                       }} className="flex gap-2 mb-6">
                          <div className="relative flex-1">
                            <Link className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                            <input
                              type="text"
                              placeholder="输入图片链接 (https://...)"
                              value={bgUrlInput}
                              onChange={(e) => setBgUrlInput(e.target.value)}
                              className="w-full bg-zinc-900 text-white pl-9 pr-3 py-2.5 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm"
                            />
                          </div>
                          <button type="submit" className="px-4 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm font-medium transition-colors">
                            应用
                          </button>
                       </form>

                       {/* Local Upload */}
                       <div className="border-t border-zinc-700/50 pt-6">
                          <div className="flex items-start gap-4">
                            <div className="w-32 h-20 bg-zinc-900 rounded-lg border border-zinc-700 flex items-center justify-center overflow-hidden relative group">
                               {localImagePreview ? (
                                 <>
                                  <img src={localImagePreview} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                  {backgroundImageSource === 'local' && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <span className="text-xs text-white font-medium bg-blue-600/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-lg border border-blue-400/30">
                                        使用中
                                      </span>
                                    </div>
                                  )}
                                 </>
                               ) : (
                                 <ImageIcon className="text-zinc-600" />
                               )}
                            </div>
                            <div className="flex-1">
                               <div className="text-sm text-zinc-300 mb-2">本地上传</div>
                               <div className="flex gap-2">
                                  <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-2">
                                    <UploadCloud size={14} />
                                    选择文件
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                  </label>
                                  {localImagePreview && backgroundImageSource !== 'local' && (
                                    <button 
                                      onClick={() => { applyLocalImage(); addToast({ type: 'success', message: '已切换至本地图片' }); }}
                                      className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-medium rounded-lg transition-colors"
                                    >
                                      使用当前
                                    </button>
                                  )}
                               </div>
                               <p className="text-xs text-zinc-500 mt-2">支持拖拽上传，最大 10MB</p>
                            </div>
                          </div>
                       </div>
                    </section>
                  ) : (
                    <section className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-5">
                       <h4 className="text-sm font-medium text-white mb-4">自定义视频</h4>
                       <div className="flex items-start gap-4">
                          <div className="w-32 h-20 bg-zinc-900 rounded-lg border border-zinc-700 flex items-center justify-center overflow-hidden relative">
                              {localVideoPreview ? (
                                <video src={localVideoPreview} className="w-full h-full object-cover opacity-60" />
                              ) : (
                                <Video className="text-zinc-600" />
                              )}
                          </div>
                          <div className="flex-1">
                              <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-2">
                                <UploadCloud size={14} />
                                上传视频文件
                                <input type="file" accept="video/mp4,video/webm" onChange={handleVideoUpload} className="hidden" />
                              </label>
                              <p className="text-xs text-zinc-500 mt-2">建议使用静音的循环视频，最大 50MB</p>
                          </div>
                       </div>
                    </section>
                  )}
                </div>
              )}

              {/* Data Tab */}
              {activeTab === 'data' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 fade-in">
                  <section className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-xl">
                        <Share2 className="text-blue-400" size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-medium text-white mb-1">导出布局配置</h4>
                        <p className="text-sm text-zinc-400 mb-4">生成包含当前布局、书签和设置的分享码，可用于备份或分享给他人。</p>
                        
                        <div className="space-y-3">
                          <button
                            onClick={() => {
                              const code = exportLayout();
                              setShareCode(code);
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors font-medium inline-flex items-center gap-2"
                          >
                            <Download size={16} />
                            生成分享码
                          </button>
                          
                          {shareCode && (
                            <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-700 animate-in fade-in slide-in-from-top-2">
                              <p className="text-xs text-zinc-300 break-all font-mono leading-relaxed select-all mb-2 max-h-24 overflow-y-auto custom-scrollbar">{shareCode}</p>
                              <button
                                onClick={() => {
                                  const shareText = `【静谧新标签页】布局分享\n\n我正在使用「静谧新标签页」，这是我的布局配置，复制下方代码即可导入：\n\n${shareCode}\n\n下载扩展：https://github.com/tlkppm/zen-newtab`;
                                  navigator.clipboard.writeText(shareText);
                                  addToast({ type: 'success', message: '完整内容已复制到剪贴板' });
                                }}
                                className="w-full py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white text-xs rounded transition-colors"
                              >
                                复制完整内容
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-purple-500/10 rounded-xl">
                        <Upload className="text-purple-400" size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-medium text-white mb-1">导入配置</h4>
                        <p className="text-sm text-zinc-400 mb-4">粘贴以 "ZEN://" 开头的分享码以恢复布局。</p>
                        
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={importCode}
                            onChange={(e) => setImportCode(e.target.value)}
                            placeholder="在此粘贴分享码..."
                            className="flex-1 bg-zinc-900 text-white px-3 py-2 rounded-lg border border-zinc-700 focus:border-purple-500 focus:outline-none text-sm font-mono"
                          />
                          <button
                            onClick={() => {
                              if (importLayout(importCode)) {
                                addToast({ type: 'success', message: '布局导入成功' });
                                setImportCode('');
                                setShareCode('');
                              } else {
                                addToast({ type: 'error', message: '无效的分享码' });
                              }
                            }}
                            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg transition-colors font-medium"
                          >
                            应用
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {/* AI Tab */}
              {activeTab === 'ai' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 fade-in">
                  <section className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-xl">
                        <Bot className="text-blue-400" size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-medium text-white mb-1">AI API 配置</h4>
                        <p className="text-sm text-zinc-400 mb-4">配置自定义 API 端点和密钥，使用您自己的 AI 服务。</p>
                        
                        <div className="space-y-4">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={aiConfig.useCustomApi}
                              onChange={(e) => setAiConfig({ useCustomApi: e.target.checked })}
                              className="w-4 h-4 rounded bg-zinc-700 border-zinc-600 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-sm text-zinc-300">使用自定义 API</span>
                          </label>

                          <div className={`space-y-4 ${!aiConfig.useCustomApi ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div>
                              <label className="block text-xs text-zinc-400 mb-2">
                                <Globe size={12} className="inline mr-1" />
                                API 端点
                              </label>
                              <input
                                type="text"
                                value={aiConfig.apiEndpoint}
                                onChange={(e) => setAiConfig({ apiEndpoint: e.target.value })}
                                placeholder="https://api.example.com/v1/chat"
                                className="w-full bg-zinc-900 text-white px-3 py-2 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-zinc-400 mb-2">
                                <Key size={12} className="inline mr-1" />
                                API 密钥
                              </label>
                              <input
                                type="password"
                                value={aiConfig.apiKey}
                                onChange={(e) => setAiConfig({ apiKey: e.target.value })}
                                placeholder="sk-..."
                                className="w-full bg-zinc-900 text-white px-3 py-2 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs text-zinc-400 mb-2">模型名称</label>
                                <input
                                  type="text"
                                  value={aiConfig.model || 'deepseek-chat'}
                                  onChange={(e) => setAiConfig({ model: e.target.value })}
                                  placeholder="deepseek-chat"
                                  className="w-full bg-zinc-900 text-white px-3 py-2 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-zinc-400 mb-2">最大 Token</label>
                                <input
                                  type="number"
                                  value={aiConfig.maxTokens || 2000}
                                  onChange={(e) => setAiConfig({ maxTokens: parseInt(e.target.value) || 2000 })}
                                  className="w-full bg-zinc-900 text-white px-3 py-2 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm"
                                />
                              </div>
                            </div>

                            <div>
                                <label className="block text-xs text-zinc-400 mb-2">温度 (Temperature): {aiConfig.temperature || 0.7}</label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="2" 
                                    step="0.1"
                                    value={aiConfig.temperature || 0.7}
                                    onChange={(e) => setAiConfig({ temperature: parseFloat(e.target.value) })}
                                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                                    <span>精确 (0.0)</span>
                                    <span>平衡 (0.7)</span>
                                    <span>创造性 (2.0)</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-zinc-400 mb-2">系统预设提示词</label>
                                <textarea 
                                    value={aiConfig.systemPrompt || ''}
                                    onChange={(e) => setAiConfig({ systemPrompt: e.target.value })}
                                    placeholder="例如：你是一个专业的程序员助手..."
                                    className="w-full bg-zinc-900 text-white px-3 py-2 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm min-h-[100px] resize-none"
                                />
                            </div>
                          </div>

                          <p className="text-xs text-zinc-500">
                            {aiConfig.useCustomApi 
                              ? '使用自定义 API 时，请确保端点兼容 OpenAI 格式或 DeepSeek 格式。' 
                              : '当前使用默认的免费 DeepSeek API 服务。'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};