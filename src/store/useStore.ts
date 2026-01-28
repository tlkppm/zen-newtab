import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Shortcut {
  id: string;
  title: string;
  url: string;
}

export interface Tile {
  id: string;
  title?: string;
  url: string;
  color: string;
  icon: string;
  bgType?: 'color' | 'image';
  bgImage?: string; // id for DB lookup, or url
  // New fields for grid/slice support
  bgSlice?: {
      x: number; // percentage 0-100
      y: number; // percentage 0-100
      zoomX: number; // percentage (e.g. 200 for 2 cols)
      zoomY: number; // percentage (e.g. 200 for 2 rows)
  };
}

export type BackgroundType = 'image' | 'video';
export type SearchEngine = 'google' | 'bing' | 'baidu';

interface LayoutItem {
  id?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
}

interface AppState {
  // ... existing state ...
  backgroundType: BackgroundType;
  backgroundImage: string; // URL for image
  backgroundVideo: string | null;
  videoTimestamp: number;
  backgroundImageSource: 'url' | 'local';
  imageTimestamp: number;

  setBackgroundImage: (url: string) => void;
  setLocalImage: () => void;
  setBackgroundType: (type: BackgroundType) => void;
  updateVideoTimestamp: () => void;
  updateImageTimestamp: () => void;
  applyLocalImage: () => void;
  applyVideo: () => void;
  
  showSeconds: boolean;
  toggleShowSeconds: () => void;
  
  shortcuts: Shortcut[];
  addShortcut: (shortcut: Shortcut) => void;
  removeShortcut: (id: string) => void;

  tiles: Tile[];
  addTile: (tile: Tile) => void;
  removeTile: (id: string) => void;
  updateTile: (id: string, updates: Partial<Tile>) => void;
  setTiles: (tiles: Tile[]) => void;

  searchEngine: SearchEngine;
  setSearchEngine: (engine: SearchEngine) => void;

  // Layout State
  // We use Record<string, LayoutItem> to support dynamic keys (like individual tiles)
  layout: Record<string, LayoutItem>;
  updateLayout: (id: string, updates: Partial<LayoutItem>) => void;
  resetLayout: () => void;
  exportLayout: () => string;
  importLayout: (code: string) => boolean;
}

