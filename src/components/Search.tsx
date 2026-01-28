import { useState, FormEvent, useEffect, useRef } from 'react';
import { Search as SearchIcon, Clock, X } from 'lucide-react';
import { useStore, SearchEngine } from '../store/useStore';

const GoogleIcon = () => (
  <svg viewBox="0 0 1024 1024" width="20" height="20">
    <path d="M214.101333 512c0-32.512 5.546667-63.701333 15.36-92.928L57.173333 290.218667A491.861333 491.861333 0 0 0 4.693333 512c0 79.701333 18.858667 154.88 52.394667 221.610667l172.202667-129.066667A290.56 290.56 0 0 1 214.101333 512" fill="#FBBC05"/>
    <path d="M516.693333 216.192c72.106667 0 137.258667 25.002667 188.458667 65.962667L854.101333 136.533333C763.349333 59.178667 646.997333 11.392 516.693333 11.392c-202.325333 0-376.234667 113.28-459.52 278.826667l172.373334 128.853333c39.68-118.016 152.832-202.88 287.146666-202.88" fill="#EA4335"/>
    <path d="M516.693333 807.808c-134.357333 0-247.509333-84.864-287.232-202.88l-172.288 128.853333c83.242667 165.546667 257.152 278.826667 459.52 278.826667 124.842667 0 244.053333-43.392 333.568-124.757333l-163.584-123.818667c-46.122667 28.458667-104.234667 43.776-170.026666 43.776" fill="#34A853"/>
    <path d="M1005.397333 512c0-29.568-4.693333-61.44-11.648-91.008H516.650667V614.4h274.602666c-13.696 65.962667-51.072 116.650667-104.533333 149.632l163.541333 123.818667c93.994667-85.418667 155.136-212.650667 155.136-375.850667" fill="#4285F4"/>
  </svg>
);

const BingIcon = () => (
  <svg viewBox="0 0 1024 1024" width="20" height="20">
    <path d="M166.4 72.789333L371.2 145.066667v586.24l250.026667-144.64-138.24-65.28-71.68-168.96L640 256v561.066667L166.4 1006.933333V72.789333z" fill="#00809D"/>
    <path d="M371.2 145.066667l239.36 96.853333 71.68 168.96 138.24 65.28L640 817.066667V256l-228.693333 96.426667V145.066667z" fill="#0CB8E6"/>
  </svg>
);

