import { useEffect, useState } from 'react';
import { Folder, ChevronRight, Home, ArrowLeft, FolderOpen } from 'lucide-react';
import { useStore } from '../store/useStore';

interface BookmarkNode {
  id: string;
  parentId?: string;
  index?: number;
  url?: string;
  title: string;
  dateAdded?: number;
  dateGroupModified?: number;
  children?: BookmarkNode[];
}

export const Bookmarks = () => {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentFolderTitle, setCurrentFolderTitle] = useState<string>('收藏夹栏');
  const [folderHistory, setFolderHistory] = useState<{id: string, title: string}[]>([]);
  const [displayNodes, setDisplayNodes] = useState<BookmarkNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const { bookmarkIconSize } = useStore();

  const loadFolderContents = (folderId: string) => {
    setIsLoading(true);
    
    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
      chrome.bookmarks.getChildren(folderId, (children) => {
        console.log('Loaded folder contents for', folderId, ':', children);
        setDisplayNodes(children || []);
        setIsLoading(false);
      });
    } else {
      // Mock data for development
      const mockData: { [key: string]: BookmarkNode[] } = {
        '1': [
          { id: '11', title: 'GitHub', url: 'https://github.com' },
          { id: '12', title: 'Stack Overflow', url: 'https://stackoverflow.com' },
          { id: '13', title: '学习资料' },
        ],
        '13': [
          { id: '131', title: 'React Docs', url: 'https://react.dev' },
          { id: '132', title: 'MDN', url: 'https://developer.mozilla.org' },
        ],
        '2': [
          { id: '21', title: 'Bilibili', url: 'https://bilibili.com' },
          { id: '22', title: 'YouTube', url: 'https://youtube.com' },
        ],
      };
      setDisplayNodes(mockData[folderId] || []);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 从根节点开始，显示所有顶级文件夹（收藏夹栏 + 其他收藏夹）
    if (typeof chrome !== 'undefined' && chrome.bookmarks) {
      chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        console.log('Bookmark tree:', bookmarkTreeNodes);
        if (bookmarkTreeNodes && bookmarkTreeNodes.length > 0) {
          const rootNode = bookmarkTreeNodes[0];
          console.log('Root node children:', rootNode.children);
          
          // 使用根节点 ID，显示所有顶级文件夹
          setCurrentFolderId(rootNode.id);
          setCurrentFolderTitle('全部收藏夹');
          
          // 直接使用根节点的子节点作为显示内容
          if (rootNode.children && rootNode.children.length > 0) {
            setDisplayNodes(rootNode.children);
          }
          setIsLoading(false);
        }
        setIsInitialized(true);
      });
    } else {
      // Mock data for development
      setCurrentFolderId('0');
      setCurrentFolderTitle('全部收藏夹');
      setDisplayNodes([
        { id: '1', title: '收藏夹栏' },
        { id: '2', title: '其他收藏夹' },
      ]);
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  const handleFolderClick = (folder: BookmarkNode) => {
      if (currentFolderId) {
        setFolderHistory(prev => [...prev, { id: currentFolderId, title: currentFolderTitle }]);
      }
      setCurrentFolderId(folder.id);
      setCurrentFolderTitle(folder.title);
      loadFolderContents(folder.id);
  };

  const handleBack = () => {
      if (folderHistory.length === 0) return;
      const prev = folderHistory[folderHistory.length - 1];
      setFolderHistory(prevHistory => prevHistory.slice(0, -1));
      setCurrentFolderId(prev.id);
      setCurrentFolderTitle(prev.title);
      
      // 如果返回到根节点，需要重新获取根节点的子节点
      if (prev.id === '0') {
        if (typeof chrome !== 'undefined' && chrome.bookmarks) {
          chrome.bookmarks.getTree((tree) => {
            if (tree && tree[0] && tree[0].children) {
              setDisplayNodes(tree[0].children);
            }
            setIsLoading(false);
          });
        }
      } else {
        loadFolderContents(prev.id);
      }
  };

  const isAtRoot = folderHistory.length === 0;

  // Size configuration
  const sizeConfig = {
    small: { 
      grid: 'grid-cols-[repeat(auto-fill,minmax(80px,1fr))]',
      iconContainer: 'w-12 h-12 rounded-xl',
      iconSize: 'w-6 h-6',
      folderIconSize: 20,
      gap: 'gap-4',
      fontSize: 'text-[10px]'
    },
    medium: { 
      grid: 'grid-cols-[repeat(auto-fill,minmax(100px,1fr))]',
      iconContainer: 'w-16 h-16 rounded-2xl',
      iconSize: 'w-8 h-8',
      folderIconSize: 28,
      gap: 'gap-6',
      fontSize: 'text-xs'
    },
    large: { 
      grid: 'grid-cols-[repeat(auto-fill,minmax(120px,1fr))]',
      iconContainer: 'w-20 h-20 rounded-2xl',
      iconSize: 'w-10 h-10',
      folderIconSize: 36,
      gap: 'gap-8',
      fontSize: 'text-sm'
    }
  };

  const currentSize = sizeConfig[bookmarkIconSize || 'medium'];

  return (
    <div className="w-full h-full p-6 transition-all duration-300 overflow-y-auto custom-scrollbar">
       <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-3">
             {/* Back Button */}
             {!isAtRoot && (
                 <button 
                    onClick={handleBack}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-md"
                    title="返回上一级"
                >
                     <ArrowLeft size={18} />
                 </button>
             )}
             
             {/* Title / Breadcrumb Pill */}
             <div className="flex items-center text-white/90 text-sm font-medium backdrop-blur-md px-4 py-2 rounded-full bg-white/10 border border-white/10 shadow-lg">
                {isAtRoot ? <Home size={16} className="mr-2" /> : <FolderOpen size={16} className="mr-2 text-yellow-400" />}
                <span className="truncate max-w-[200px]">{currentFolderTitle}</span>
             </div>
         </div>
       </div>
       
       {/* Loading State */}
       {isLoading && (
           <div className="flex items-center justify-center py-20 text-white/50">
               <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mr-3"></div>
               <span className="text-sm">加载中...</span>
           </div>
       )}
       
       {/* Main Grid Area */}
       {!isLoading && <div className={`grid ${currentSize.grid} ${currentSize.gap} animate-fade-in pb-10`}>
         {displayNodes.map(node => {
             if (node.url) {
                 return (
                    <a 
                        key={node.id} 
                        href={node.url} 
                        className="group flex flex-col items-center gap-3 transition-all hover:-translate-y-1 duration-300"
                        title={node.title + '\n' + node.url}
                    >
                        <div className={`${currentSize.iconContainer} bg-white/10 backdrop-blur-md flex items-center justify-center shadow-lg group-hover:bg-white/20 group-hover:shadow-xl transition-all border border-white/5 group-hover:border-white/20`}>
                             <img 
                                src={typeof chrome !== 'undefined' && chrome.runtime 
                                    ? `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(node.url)}&size=32`
                                    : `https://favicon.im/${new URL(node.url).hostname}`}
                                alt={node.title} 
                                className={`${currentSize.iconSize} rounded-sm`}
                                onError={(e) => { 
                                    const img = e.target as HTMLImageElement;
                                    if (!img.dataset.fallback) {
                                        img.dataset.fallback = '1';
                                        img.src = `https://favicon.im/${new URL(node.url).hostname}`;
                                    } else {
                                        img.style.display = 'none';
                                    }
                                }} 
                             />
                        </div>
                        <span className={`text-white/70 ${currentSize.fontSize} truncate w-full text-center group-hover:text-white transition-colors px-1`}>{node.title}</span>
                    </a>
                 );
             } else {
                 // Folder item
                 return (
                    <div 
                        key={node.id} 
                        onClick={() => handleFolderClick(node)}
                        className="group flex flex-col items-center gap-3 cursor-pointer transition-all hover:-translate-y-1 duration-300"
                        title={`进入文件夹: ${node.title}`}
                    >
                        <div className={`${currentSize.iconContainer} bg-yellow-500/10 backdrop-blur-md flex items-center justify-center shadow-lg group-hover:bg-yellow-500/20 group-hover:shadow-xl transition-all border border-yellow-500/20 group-hover:border-yellow-500/40`}>
                            <Folder size={currentSize.folderIconSize} className="text-yellow-400 group-hover:text-yellow-300" />
                        </div>
                        <span className={`text-white/70 ${currentSize.fontSize} truncate w-full text-center group-hover:text-white font-medium px-1`}>{node.title}</span>
                    </div>
                 );
             }
         })}
       </div>}
       
       {/* If empty */}
       {!isLoading && displayNodes.length === 0 && (
           <div className="flex flex-col items-center justify-center py-10 text-white/50">
               <FolderOpen size={32} className="mb-2 opacity-50" />
               <span className="text-sm">此文件夹为空</span>
           </div>
       )}
    </div>
  );
};