const DEFAULT_LAYOUT = {
    clock: { id: 'clock', x: 0, y: -80, w: 600, h: 200, visible: true },
    search: { id: 'search', x: 0, y: 50, w: 500, h: 50, visible: true },
    shortcuts: { id: 'shortcuts', x: 0, y: 200, w: 800, h: 400, visible: false },
    mediaPlayer: { id: 'mediaPlayer', x: 300, y: 200, w: 300, h: 100, visible: false },
    weather: { id: 'weather', x: 300, y: -200, w: 250, h: 120, visible: false },
    quote: { id: 'quote', x: -300, y: 200, w: 300, h: 100, visible: false },
    date: { id: 'date', x: 0, y: -20, w: 400, h: 50, visible: false },
    calendar: { id: 'calendar', x: 400, y: -100, w: 360, h: 340, visible: false },
    todo: { id: 'todo', x: -400, y: 0, w: 300, h: 400, visible: false },
    memo: { id: 'memo', x: 400, y: 0, w: 300, h: 300, visible: false },
    pomodoro: { id: 'pomodoro', x: 0, y: 200, w: 300, h: 320, visible: false },
    about: { id: 'about', x: 0, y: 0, w: 400, h: 300, visible: false },
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ... existing initial state ...
      backgroundType: 'image' as BackgroundType,
      backgroundImage: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2070&auto=format&fit=crop',
      backgroundVideo: null,
      videoTimestamp: 0,
      backgroundImageSource: 'url' as const,
      imageTimestamp: 0,

      setBackgroundImage: (url) => set({ backgroundImage: url, backgroundImageSource: 'url', backgroundType: 'image' }),
      setLocalImage: () => set({ backgroundImageSource: 'local', backgroundType: 'image' }),
      updateImageTimestamp: () => set({ imageTimestamp: Date.now() }),
      setBackgroundType: (type) => set({ backgroundType: type }),
      updateVideoTimestamp: () => set({ videoTimestamp: Date.now() }),
      applyLocalImage: () => set({ backgroundImageSource: 'local', backgroundType: 'image', imageTimestamp: Date.now() }),
      applyVideo: () => set({ backgroundType: 'video', videoTimestamp: Date.now() }),

      showSeconds: false,
      toggleShowSeconds: () => set((state) => ({ showSeconds: !state.showSeconds })),
      
      shortcuts: [
        { id: '1', title: 'Google', url: 'https://www.google.com' },
        { id: '2', title: 'Bilibili', url: 'https://www.bilibili.com' },
        { id: '3', title: 'GitHub', url: 'https://github.com' },
      ],
      addShortcut: (shortcut) => set((state) => ({ shortcuts: [...state.shortcuts, shortcut] })),
      removeShortcut: (id) => set((state) => ({ shortcuts: state.shortcuts.filter((s) => s.id !== id) })),

      tiles: [
        // Default tiles
      ],
      addTile: (tile) => set((state) => {
          // Add a new layout entry for this tile
          const tileLayoutId = `tile_${tile.id}`;
          return {
              tiles: [...state.tiles, tile],
              layout: {
                  ...state.layout,
                  [tileLayoutId]: { 
                      id: tileLayoutId, 
                      x: 0, 
                      y: 0, 
                      w: 100, 
                      h: 100, 
                      visible: true 
                  }
              }
          };
      }),
      removeTile: (id) => set((state) => {
          const newLayout = { ...state.layout };
          delete newLayout[`tile_${id}`];
          return { 
              tiles: state.tiles.filter((t) => t.id !== id),
              layout: newLayout
          };
      }),
      updateTile: (id, updates) => set((state) => ({
        tiles: state.tiles.map((t) => (t.id === id ? { ...t, ...updates } : t))
      })),
      setTiles: (tiles) => set({ tiles }),

      searchEngine: 'google' as SearchEngine,
      setSearchEngine: (engine) => set({ searchEngine: engine }),

      // Layout State
      layout: DEFAULT_LAYOUT,
      updateLayout: (id, updates) => set((state) => ({
          layout: {
              ...state.layout,
              [id]: { ...state.layout[id], ...updates }
          }
      })),
      resetLayout: () => set((state) => {
          // Reset only the core widgets, but maybe we should keep tile layouts?
          // Or just reset everything.
          // For now, let's keep tile layouts if they exist, but reset core ones.
          const currentLayout = state.layout;
          const newLayout = { ...DEFAULT_LAYOUT };
          
          // Preserve tile layouts but reset their positions? Or just keep them as is?
          // If we want "reset" to mean "restore factory defaults", we might clear tiles.
          // But usually users just want to fix the clock position.
          // Let's preserve tile layouts but maybe ensure they are visible?
          Object.keys(currentLayout).forEach(key => {
              if (key.startsWith('tile_')) {
                  // @ts-ignore
                  newLayout[key] = currentLayout[key];
              }
          });

          return { layout: newLayout };
      }),
      exportLayout: () => {
          const state = get();
          const keyMap: Record<string, string> = {
              clock: 'c', search: 's', shortcuts: 'h', mediaPlayer: 'm',
              weather: 'w', quote: 'q', date: 'd', tiles: 't',
              calendar: 'a', pomodoro: 'p', memo: 'e', todo: 'o'
          };
          const compact: Record<string, string> = {};
          Object.entries(state.layout).forEach(([k, v]) => {
              const key = keyMap[k] || k;
              compact[key] = `${v.x},${v.y},${v.w},${v.h},${v.visible ? 1 : 0}`;
          });
          
          const tilesCompact = state.tiles.map(t => 
              `${t.id}|${t.title || ''}|${t.url}|${t.color.replace('bg-', '')}|${t.icon}`
          ).join(';');
          
          const parts = [
              '2',
              state.searchEngine[0],
              state.showSeconds ? '1' : '0',
              Object.entries(compact).map(([k, v]) => `${k}:${v}`).join('|'),
              tilesCompact
          ];
          
          const data = parts.join('~');
          const compressed = btoa(unescape(encodeURIComponent(data)))
              .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
          return `ZEN${compressed}`;
      },
      importLayout: (code: string) => {
          try {
              if (code.startsWith('ZEN://')) {
                  const base64 = code.replace('ZEN://', '');
                  const json = decodeURIComponent(escape(atob(base64)));
                  const data = JSON.parse(json);
                  if (data.v !== 1 || !data.l) return false;
                  const engines: Record<string, SearchEngine> = { g: 'google', b: 'bing', a: 'baidu' };
                  const layout: Record<string, LayoutItem> = {};
                  Object.entries(data.l).forEach(([k, v]) => {
                      const arr = v as number[];
                      layout[k] = { id: k, x: arr[0], y: arr[1], w: arr[2], h: arr[3], visible: arr[4] === 1 };
                  });
                  set({
                      layout: layout as Record<string, LayoutItem>,
                      searchEngine: engines[data.e] || 'google',
                      showSeconds: data.s === 1,
                      tiles: data.t || []
                  });
                  return true;
              }
              
              if (!code.startsWith('ZEN')) return false;
              const compressed = code.replace('ZEN', '');
              const padded = compressed.replace(/-/g, '+').replace(/_/g, '/');
              const data = decodeURIComponent(escape(atob(padded)));
              const parts = data.split('~');
              if (parts[0] !== '2') return false;
              
              const keyMap: Record<string, string> = {
                  c: 'clock', s: 'search', h: 'shortcuts', m: 'mediaPlayer',
                  w: 'weather', q: 'quote', d: 'date', t: 'tiles',
                  a: 'calendar', p: 'pomodoro', e: 'memo', o: 'todo'
              };
              const engines: Record<string, SearchEngine> = { g: 'google', b: 'bing', a: 'baidu' };
              
              const layout: Record<string, LayoutItem> = {};
              parts[3].split('|').forEach(item => {
                  const [key, vals] = item.split(':');
                  const [x, y, w, h, v] = vals.split(',').map(Number);
                  const fullKey = keyMap[key] || key;
                  layout[fullKey] = { id: fullKey, x, y, w, h, visible: v === 1 };
              });
              
              const tiles: Tile[] = parts[4] ? parts[4].split(';').filter(Boolean).map(t => {
                  const [id, title, url, color, icon] = t.split('|');
                  return { id, title: title || undefined, url, color: `bg-${color}`, icon };
              }) : [];
              
              set({
                  layout,
                  searchEngine: engines[parts[1]] || 'google',
                  showSeconds: parts[2] === '1',
                  tiles
              });
              return true;
          } catch {
              return false;
          }
      }
    }),
    {
      name: 'zen-newtab-storage',
      partialize: (state) => ({ 
        // Do not persist backgroundVideo blob URL as it expires
        searchEngine: state.searchEngine,
        backgroundType: state.backgroundType,
        backgroundImage: state.backgroundImage,
        backgroundImageSource: state.backgroundImageSource,
        showSeconds: state.showSeconds,
        shortcuts: state.shortcuts,
        tiles: state.tiles,
        layout: state.layout
      }),
    }
  )
);
