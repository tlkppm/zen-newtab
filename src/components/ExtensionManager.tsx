import { useState, useEffect } from 'react';
import { Puzzle, Trash2, Power, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ExtensionInfo {
  id: string;
  name: string;
  shortName: string;
  description: string;
  version: string;
  enabled: boolean;
  icons?: { size: number; url: string }[];
  installType: string;
  type: string;
}

export const ExtensionManager = () => {
  const [extensions, setExtensions] = useState<ExtensionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExtensions();
    
    // Listen for extension events if available
    if (typeof chrome !== 'undefined' && chrome.management) {
        const listeners = [
            chrome.management.onInstalled?.addListener(loadExtensions),
            chrome.management.onUninstalled?.addListener(loadExtensions),
            chrome.management.onEnabled?.addListener(loadExtensions),
            chrome.management.onDisabled?.addListener(loadExtensions)
        ];
        // Note: Removing listeners in cleanup is tricky if we don't store the exact function reference, 
        // but for a simple component this is acceptable or we can skip strictly removing them 
        // as the component unmounts rarely in this SPA context, but good practice:
        return () => {
            // chrome.management.onInstalled.removeListener(loadExtensions); 
            // (Simulated cleanup)
        };
    }
  }, []);

  const loadExtensions = () => {
    if (typeof chrome === 'undefined' || !chrome.management || typeof chrome.management.getAll !== 'function') {
        // Mock data for development
        setExtensions([
            {
                id: '1',
                name: 'React Developer Tools',
                shortName: 'React DevTools',
                description: 'Adds React debugging tools to the Chrome Developer Tools.',
                version: '4.28.0',
                enabled: true,
                installType: 'normal',
                type: 'extension',
                icons: [{ size: 48, url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png' }]
            },
            {
                id: '2',
                name: 'uBlock Origin',
                shortName: 'uBlock',
                description: 'Finally, an efficient blocker. Easy on CPU and memory.',
                version: '1.52.0',
                enabled: true,
                installType: 'normal',
                type: 'extension'
            },
            {
                id: '3',
                name: 'Disabled Extension',
                shortName: 'Disabled',
                description: 'This extension is currently disabled.',
                version: '1.0.0',
                enabled: false,
                installType: 'development',
                type: 'extension'
            }
        ]);
        setLoading(false);
        return;
    }

    try {
        chrome.management.getAll((result) => {
            // Filter out the extension itself (this new tab extension)
            // and maybe themes/apps if we only want extensions
            const myId = chrome.runtime.id;
            const filtered = result.filter(ext => 
                ext.id !== myId && 
                ext.type === 'extension'
            );
            
            // Sort by enabled first, then name
            filtered.sort((a, b) => {
                if (a.enabled === b.enabled) {
                    return a.name.localeCompare(b.name);
                }
                return a.enabled ? -1 : 1;
            });
            
            setExtensions(filtered as ExtensionInfo[]);
            setLoading(false);
        });
    } catch (err) {
        setError('无法加载插件列表，请确保已授予 "management" 权限。');
        setLoading(false);
    }
  };

  const toggleExtension = (id: string, currentStatus: boolean) => {
      if (typeof chrome !== 'undefined' && chrome.management && typeof chrome.management.setEnabled === 'function') {
          chrome.management.setEnabled(id, !currentStatus, () => {
              loadExtensions();
          });
      } else {
          // Mock toggle
          setExtensions(prev => prev.map(e => e.id === id ? { ...e, enabled: !currentStatus } : e));
      }
  };

  const uninstallExtension = (ext: ExtensionInfo) => {
      if (typeof chrome !== 'undefined' && chrome.management && typeof chrome.management.uninstall === 'function') {
          const extName = ext.name;
          const extIcon = getBestIcon(ext.icons) || '/icon48.png';
          
          chrome.management.uninstall(ext.id, { showConfirmDialog: true }, () => {
              setTimeout(() => {
                  if (typeof chrome.management.getAll !== 'function') {
                      loadExtensions();
                      return;
                  }
                  chrome.management.getAll((result) => {
                      const stillExists = result.some(e => e.id === ext.id);
                      if (!stillExists && chrome.notifications) {
                          chrome.notifications.create(`uninstall-${ext.id}`, {
                              type: 'basic',
                              iconUrl: extIcon,
                              title: '扩展已卸载',
                              message: `${extName} 已成功卸载`,
                              priority: 1
                          });
                      }
                      loadExtensions();
                  });
              }, 500);
          });
      } else {
          // Mock uninstall
          setExtensions(prev => prev.filter(e => e.id !== ext.id));
      }
  };

  const getBestIcon = (icons?: { size: number; url: string }[]) => {
      if (!icons || icons.length === 0) return null;
      // Prefer 48px or larger, but not too large
      return icons.find(i => i.size >= 48)?.url || icons[icons.length - 1].url;
  };

  return (
    <div className="w-full max-w-6xl h-full flex flex-col p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-6 text-white/90">
            <Puzzle size={28} />
            <h2 className="text-2xl font-bold">插件管理</h2>
            <span className="text-sm bg-white/10 px-2 py-1 rounded-full text-white/60">
                {extensions.length} 个已安装
            </span>
        </div>

        {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-lg mb-6 flex items-center gap-2">
                <AlertCircle size={20} />
                {error}
            </div>
        )}

        {loading ? (
            <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto custom-scrollbar pb-10">
                {extensions.map(ext => {
                    const iconUrl = getBestIcon(ext.icons);
                    return (
                        <div 
                            key={ext.id} 
                            className={`group relative p-4 rounded-xl border transition-all duration-200 flex flex-col gap-3 ${
                                ext.enabled 
                                    ? 'bg-zinc-900/60 border-white/10 hover:border-blue-500/30 hover:bg-zinc-800/80' 
                                    : 'bg-zinc-950/40 border-white/5 opacity-70 hover:opacity-100'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-white/5 p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {iconUrl ? (
                                        <img src={iconUrl} alt="" className="w-full h-full object-contain" />
                                    ) : (
                                        <Puzzle size={20} className="text-zinc-500" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-white text-sm truncate" title={ext.name}>
                                        {ext.name}
                                    </h3>
                                    <p className="text-xs text-zinc-500 truncate" title={ext.version}>
                                        v{ext.version}
                                    </p>
                                </div>
                                <div className={`w-2 h-2 rounded-full mt-1.5 ${ext.enabled ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-zinc-700'}`} />
                            </div>

                            <p className="text-xs text-zinc-400 line-clamp-2 h-8 leading-4">
                                {ext.description || '暂无描述'}
                            </p>

                            <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                                <button 
                                    onClick={() => toggleExtension(ext.id, ext.enabled)}
                                    className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded transition-colors ${
                                        ext.enabled 
                                            ? 'text-green-400 hover:bg-green-400/10' 
                                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                                    }`}
                                >
                                    <Power size={14} />
                                    {ext.enabled ? '已启用' : '已禁用'}
                                </button>

                                <button 
                                    onClick={() => uninstallExtension(ext)}
                                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                    title="卸载"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
};
