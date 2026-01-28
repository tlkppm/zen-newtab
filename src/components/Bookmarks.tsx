import { useEffect, useState } from 'react';
import { Folder, ChevronRight, Home, ArrowLeft, FolderOpen } from 'lucide-react';

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

  return (
    <div className="w-full h-full p-2 transition-all duration-300 overflow-y-auto custom-scrollbar">
       <div className="flex items-center justify-between mb-2">
         <div className="flex items-center gap-2">
             {/* Back Button */}
             {!isAtRoot && (
                 <button 
                    onClick={handleBack}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors mr-1"
                    title="返回上一级"
                >
                     <ArrowLeft size={14} />
                 </button>
             )}
             
             {/* Title / Breadcrumb */}
             <div className="flex items-center text-white/90 text-sm font-medium backdrop-blur-sm px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                {isAtRoot ? <Home size={14} className="mr-1" /> : <FolderOpen size={14} className="mr-1 text-yellow-400" />}
                <span className="truncate max-w-[150px]">{currentFolderTitle}</span>
             </div>
         </div>
       </div>
       
       {/* Loading State */}
       {isLoading && (
           <div className="flex items-center justify-center py-10 text-white/50">
               <div className="animate-spin w-6 h-6 border-2 border-white/20 border-t-white rounded-full mr-3"></div>
               <span className="text-sm">加载中...</span>
           </div>
       )}
       
       {/* Main Grid Area */}
       {!isLoading && <div className="grid grid-cols-[repeat(auto-fill,minmax(70px,1fr))] gap-2 animate-fade-in">
         {displayNodes.map(node => {
             if (node.url) {
                 return (
                    <a 
                        key={node.id} 
                        href={node.url} 
                        className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/10 transition-all hover:scale-105 duration-200 relative"
                        title={node.title + '\n' + node.url}
                    >
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg group-hover:bg-white/30 transition-colors">
                             <img 
                                src={typeof chrome !== 'undefined' && chrome.runtime 
                                    ? `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(node.url)}&size=32`
                                    : `https://favicon.im/${new URL(node.url).hostname}`}
                                alt={node.title} 
                                className="w-6 h-6 rounded-sm"
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
                        <span className="text-white/80 text-xs truncate w-full text-center group-hover:text-white">{node.title}</span>
                    </a>
                 );
             } else {
                 // Folder item
                 return (
                    <div 
                        key={node.id} 
                        onClick={() => handleFolderClick(node)}
                        className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-white/10 transition-all cursor-pointer hover:scale-105 duration-200"
                        title={`进入文件夹: ${node.title}`}
                    >
                        <div className="w-10 h-10 bg-yellow-500/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg group-hover:bg-yellow-500/30 transition-colors border border-yellow-500/30">
                            <Folder size={20} className="text-yellow-200 group-hover:text-yellow-100" />
                        </div>
                        <span className="text-white/80 text-xs truncate w-full text-center group-hover:text-white font-medium">{node.title}</span>
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
