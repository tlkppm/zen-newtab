import { useState, useEffect } from 'react';
import { X, Download, Sparkles, ExternalLink } from 'lucide-react';

interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
  releaseNotes: string;
  publishedAt: string;
  error?: string;
}

export const UpdateNotification = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const checkUpdate = async () => {
      const dismissedVersion = localStorage.getItem('zen-dismissed-update');
      const currentVersion = '1.0.8';
      
      try {
        setChecking(true);
        const res = await fetch('https://api.github.com/repos/tlkppm/zen-newtab/releases/latest');
        const data = await res.json();
        const latestVersion = data.tag_name?.replace('v', '') || currentVersion;
        
        const parts1 = latestVersion.split('.').map(Number);
        const parts2 = currentVersion.split('.').map(Number);
        let hasUpdate = false;
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
          const p1 = parts1[i] || 0;
          const p2 = parts2[i] || 0;
          if (p1 > p2) { hasUpdate = true; break; }
          if (p1 < p2) break;
        }
        
        setChecking(false);
        if (hasUpdate) {
          if (dismissedVersion === latestVersion) return;
          setUpdateInfo({
            hasUpdate: true,
            currentVersion,
            latestVersion,
            releaseUrl: data.html_url || '',
            releaseNotes: data.body || '',
            publishedAt: data.published_at || ''
          });
        }
      } catch (err) {
        setChecking(false);
      }
    };

    const timer = setTimeout(checkUpdate, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    if (updateInfo) {
      localStorage.setItem('zen-dismissed-update', updateInfo.latestVersion);
    }
    setDismissed(true);
  };

  const handleUpdate = () => {
    if (updateInfo?.releaseUrl) {
      window.open(updateInfo.releaseUrl, '_blank');
    }
  };

  if (dismissed || !updateInfo?.hasUpdate) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-5 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-white font-medium text-sm">发现新版本</h3>
              <button
                onClick={handleDismiss}
                className="text-zinc-500 hover:text-white transition-colors p-1 -mr-1"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-zinc-400 text-xs mt-1">
              v{updateInfo.currentVersion} → v{updateInfo.latestVersion}
            </p>
            {updateInfo.releaseNotes && (
              <p className="text-zinc-500 text-xs mt-2 line-clamp-2">
                {updateInfo.releaseNotes.split('\n')[0]?.replace(/^#+\s*/, '')}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleDismiss}
            className="flex-1 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            稍后提醒
          </button>
          <button
            onClick={handleUpdate}
            className="flex-1 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Download size={14} />
            查看更新
          </button>
        </div>
      </div>
    </div>
  );
};
