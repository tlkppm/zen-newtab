import { useState, useEffect, useRef } from 'react';
import { X, Upload, Check, Image as ImageIcon, Type, Link as LinkIcon, Palette } from 'lucide-react';
import { Tile } from '../store/useStore';
import { saveTileImage, getTileImage } from '../lib/db';

interface TileEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tile: Tile) => void;
  initialTile?: Tile | null;
}

const COLORS = [
  'bg-zinc-800',
  'bg-red-600',
  'bg-orange-600',
  'bg-amber-600',
  'bg-green-600',
  'bg-emerald-600',
  'bg-teal-600',
  'bg-cyan-600',
  'bg-sky-600',
  'bg-blue-600',
  'bg-indigo-600',
  'bg-violet-600',
  'bg-purple-600',
  'bg-fuchsia-600',
  'bg-pink-600',
  'bg-rose-600',
];

const ICONS = [
  'Link', 'Github', 'Youtube', 'Twitter', 'Facebook', 'Instagram', 'Linkedin', 
  'Mail', 'Map', 'Search', 'ShoppingBag', 'Music', 'Video', 'Game', 'Code', 
  'Terminal', 'Book', 'Cloud', 'Coffee', 'Tv'
];

export const TileEditor = ({ isOpen, onClose, onSave, initialTile }: TileEditorProps) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState('Link');
  const [bgType, setBgType] = useState<'color' | 'image'>('color');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialTile) {
        setTitle(initialTile.title);
        setUrl(initialTile.url);
        setColor(initialTile.color);
        setIcon(initialTile.icon);
        setBgType(initialTile.bgType || 'color');
        if (initialTile.bgType === 'image' && initialTile.bgImage) {
           getTileImage(initialTile.bgImage).then(url => {
               if (url) setImagePreview(url);
           });
        } else {
            setImagePreview(null);
        }
      } else {
        setTitle('');
        setUrl('');
        setColor(COLORS[0]);
        setIcon('Link');
        setBgType('color');
        setImagePreview(null);
        setImageFile(null);
      }
    }
  }, [isOpen, initialTile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setBgType('image');
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let bgImageId = initialTile?.bgImage;

    if (bgType === 'image' && imageFile) {
       // Generate a random ID for the image if new
       const id = initialTile?.bgImage || Math.random().toString(36).substring(2, 15);
       await saveTileImage(id, imageFile);
       bgImageId = id;
    }

    onSave({
      id: initialTile?.id || Math.random().toString(36).substring(2, 9),
      title,
      url,
      color,
      icon,
      bgType,
      bgImage: bgImageId
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-white font-medium">{initialTile ? '编辑磁贴' : '添加磁贴'}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title & URL */}
          <div className="space-y-3">
            <div className="relative">
              <Type className="absolute left-3 top-2.5 text-zinc-500" size={16} />
              <input
                type="text"
                placeholder="标题 (可选)"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-zinc-800 text-white pl-10 pr-4 py-2 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-2.5 text-zinc-500" size={16} />
              <input
                type="text" // allow any protocol
                placeholder="链接 (https://...)"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full bg-zinc-800 text-white pl-10 pr-4 py-2 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm"
                required
              />
            </div>
          </div>

          {/* Background Type Toggle */}
          <div className="flex bg-zinc-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setBgType('color')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs rounded-md transition-colors ${bgType === 'color' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-300'}`}
            >
              <Palette size={14} />
              纯色
            </button>
            <button
              type="button"
              onClick={() => setBgType('image')}
              className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs rounded-md transition-colors ${bgType === 'image' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-300'}`}
            >
              <ImageIcon size={14} />
              图片
            </button>
          </div>

          {/* Color Picker */}
          {bgType === 'color' && (
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">背景颜色</label>
              <div className="grid grid-cols-8 gap-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-full aspect-square rounded-md ${c} ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : 'hover:opacity-80'}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Image Upload */}
          {bgType === 'image' && (
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">背景图片</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full h-32 border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-zinc-500 transition-colors overflow-hidden group"
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs">点击更换</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="text-zinc-500 mb-2" size={24} />
                    <span className="text-zinc-500 text-xs">点击上传图片</span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Icon Picker (Simplified) */}
          <div className="space-y-2">
             <label className="text-xs text-zinc-400">图标 (仅纯色模式显示)</label>
             <select 
                value={icon} 
                onChange={e => setIcon(e.target.value)}
                className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg border border-zinc-700 focus:border-blue-500 focus:outline-none text-sm"
             >
                 {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
             </select>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mt-2"
          >
            <Check size={16} />
            保存
          </button>
        </form>
      </div>
    </div>
  );
};
