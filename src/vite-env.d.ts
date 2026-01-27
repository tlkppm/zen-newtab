/// <reference types="vite/client" />

declare global {
  const chrome: {
    bookmarks?: {
      getTree: (callback: (results: chrome.bookmarks.BookmarkTreeNode[]) => void) => void;
      getChildren: (id: string, callback: (results: chrome.bookmarks.BookmarkTreeNode[]) => void) => void;
    };
    history?: {
      search: (query: { text: string; startTime?: number; endTime?: number; maxResults?: number }, callback: (results: chrome.history.HistoryItem[]) => void) => void;
      deleteUrl: (details: { url: string }, callback?: () => void) => void;
    };
    tabs?: {
      query: (queryInfo: chrome.tabs.QueryInfo, callback: (result: chrome.tabs.Tab[]) => void) => void;
      update: (tabId: number, updateProperties: { muted?: boolean; active?: boolean }, callback?: (tab?: chrome.tabs.Tab) => void) => void;
      create: (createProperties: { url?: string; active?: boolean }) => void;
    };
    scripting?: {
      executeScript: <T>(injection: chrome.scripting.ScriptInjection) => Promise<chrome.scripting.InjectionResult<T>[]>;
    };
    runtime?: {
      lastError?: { message?: string };
      id?: string;
      sendMessage: (message: any, callback?: (response: any) => void) => void;
    };
    notifications?: {
      create: (notificationId: string, options: chrome.notifications.NotificationOptions, callback?: (notificationId: string) => void) => void;
    };
    management?: {
      getAll: (callback: (result: chrome.management.ExtensionInfo[]) => void) => void;
      setEnabled: (id: string, enabled: boolean, callback?: () => void) => void;
      uninstall: (id: string, options?: { showConfirmDialog?: boolean }, callback?: () => void) => void;
      onInstalled?: { addListener: (callback: (info: chrome.management.ExtensionInfo) => void) => void };
      onUninstalled?: { addListener: (callback: (id: string) => void) => void };
      onEnabled?: { addListener: (callback: (info: chrome.management.ExtensionInfo) => void) => void };
      onDisabled?: { addListener: (callback: (info: chrome.management.ExtensionInfo) => void) => void };
    };
    downloads?: {
      onChanged: { addListener: (callback: (delta: chrome.downloads.DownloadDelta) => void) => void };
      search: (query: chrome.downloads.DownloadQuery, callback: (results: chrome.downloads.DownloadItem[]) => void) => void;
    };
  };
}

declare namespace chrome {
  namespace bookmarks {
    interface BookmarkTreeNode {
      id: string;
      parentId?: string;
      index?: number;
      url?: string;
      title: string;
      dateAdded?: number;
      dateGroupModified?: number;
      children?: BookmarkTreeNode[];
    }
  }
  namespace history {
    interface HistoryItem {
      id: string;
      url?: string;
      title?: string;
      lastVisitTime?: number;
      visitCount?: number;
    }
  }
  namespace tabs {
    interface QueryInfo {
      active?: boolean;
      audible?: boolean;
      currentWindow?: boolean;
      url?: string | string[];
    }
    interface Tab {
      id?: number;
      url?: string;
      title?: string;
      favIconUrl?: string;
      audible?: boolean;
      mutedInfo?: {
        muted: boolean;
      };
    }
  }
  namespace scripting {
    interface ScriptInjection {
      target: { tabId: number };
      func: (...args: any[]) => any;
      args?: any[];
    }
    interface InjectionResult<T> {
      result: T;
    }
  }
  namespace notifications {
    interface NotificationOptions {
      type: 'basic' | 'image' | 'list' | 'progress';
      iconUrl: string;
      title: string;
      message: string;
      contextMessage?: string;
      priority?: number;
      eventTime?: number;
      buttons?: { title: string; iconUrl?: string }[];
      imageUrl?: string;
      items?: { title: string; message: string }[];
      progress?: number;
      requireInteraction?: boolean;
      silent?: boolean;
    }
  }
  namespace management {
    interface ExtensionInfo {
      id: string;
      name: string;
      shortName: string;
      description: string;
      version: string;
      enabled: boolean;
      icons?: { size: number; url: string }[];
      installType: string;
      type: string;
      homepageUrl?: string;
    }
  }
  namespace downloads {
    interface DownloadDelta {
      id: number;
      url?: { current?: string };
      filename?: { current?: string };
      state?: { previous?: string; current?: string };
      error?: { current?: string };
    }
    interface DownloadQuery {
      id?: number;
      query?: string[];
      startedBefore?: number;
      startedAfter?: number;
      limit?: number;
      orderBy?: string[];
    }
    interface DownloadItem {
      id: number;
      url: string;
      filename: string;
      state: string;
      bytesReceived: number;
      totalBytes: number;
      mime: string;
      startTime: string;
      endTime?: string;
      error?: string;
    }
  }
}

export {}
