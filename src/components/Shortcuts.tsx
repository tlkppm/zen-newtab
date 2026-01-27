import { useStore } from '../store/useStore';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

export const Shortcuts = () => {
  const { shortcuts, addShortcut, removeShortcut } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle && newUrl) {
      let formattedUrl = newUrl;
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      addShortcut({
        id: Date.now().toString(),
        title: newTitle,
        url: formattedUrl,
      });
      setIsAdding(false);
      setNewTitle('');
      setNewUrl('');
    }
  };

  return (
    <div className="mt-12 w-full max-w-4xl px-4">
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
        {shortcuts.map((shortcut) => (
          <div key={shortcut.id} className="group relative flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
            <a href={shortcut.url} className="flex flex-col items-center w-full h-full">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-xl font-medium shadow-md group-hover:bg-white/30 transition-all">
                {/* Try to use favicon, fallback to first letter */}
                <img 
                    src={`https://www.google.com/s2/favicons?sz=64&domain_url=${shortcut.url}`} 
                    alt={shortcut.title} 
                    className="w-8 h-8 rounded-sm"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
              </div>
              <span className="text-white text-xs mt-2 truncate max-w-full opacity-90 group-hover:opacity-100">{shortcut.title}</span>
            </a>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    removeShortcut(shortcut.id);
                }}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                title="删除"
            >
                <X size={12} />
            </button>
          </div>
        ))}

        {/* Add Button */}
        <div className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setIsAdding(true)}>
          <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white/70 shadow-sm border border-white/20 group-hover:bg-white/20 transition-all">
            <Plus size={24} />
          </div>
          <span className="text-white/70 text-xs mt-2">添加</span>
        </div>
      </div>

      {/* Add Modal */}
      {isAdding && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm" onClick={() => setIsAdding(false)}>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-white text-lg font-medium mb-4">添加快捷方式</h3>
                <form onSubmit={handleAdd} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="名称 (例如 YouTube)"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        className="bg-zinc-800 text-white px-4 py-2 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none"
                        autoFocus
                    />
                    <input
                        type="text"
                        placeholder="链接 (例如 youtube.com)"
                        value={newUrl}
                        onChange={e => setNewUrl(e.target.value)}
                        className="bg-zinc-800 text-white px-4 py-2 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors">取消</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">添加</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