const BaiduIcon = () => (
  <svg viewBox="0 0 1024 1024" width="20" height="20">
    <path d="M345.706 297.423c15.35 12.792 35.817 20.467 53.726 17.908 20.467 0 38.375-10.233 53.725-23.025 17.91-15.35 30.7-35.817 40.934-58.842C512 189.97 512 136.245 496.65 90.194c-10.234-30.7-28.142-58.842-53.726-76.75C427.574 3.21 404.548-1.906 384.081 0.652c-12.791 2.558-25.583 7.675-38.375 15.35-23.025 15.35-38.376 40.934-48.61 66.518-12.791 46.05-15.35 92.101-2.557 138.152 10.233 28.142 25.583 56.284 51.167 76.75z m255.837 2.558c17.909 15.35 40.934 25.584 63.96 25.584 20.466 2.558 38.375-2.558 56.283-12.792 17.909-10.233 33.26-25.584 43.493-43.492 12.792-20.467 23.025-40.934 30.7-63.96 5.117-17.908 7.675-38.375 5.117-58.842-2.559-28.142-15.35-53.726-33.259-76.751-12.792-15.35-28.142-30.7-46.05-38.376-12.792-5.116-28.143-10.233-40.935-7.675-17.908 2.559-33.258 12.792-46.05 23.026-17.909 15.35-33.259 33.258-43.493 53.725-10.233 17.909-20.466 38.376-23.025 61.401-2.558 25.584-2.558 51.168 2.559 74.193 5.116 23.025 12.791 46.05 30.7 63.96zM245.929 509.768c17.91-15.35 28.143-35.818 35.818-56.285 10.233-33.258 10.233-66.517 7.675-99.776 0-12.792-5.117-25.584-10.234-38.376-12.792-28.142-35.817-53.725-63.959-69.076-23.025-10.233-46.05-15.35-66.518-10.233-25.583 2.558-46.05 20.467-61.4 40.934-20.467 28.142-30.7 63.96-35.818 97.218-2.558 20.467 0 40.934 5.117 61.4 7.675 30.701 23.025 58.843 46.05 79.31 17.91 15.35 40.935 23.026 63.96 23.026 28.142 0 56.284-7.675 79.31-28.142z m736.811-76.752c-2.558-20.467-7.675-38.375-17.908-56.284-10.234-20.467-28.143-40.934-48.61-51.167-23.025-12.792-51.167-15.35-76.75-12.792-12.792 2.558-28.143 5.117-40.935 12.792-17.908 10.233-30.7 28.142-40.933 48.609-10.234 25.584-15.35 53.726-15.35 81.868 0 25.583 0 53.726 7.674 79.31 5.117 17.908 15.35 38.375 33.26 48.608 17.908 15.35 40.933 20.467 63.959 23.026 17.908 2.558 38.375 2.558 56.284-2.559 17.908-5.116 35.817-15.35 46.05-30.7 12.792-15.35 20.467-35.817 23.026-53.726 12.792-30.7 10.233-58.842 10.233-86.985zM911.106 819.33c-2.559-35.817-20.467-71.634-46.05-99.776-5.118-5.117-10.234-10.233-15.35-15.35-23.025-12.792-51.167-12.792-74.192-5.117-23.025 7.675-43.492 25.583-53.725 48.609-10.234 23.025-7.675 51.167 5.116 74.192 7.675 12.792 20.467 25.584 35.818 33.259 15.35 7.675 33.258 7.675 48.609 2.558 17.909-5.116 33.259-17.908 43.492-33.258 5.117-2.558 5.117-5.117 5.117-7.675l51.167 2.558z" fill="#306CFF"/>
    <path d="M340.59 734.904c-12.793 5.117-25.585 15.35-33.26 30.7-5.116 12.792-7.675 25.584-7.675 38.376 0 15.35 5.117 30.7 12.792 43.492 10.234 15.35 28.142 25.584 46.05 23.026h53.727V732.346H353.38c-2.558-2.559-7.675 0-12.792 2.558z" fill="#306CFF"/>
  </svg>
);

const detectBrowser = (): 'edge' | 'chrome' | 'other' => {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'edge';
  if (ua.includes('Chrome/')) return 'chrome';
  return 'other';
};

const extractSearchQuery = (url: string): string | null => {
    try {
        const u = new URL(url);
        // Google
        if (u.hostname.includes('google.') && u.pathname.includes('/search')) {
            return u.searchParams.get('q');
        }
        // Bing
        if (u.hostname.includes('bing.com') && u.pathname.includes('/search')) {
            return u.searchParams.get('q');
        }
        // Baidu
        if (u.hostname.includes('baidu.com') && u.pathname.includes('/s')) {
            return u.searchParams.get('wd');
        }
        // DuckDuckGo
        if (u.hostname.includes('duckduckgo.com')) {
            return u.searchParams.get('q');
        }
    } catch (e) {
        return null;
    }
    return null;
};

