import { useState, useEffect } from 'react';
import { useStore, Tile } from '../store/useStore';
import * as Icons from 'lucide-react';
import { X, Plus } from 'lucide-react';
import { getTileImage } from '../lib/db';

const getIcon = (iconName: string) => {
  // @ts-ignore
  const Icon = Icons[iconName] || Icons.Link;
  return <Icon size={28} className="mb-2" />;
};

export const Tiles = () => {
  const { tiles } = useStore();

  return (
    <div className="w-full h-full p-2 overflow-y-auto custom-scrollbar">
      <div className="grid grid-cols-2 gap-2 h-full content-start">
        {tiles.map((tile) => (
          <a
            key={tile.id}
            href={tile.url}
            className={`${tile.color} p-4 rounded-lg text-white flex flex-col items-start justify-end transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:brightness-110 active:scale-95 group relative overflow-hidden aspect-square`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 opacity-90 group-hover:opacity-100 transition-opacity">
              {getIcon(tile.icon)}
            </div>
            <span className="text-sm font-medium relative z-10 truncate w-full">
              {tile.title}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

export const SingleTile = ({ tile, isEditing }: { tile: Tile; isEditing: boolean }) => {
  const { removeTile } = useStore();
  const [bgUrl, setBgUrl] = useState<string | null>(null);

  useEffect(() => {
    if (tile.bgType === 'image' && tile.bgImage) {
      getTileImage(tile.bgImage).then((url) => {
        if (url) setBgUrl(url);
      });
    }
    return () => {
      if (bgUrl) URL.revokeObjectURL(bgUrl);
    };
  }, [tile.bgImage, tile.bgType]);

  const bgStyle = tile.bgType === 'image' && bgUrl ? {
    backgroundImage: `url(${bgUrl})`,
    backgroundSize: tile.bgSlice ? `${tile.bgSlice.zoomX}% ${tile.bgSlice.zoomY}%` : 'cover',
    backgroundPosition: tile.bgSlice ? `${tile.bgSlice.x}% ${tile.bgSlice.y}%` : 'center'
  } : {};

  return (
    <a
      href={isEditing ? undefined : tile.url}
      onClick={isEditing ? (e) => e.preventDefault() : undefined}
      className={`${tile.color} w-full h-full rounded-xl text-white flex flex-col items-center justify-center transition-all duration-200 hover:brightness-110 group relative overflow-hidden`}
      style={bgStyle}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {isEditing && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeTile(tile.id); }}
          className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
        >
          <X size={12} />
        </button>
      )}
      
      {!(tile.bgType === 'image' && bgUrl) && (
        <div className="relative z-10 opacity-90 group-hover:opacity-100 transition-opacity">
          {getIcon(tile.icon)}
        </div>
      )}
      {tile.title && !(tile.bgType === 'image' && bgUrl) && (
        <span className="text-xs font-medium relative z-10 truncate w-full text-center px-1">
          {tile.title}
        </span>
      )}
    </a>
  );
};

const ICON_OPTIONS = ['Link', 'Globe', 'Github', 'Youtube', 'Tv', 'Search', 'Mail', 'Map', 'Music', 'Video', 'Image', 'File', 'Folder', 'Heart', 'Star', 'Bookmark', 'Home', 'Settings', 'User', 'ShoppingCart'];
const COLOR_OPTIONS = ['bg-zinc-800', 'bg-red-600', 'bg-orange-500', 'bg-yellow-500', 'bg-green-600', 'bg-blue-500', 'bg-indigo-600', 'bg-purple-600', 'bg-pink-500', 'bg-sky-500'];

export const TileEditor = ({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (tile: Tile) => void }) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('https://');
  const [icon, setIcon] = useState('Link');
  const [color, setColor] = useState('bg-blue-500');

  const handleSave = () => {
    if (!url || url === 'https://') return;
    onSave({
      id: Date.now().toString(),
      title: title || undefined,
      url,
      icon,
      color
    });
    setTitle('');
    setUrl('https://');
    setIcon('Link');
    setColor('bg-blue-500');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-[360px] shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-white text-lg font-bold mb-4">添加磁贴</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-zinc-400 text-sm block mb-1">标题（可选）</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="网站名称"
              className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm"
            />
          </div>
          
          <div>
            <label className="text-zinc-400 text-sm block mb-1">链接</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm"
            />
          </div>
          
          <div>
            <label className="text-zinc-400 text-sm block mb-2">图标</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((iconName) => {
                // @ts-ignore
                const IconComp = Icons[iconName] || Icons.Link;
                return (
                  <button
                    key={iconName}
                    onClick={() => setIcon(iconName)}
                    className={`p-2 rounded-lg transition-colors ${icon === iconName ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                  >
                    <IconComp size={18} />
                  </button>
                );
              })}
            </div>
          </div>
          
          <div>
            <label className="text-zinc-400 text-sm block mb-2">颜色</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((colorClass) => (
                <button
                  key={colorClass}
                  onClick={() => setColor(colorClass)}
                  className={`w-8 h-8 rounded-lg ${colorClass} transition-transform ${color === colorClass ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
                />
              ))}
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-zinc-400 hover:text-white transition-colors">
            取消
          </button>
          <button onClick={handleSave} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
            添加
          </button>
        </div>
      </div>
    </div>
  );
};
