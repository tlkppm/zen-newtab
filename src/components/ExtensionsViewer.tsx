import { useState, useEffect } from 'react';
import { Puzzle, Trash2, Power, PowerOff, ExternalLink } from 'lucide-react';

interface ExtensionInfo {
  id: string;
  name: string;
  shortName: string;
  description: string;
  version: string;
  enabled: boolean;
  icons?: { size: number; url: string }[];
  installType: string;
  homepageUrl?: string;
  type: string; // 'extension' | 'hosted_app' | 'packaged_app' | 'legacy_packaged_app' | 'theme'
}

export const ExtensionsViewer = () => {
  const [extensions, setExtensions] = useState<ExtensionInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExtensions();
  }, []);

  const loadExtensions = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'GET_EXTENSIONS' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[ExtensionsViewer] Message error:', chrome.runtime.lastError);
          useMockData();
          return;
        }
        
        if (response?.error) {
          console.error('[ExtensionsViewer] Response error:', response.error);
          useMockData();
          return;
        }
        
        const result = response?.extensions || [];
        
        // Get our own ID to filter ourselves out
        chrome.runtime.sendMessage({ type: 'GET_SELF_ID' }, (selfResponse) => {
          const myId = selfResponse?.id;
          const filtered = result.filter((ext: ExtensionInfo) => ext.id !== myId);
          
          // Sort by enabled status then name
          const sorted = filtered.sort((a: ExtensionInfo, b: ExtensionInfo) => {
              if (a.enabled === b.enabled) {
                  return a.name.localeCompare(b.name);
              }
              return a.enabled ? -1 : 1;
          });
          
          setExtensions(sorted);
          setLoading(false);
        });
      });
    } else {
      useMockData();
    }
  };
  
  const useMockData = () => {
    setTimeout(() => {
        setExtensions([
            { id: '1', name: 'React Developer Tools', shortName: 'React DevTools', description: 'Adds React debugging tools to the Chrome Developer Tools.', version: '4.28.0', enabled: true, installType: 'normal', type: 'extension', icons: [{size: 48, url: ''}] },
            { id: '2', name: 'uBlock Origin', shortName: 'uBlock', description: 'Finally, an efficient blocker. Easy on CPU and memory.', version: '1.50.0', enabled: true, installType: 'normal', type: 'extension' },
            { id: '3', name: 'Tampermonkey', shortName: 'Tampermonkey', description: 'The world\'s most popular userscript manager', version: '4.19.0', enabled: false, installType: 'normal', type: 'extension' },
        ]);
        setLoading(false);
    }, 500);
  };

  const toggleEnable = (id: string, currentStatus: boolean) => {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
          chrome.runtime.sendMessage({ type: 'SET_EXTENSION_ENABLED', id, enabled: !currentStatus }, () => {
              setExtensions(prev => prev.map(ext => 
                  ext.id === id ? { ...ext, enabled: !currentStatus } : ext
              ));
          });
      }
  };

  const uninstall = (ext: ExtensionInfo) => {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
          const extName = ext.name;
          
          chrome.runtime.sendMessage({ type: 'UNINSTALL_EXTENSION', id: ext.id }, () => {
              // Reload list after dialog closes
              setTimeout(() => {
                  loadExtensions();
              }, 500);
          });
      }
  };

  const getIcon = (ext: ExtensionInfo) => {
      if (ext.icons && ext.icons.length > 0) {
          // Get the largest icon
          const icon = ext.icons[ext.icons.length - 1].url;
          return icon;
      }
      return null;
  };

  return (
    <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-white/80">
                <Puzzle size={24} />
                <h2 className="text-xl font-medium">已安装的扩展程序 ({extensions.length})</h2>
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            {loading ? (
                <div className="flex items-center justify-center h-40 text-zinc-500">加载中...</div>
            ) : extensions.length === 0 ? (
                <div className="text-center text-zinc-500 py-10">未检测到其他扩展程序</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {extensions.map(ext => {
                        const iconUrl = getIcon(ext);
                        return (
                            <div key={ext.id} className={`group bg-zinc-800/40 border border-white/5 rounded-xl p-4 flex flex-col gap-3 transition-all hover:bg-zinc-800/60 ${!ext.enabled ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        {iconUrl ? (
                                            <img src={iconUrl} alt={ext.name} className="w-8 h-8 object-contain" />
                                        ) : (
                                            <Puzzle size={20} className="text-zinc-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white text-sm font-medium truncate" title={ext.name}>{ext.name}</h3>
                                        <p className="text-zinc-400 text-xs truncate" title={ext.description}>{ext.description || '无描述'}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] bg-white/5 text-zinc-500 px-1.5 py-0.5 rounded">{ext.version}</span>
                                            {ext.type === 'theme' && <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">主题</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-auto">
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => toggleEnable(ext.id, ext.enabled)}
                                            className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium ${ext.enabled ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700'}`}
                                            title={ext.enabled ? "点击禁用" : "点击启用"}
                                        >
                                            {ext.enabled ? <Power size={12} /> : <PowerOff size={12} />}
                                            {ext.enabled ? '已启用' : '已禁用'}
                                        </button>
                                    </div>
                                    
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => uninstall(ext)}
                                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                            title="卸载"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
  );
};