export const Search = () => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { searchEngine, setSearchEngine } = useStore();
  const formRef = useRef<HTMLFormElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load history and set default engine
  useEffect(() => {
    const storageKey = 'zen-newtab-storage';
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      const browser = detectBrowser();
      if (browser === 'edge') {
        setSearchEngine('bing');
      }
    }
    
    // Load recent searches logic...
    if (typeof chrome !== 'undefined' && chrome.history) {
        chrome.history.search({ text: '', maxResults: 100 }, (results) => {
            const queries = new Set<string>();
            for (const item of results) {
                if (item.url) {
                    const q = extractSearchQuery(item.url);
                    if (q) {
                        queries.add(decodeURIComponent(q).replace(/\+/g, ' '));
                    }
                }
                if (queries.size >= 8) break;
            }
            setRecentSearches(Array.from(queries));
        });
    } else {
        const saved = localStorage.getItem('zen-recent-searches');
        if (saved) {
            try {
                setRecentSearches(JSON.parse(saved));
            } catch (e) {}
        }
    }
  }, [setSearchEngine, isFocused]);

  // Fetch suggestions when query changes
  useEffect(() => {
      if (!query.trim()) {
          setSuggestions([]);
          return;
      }

      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

      debounceTimeout.current = setTimeout(() => {
          if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
              console.log('[Search] Fetching suggestions for:', query);
              chrome.runtime.sendMessage(
                  { type: 'GET_SUGGESTIONS', query: query, engine: searchEngine },
                  (response) => {
                      console.log('[Search] Got response:', response);
                      if (chrome.runtime.lastError) {
                          console.error('[Search] Error:', chrome.runtime.lastError);
                      }
                      if (response && response.suggestions) {
                          setSuggestions(response.suggestions.slice(0, 8));
                      }
                  }
              );
          } else {
              // Mock for dev
              setSuggestions([
                  `${query} 测试建议 1`,
                  `${query} test suggestion 2`,
                  `${query} 相关搜索 3`
              ]);
          }
      }, 200); // 200ms debounce

      return () => {
          if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      };
  }, [query, searchEngine]);

  // Handle click outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (formRef.current && !formRef.current.contains(event.target as Node)) {
              setIsFocused(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const getSearchUrl = (q: string) => {
    switch (searchEngine) {
      case 'bing': return `https://www.bing.com/search?q=${encodeURIComponent(q)}`;
      case 'baidu': return `https://www.baidu.com/s?wd=${encodeURIComponent(q)}`;
      case 'google':
      default: return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    }
  };

  const getPlaceholder = () => {
    switch (searchEngine) {
      case 'bing': return '搜索 Bing';
      case 'baidu': return '搜索 百度';
      case 'google':
      default: return '搜索 Google';
    }
  };

  const handleSearch = (e: FormEvent, text: string = query) => {
    e.preventDefault();
    if (text.trim()) {
      // Local storage fallback saving
      if (typeof chrome === 'undefined' || !chrome.history) {
          const newRecent = [text, ...recentSearches.filter(s => s !== text)].slice(0, 8);
          setRecentSearches(newRecent);
          localStorage.setItem('zen-recent-searches', JSON.stringify(newRecent));
      }

      window.location.href = getSearchUrl(text);
    }
  };

  const deleteRecent = (e: React.MouseEvent, item: string) => {
      e.stopPropagation();
      // Deleting from history API is complex (need to delete URL), maybe just hide from list for now?
      // Or search history for this query and delete all matching URLs.
      // For simplicity in this interaction, let's just remove from state.
      // If we want to persist deletion in history, we'd need to find the URLs.
      // Let's assume user just wants to hide it from this list.
      const newRecent = recentSearches.filter(s => s !== item);
      setRecentSearches(newRecent);
      
      // Also update local storage if fallback
      if (typeof chrome === 'undefined' || !chrome.history) {
          localStorage.setItem('zen-recent-searches', JSON.stringify(newRecent));
      }
  };

  const toggleEngine = () => {
      const engines: SearchEngine[] = ['google', 'bing', 'baidu'];
      const nextIndex = (engines.indexOf(searchEngine) + 1) % engines.length;
      setSearchEngine(engines[nextIndex]);
  };

  const currentEngineName = () => {
      switch (searchEngine) {
        case 'bing': return 'Bing';
        case 'baidu': return '百度';
        case 'google': default: return 'Google';
      }
  };

  const showDropdown = isFocused && (recentSearches.length > 0 || suggestions.length > 0);

  return (
    <form 
        ref={formRef}
        onSubmit={(e) => handleSearch(e)} 
        className="w-full h-full relative group z-50 flex items-center"
    >
      <div className={`w-full h-full relative z-50 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl transition-all duration-200 ${showDropdown ? 'rounded-b-none border-b-0 bg-zinc-900/80' : 'shadow-lg'}`}>
          <button 
            type="button"
            className="absolute inset-y-0 left-0 pl-5 pr-4 flex items-center justify-center cursor-pointer text-white/70 hover:text-white transition-colors focus:outline-none rounded-l-full z-10 h-full"
            onClick={toggleEngine}
            title={`切换搜索引擎 (当前: ${currentEngineName()})`}
            aria-label={`切换搜索引擎，当前为 ${currentEngineName()}`}
          >
            <div className="flex items-center justify-center w-6 h-6">
                {searchEngine === 'google' && <GoogleIcon />}
                {searchEngine === 'bing' && <BingIcon />}
                {searchEngine === 'baidu' && <BaiduIcon />}
            </div>
            
            {/* Vertical Divider */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-px bg-white/20"></div>
          </button>
          
          <input
            type="text"
            value={query}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={getPlaceholder()}
            className="w-full h-full py-0 pl-[4.5rem] pr-6 bg-transparent border-none text-white placeholder-white/60 focus:outline-none transition-all text-lg rounded-3xl"
          />
          
          <div className="absolute top-0 right-2 h-full flex items-center">
            {query && (
                <button
                    type="button"
                    onClick={() => { setQuery(''); setSuggestions([]); }}
                    className="p-2 text-white/40 hover:text-white transition-colors rounded-full hover:bg-white/10"
                    title="清空"
                >
                    <X size={18} />
                </button>
            )}
            <button 
                type="submit"
                className="p-2 text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/10 hover:scale-105 active:scale-95"
                aria-label="搜索"
            >
                <SearchIcon size={20} />
            </button>
          </div>
      </div>

      {/* Dropdown Suggestions */}
      {showDropdown && (
          <div 
            className="absolute top-full left-0 right-0 bg-zinc-900/95 backdrop-blur-xl border border-t-0 border-white/10 rounded-b-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-in z-[100]"
            onContextMenu={(e) => e.preventDefault()}
          >
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                {/* Suggestions (Live) */}
                {suggestions.length > 0 && (
                    <div className="mb-2 border-b border-white/5 pb-2">
                        {suggestions.map((item, idx) => (
                            <div 
                                key={`sug-${idx}`} 
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 rounded-xl cursor-pointer text-zinc-200 hover:text-white transition-colors"
                                onClick={() => handleSearch({ preventDefault: () => {} } as any, item)}
                            >
                                <SearchIcon size={16} className="text-zinc-500 flex-shrink-0" />
                                <span className="flex-1 truncate" dangerouslySetInnerHTML={{ __html: item.replace(query, `<b>${query}</b>`) }}></span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Recent Searches (History) */}
                {recentSearches.length > 0 && (
                    <div className="mb-2">
                        <div className="px-4 py-2 text-xs text-zinc-500 font-medium flex justify-between items-center">
                            <span>历史记录</span>
                        </div>
                        {recentSearches.map((item, idx) => (
                            <div 
                                key={`hist-${idx}`} 
                                className="group flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 rounded-xl cursor-pointer text-zinc-400 hover:text-white transition-colors"
                                onClick={() => handleSearch({ preventDefault: () => {} } as any, item)}
                            >
                                <Clock size={16} className="text-zinc-600 group-hover:text-zinc-400 flex-shrink-0" />
                                <span className="flex-1 truncate">{item}</span>
                                <button 
                                    onClick={(e) => deleteRecent(e, item)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded-full transition-all text-zinc-500 hover:text-white"
                                    title="从列表中移除"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
              </div>
              
              <div className="p-2 border-t border-white/5 bg-black/20 backdrop-blur-sm">
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); if (chrome.tabs) chrome.tabs.create({ url: 'chrome://history' }); }}
                    className="block text-center text-xs text-blue-400 hover:text-blue-300 py-1.5 font-medium transition-colors"
                  >
                      管理搜索历史记录
                  </a>
              </div>
          </div>
      )}
    </form>
  );
};
