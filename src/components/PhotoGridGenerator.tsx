import { useState, useRef } from 'react';
import { X, Upload, Grid, Check, Image as ImageIcon } from 'lucide-react';
import { useStore, Tile } from '../store/useStore';
import { saveTileImage } from '../lib/db';

interface PhotoGridGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tiles: Tile[], rows: number, cols: number) => void;
}

export const PhotoGridGenerator = ({ isOpen, onClose, onSave }: PhotoGridGeneratorProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleGenerate = async () => {
    if (!imageFile) return;

    // Save image once
    const bgImageId = Math.random().toString(36).substring(2, 15);
    await saveTileImage(bgImageId, imageFile);

    const newTiles: Tile[] = [];
    const zoomX = cols * 100; // e.g., 2 cols -> 200% width
    const zoomY = rows * 100; // e.g., 2 rows -> 200% height (CSS background-size is width height, or just cover? actually zoom relative to container)
    // CSS background-size: percentage is relative to the background positioning area.
    // If we want each tile to show 1/cols of the width, the background size needs to be cols * 100%.
    // So if cols=2, bg-size=200%. Then each tile shows 50% of image.
    // BUT, we need to consider aspect ratio.
    // Ideally, for a grid, we want "cover" behavior across the WHOLE grid.
    // Simpler approach: Assume square tiles and square grid for now, or just stretch.
    // Let's use the standard "zoom" logic:
    // background-size: ${cols * 100}% ${rows * 100}%
    
    // Actually, background-size: X% Y%.
    // If we have 2x2 grid.
    // Size = 200% 200%.
    
    const bgSizeStr = `${cols * 100}% ${rows * 100}%`; // Note: SingleTile expects a single number for zoom? 
    // I updated SingleTile to use `tile.bgSlice.zoom` as a single number %. 
    // Let's update SingleTile logic later if non-square grids need separate X/Y zoom.
    // For now, let's assume `zoom` applies to width (or both if `cover` logic, but standard split usually implies uniform scaling).
    // Let's pass `zoom` as just `cols * 100` for now, assuming user adjusts layout.
    // Actually, let's just use `cols * 100` and hope aspect ratio holds or user adjusts tile W/H to match image aspect.
    
    // Wait, SingleTile uses: backgroundSize: `${tile.bgSlice.zoom}%`
    // If I put `200%`, it scales width to 200% of container. Height scales automatically to preserve aspect ratio?
    // If `background-size: 200% auto`, yes.
    // But for a grid split, we usually want explicit mapping.
    // Let's try to stick to `background-size: ${cols*100}% ${rows*100}%` in SingleTile?
    // I need to change SingleTile again if I want non-square support perfectly.
    // Let's assume for this MVP, we use `cols * 100` and `rows * 100` logic.
    // But `bgSlice.zoom` is a single number.
    // Let's just use `cols * 100` for now.

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Calculate position percentage
        // 0..100% range.
        // If cols=2: 0, 100. (0 / 1 * 100, 1 / 1 * 100)
        // If cols=3: 0, 50, 100. (0/2, 1/2, 2/2)
        const posX = cols > 1 ? (c / (cols - 1)) * 100 : 0;
        const posY = rows > 1 ? (r / (rows - 1)) * 100 : 0;

        newTiles.push({
          id: Math.random().toString(36).substring(2, 9),
          title: '', // No title for photo tiles usually
          url: '', // No link usually
          color: 'bg-zinc-800',
          icon: 'Image',
          bgType: 'image',
          bgImage: bgImageId,
          bgSlice: {
            x: posX,
            y: posY,
            zoomX: cols * 100,
            zoomY: rows * 100
          }
        });
      }
    }

    onSave(newTiles, rows, cols);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Grid size={18} />
            图片拼图生成器
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Image Upload */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative w-full aspect-video border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-zinc-800/50 transition-all overflow-hidden group"
          >
            {previewUrl ? (
              <>
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                
                {/* Grid Overlay Preview */}
                <div 
                    className="absolute inset-0 grid pointer-events-none border border-blue-500/30"
                    style={{ 
                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                        gridTemplateRows: `repeat(${rows}, 1fr)`
                    }}
                >
                    {Array.from({ length: rows * cols }).map((_, i) => (
                        <div key={i} className="border border-blue-500/30 backdrop-contrast-125" />
                    ))}
                </div>

                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-medium flex items-center gap-2">
                        <Upload size={16} />
                        更换图片
                    </span>
                </div>
              </>
            ) : (
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-400 group-hover:text-blue-400 transition-colors">
                    <ImageIcon size={24} />
                </div>
                <p className="text-zinc-300 font-medium mb-1">点击上传图片</p>
                <p className="text-zinc-500 text-xs">支持 JPG, PNG, WEBP</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Grid Settings */}
          <div className="grid grid-cols-2 gap-4">
             <div>
                 <label className="text-xs text-zinc-400 mb-2 block">行数 (Rows)</label>
                 <div className="flex items-center gap-2">
                     <input 
                        type="range" min="1" max="6" step="1"
                        value={rows}
                        onChange={e => setRows(parseInt(e.target.value))}
                        className="flex-1 accent-blue-600 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                     />
                     <span className="w-8 text-center text-sm font-mono text-white bg-zinc-800 py-1 rounded">{rows}</span>
                 </div>
             </div>
             <div>
                 <label className="text-xs text-zinc-400 mb-2 block">列数 (Columns)</label>
                 <div className="flex items-center gap-2">
                     <input 
                        type="range" min="1" max="6" step="1"
                        value={cols}
                        onChange={e => setCols(parseInt(e.target.value))}
                        className="flex-1 accent-blue-600 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                     />
                     <span className="w-8 text-center text-sm font-mono text-white bg-zinc-800 py-1 rounded">{cols}</span>
                 </div>
             </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!imageFile}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
          >
            <Check size={18} />
            生成拼图磁贴 ({rows * cols} 个)
          </button>
        </div>
      </div>
    </div>
  );
};
