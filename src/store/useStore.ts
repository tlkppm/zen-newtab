import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Shortcut {
  id: string;
  title: string;
  url: string;
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

  searchEngine: SearchEngine;
  setSearchEngine: (engine: SearchEngine) => void;

  // Layout State
  layout: {
      clock: LayoutItem;
      search: LayoutItem;
      shortcuts: LayoutItem; // Bookmarks
      mediaPlayer: LayoutItem;
      weather: LayoutItem;
      quote: LayoutItem;
      date: LayoutItem;
  };
  updateLayout: (id: keyof AppState['layout'], updates: Partial<LayoutItem>) => void;
  resetLayout: () => void;
  exportLayout: () => string;
  importLayout: (code: string) => boolean;
}

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

      searchEngine: 'google' as SearchEngine,
      setSearchEngine: (engine) => set({ searchEngine: engine }),

      // Default Layout
      layout: {
          clock: { id: 'clock', x: 0, y: -80, w: 600, h: 200, visible: true },
          search: { id: 'search', x: 0, y: 50, w: 500, h: 50, visible: true },
          shortcuts: { id: 'shortcuts', x: 0, y: 200, w: 800, h: 400, visible: false },
          mediaPlayer: { id: 'mediaPlayer', x: 300, y: 200, w: 300, h: 100, visible: false },
          weather: { id: 'weather', x: 300, y: -200, w: 250, h: 120, visible: false },
          quote: { id: 'quote', x: -300, y: 200, w: 300, h: 100, visible: false },
          date: { id: 'date', x: 0, y: -20, w: 400, h: 50, visible: false },
      },
      updateLayout: (id, updates) => set((state) => ({
          layout: {
              ...state.layout,
              [id]: { ...state.layout[id], ...updates }
          }
      })),
      resetLayout: () => set({
          layout: {
              clock: { id: 'clock', x: 0, y: -80, w: 600, h: 200, visible: true },
              search: { id: 'search', x: 0, y: 50, w: 500, h: 50, visible: true },
              shortcuts: { id: 'shortcuts', x: 0, y: 200, w: 800, h: 400, visible: false },
              mediaPlayer: { id: 'mediaPlayer', x: 300, y: 200, w: 300, h: 100, visible: false },
              weather: { id: 'weather', x: 300, y: -200, w: 250, h: 120, visible: false },
              quote: { id: 'quote', x: -300, y: 200, w: 300, h: 100, visible: false },
              date: { id: 'date', x: 0, y: -20, w: 400, h: 50, visible: false },
          }
      }),
      exportLayout: () => {
          const state = get();
          const compact: Record<string, number[]> = {};
          Object.entries(state.layout).forEach(([k, v]) => {
              compact[k] = [v.x, v.y, v.w, v.h, v.visible ? 1 : 0];
          });
          const data = {
              _: '静谧新标签页',
              v: 1,
              e: state.searchEngine[0],
              s: state.showSeconds ? 1 : 0,
              l: compact
          };
          const json = JSON.stringify(data);
          const base64 = btoa(unescape(encodeURIComponent(json)));
          return `ZEN://${base64}`;
      },
      importLayout: (code: string) => {
          try {
              if (!code.startsWith('ZEN://')) return false;
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
                  layout: layout as AppState['layout'],
                  searchEngine: engines[data.e] || 'google',
                  showSeconds: data.s === 1
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
        layout: state.layout
      }),
    }
  )
);
