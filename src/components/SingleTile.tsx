import { useState, useEffect } from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import { useStore, Tile } from '../store/useStore';
import * as Icons from 'lucide-react';
import { getTileImage, deleteTileImage } from '../lib/db';
import { TileEditor } from './TileEditor';

interface SingleTileProps {
  tile: Tile;
  isEditing: boolean;
}

export const SingleTile = ({ tile, isEditing }: SingleTileProps) => {
  const { removeTile, updateTile } = useStore();
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    if (tile.bgType === 'image' && tile.bgImage) {
      getTileImage(tile.bgImage).then(url => {
        if (url) setBgImage(url);
      });
    } else {
        setBgImage(null);
    }
  }, [tile.bgImage, tile.bgType]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('确定要删除这个磁贴吗？')) {
      removeTile(tile.id);
      if (tile.bgImage) {
        await deleteTileImage(tile.bgImage);
      }
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditorOpen(true);
  };

  const handleSave = (updatedTile: Tile) => {
      updateTile(tile.id, updatedTile);
      setIsEditorOpen(false);
  };

  const getIcon = (iconName: string) => {
    // @ts-ignore
    const Icon = Icons[iconName] || Icons.Link;
    return <Icon size={32} className="mb-2 opacity-80 group-hover:opacity-100 transition-opacity" />;
  };

  return (
    <>
    <div className={`w-full h-full relative group rounded-2xl overflow-hidden transition-all duration-300 border border-white/5 bg-zinc-900/20 backdrop-blur-sm ${isEditing ? 'cursor-move ring-2 ring-blue-500/30' : 'hover:scale-[1.02] hover:shadow-xl hover:border-white/20'}`}>
      <a
        href={isEditing ? undefined : tile.url}
        onClick={(e) => isEditing && e.preventDefault()}
        className={`block w-full h-full flex flex-col items-center justify-center text-white relative overflow-hidden`}
        style={
            bgImage 
            ? { 
                backgroundImage: `url(${bgImage})`, 
                backgroundSize: tile.bgSlice ? `${tile.bgSlice.zoomX}% ${tile.bgSlice.zoomY}%` : 'cover', 
                backgroundPosition: tile.bgSlice ? `${tile.bgSlice.x}% ${tile.bgSlice.y}%` : 'center',
                backgroundRepeat: 'no-repeat'
              } 
            : {}
        }
      >
        {/* Background Layer for Color Mode (Glassmorphism) */}
        {tile.bgType !== 'image' && (
             <div className={`absolute inset-0 ${tile.color} opacity-60 backdrop-blur-md group-hover:opacity-80 transition-all duration-300`} />
        )}

        {/* Overlay for Image Mode */}
        {bgImage && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />}
        
        {/* Content - only show if not image mode with loaded image */}
        {!(tile.bgType === 'image' && bgImage) && (
          <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center w-full h-full">
              {tile.bgType !== 'image' && getIcon(tile.icon)}
              
              {tile.bgType === 'image' && !bgImage && (
                  <span className="text-xs text-zinc-500 animate-pulse">加载中...</span>
              )}
              
              {tile.title && (
                  <span className="text-sm font-medium tracking-wide drop-shadow-md px-2 truncate w-full text-white/90 group-hover:text-white transition-colors">
                      {tile.title}
                  </span>
              )}
          </div>
        )}
      </a>

      {/* Edit Controls */}
      {isEditing && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            onClick={handleEdit}
            className="p-1.5 bg-black/60 hover:bg-blue-600 text-white rounded-lg backdrop-blur-md transition-colors shadow-lg border border-white/10"
            title="编辑"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-lg backdrop-blur-md transition-colors shadow-lg border border-white/10"
            title="删除"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>

    <TileEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSave}
        initialTile={tile}
    />
    </>
  );
};
