import { useState, useEffect } from 'react';
import { Search, Clock, Calendar, Globe, Trash2, Code, Terminal, ChevronRight, ChevronDown } from 'lucide-react';

interface HistoryItem {
  id: string;
  url?: string;
  title?: string;
  lastVisitTime?: number;
  visitCount?: number;
}

interface GroupedHistory {
  date: string;
  items: HistoryItem[];
}

export const HistoryViewer = () => {
  const [historyGroups, setHistoryGroups] = useState<GroupedHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [maxResults, setMaxResults] = useState(100);

  useEffect(() => {
    fetchHistory();
  }, [searchTerm, maxResults]);

  const fetchHistory = () => {
    if (typeof chrome === 'undefined' || !chrome.history) {
        // Mock data
        const mockItems: HistoryItem[] = Array.from({ length: 20 }).map((_, i) => ({
            id: i.toString(),
            title: `Mock Page Title ${i}`,
            url: `https://example.com/page/${i}`,
            lastVisitTime: Date.now() - i * 3600000 * 5, // Spread over time
            visitCount: 1
        }));
        groupItems(mockItems);
        return;
    }

    chrome.history.search({
      text: searchTerm,
      maxResults: maxResults,
      startTime: 0 
    }, (results) => {
      groupItems(results);
    });
  };

  const groupItems = (items: HistoryItem[]) => {
    const groups: { [key: string]: HistoryItem[] } = {};
    
    items.forEach(item => {
        if (!item.lastVisitTime) return;
        const date = new Date(item.lastVisitTime).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(item);
    });

    const groupedArray = Object.keys(groups).map(date => ({
        date,
        items: groups[date].sort((a, b) => (b.lastVisitTime || 0) - (a.lastVisitTime || 0))
    }));

    setHistoryGroups(groupedArray);
    // Expand the first date by default
    if (groupedArray.length > 0) {
        setExpandedDates(new Set([groupedArray[0].date]));
    }
  };

  const toggleDate = (date: string) => {
      setExpandedDates(prev => {
          const next = new Set(prev);
          if (next.has(date)) next.delete(date);
          else next.add(date);
          return next;
      });
  };

  const formatTime = (timestamp?: number) => {
      if (!timestamp) return '';
      return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const handleDelete = (url?: string) => {
      if (!url || !chrome.history) return;
      chrome.history.deleteUrl({ url }, () => {
          fetchHistory();
      });
  };

  return (
    <div className="w-full h-full flex flex-col">
        {/* Search Bar */}
        <div className="flex items-center gap-2 bg-zinc-800/50 p-2 rounded-lg mb-4 border border-zinc-700/50">
            <Search size={16} className="text-zinc-400" />
            <input 
                type="text" 
                placeholder="搜索历史记录..." 
                className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-zinc-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {historyGroups.length === 0 ? (
                <div className="text-center text-zinc-500 py-10 text-sm">暂无历史记录</div>
            ) : (
                <div className="space-y-4">
                    {historyGroups.map(group => (
                        <div key={group.date} className="animate-fade-in">
                            <div 
                                className="flex items-center gap-2 text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2 cursor-pointer hover:text-zinc-200 transition-colors select-none"
                                onClick={() => toggleDate(group.date)}
                            >
                                {expandedDates.has(group.date) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                <Calendar size={12} />
                                {group.date}
                                <span className="ml-auto text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">{group.items.length}</span>
                            </div>
                            
                            {expandedDates.has(group.date) && (
                                <div className="space-y-1 ml-1 border-l border-zinc-800 pl-2">
                                    {group.items.map(item => (
                                        <div key={item.id} className="group flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors text-sm">
                                            <span className="text-zinc-500 font-mono text-xs whitespace-nowrap">{formatTime(item.lastVisitTime)}</span>
                                            
                                            <div className="flex-1 min-w-0">
                                                <a href={item.url} target="_blank" rel="noreferrer" className="block text-zinc-300 hover:text-blue-400 truncate transition-colors" title={item.title}>
                                                    {item.title || item.url}
                                                </a>
                                                <div className="text-zinc-600 text-xs truncate font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                                                    {item.url}
                                                </div>
                                            </div>

                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.url); }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-all"
                                                title="删除记录"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};
