// Service Worker for handling APIs not available in new tab page context

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Search suggestions
  if (request.type === 'GET_SUGGESTIONS') {
    const { query, engine } = request;
    console.log('[BG] GET_SUGGESTIONS:', query, engine);
    if (!query) {
      sendResponse({ suggestions: [] });
      return false;
    }
    
    let url = '';
    switch (engine) {
      case 'bing':
        url = `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(query)}`;
        break;
      case 'baidu':
        url = `https://www.baidu.com/sugrec?prod=pc&wd=${encodeURIComponent(query)}`;
        break;
      case 'google':
      default:
        url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}`;
        break;
    }
    
    console.log('[BG] Fetching:', url);
    fetch(url)
      .then(res => {
        console.log('[BG] Response status:', res.status);
        return engine === 'baidu' ? res.json() : res.text();
      })
      .then(data => {
        console.log('[BG] Raw data:', data);
        let suggestions = [];
        if (engine === 'baidu') {
          if (data.g && Array.isArray(data.g)) {
            suggestions = data.g.map(item => item.q);
          }
        } else {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          suggestions = parsed[1] || [];
        }
        console.log('[BG] Parsed suggestions:', suggestions);
        sendResponse({ suggestions: suggestions.slice(0, 8) });
      })
      .catch((err) => {
        console.error('[BG] Fetch error:', err);
        sendResponse({ suggestions: [] });
      });
    return true;
  }

  // Extension management
  if (request.type === 'GET_EXTENSIONS') {
    chrome.management.getAll((extensions) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ extensions: extensions || [] });
      }
    });
    return true;
  }
  
  if (request.type === 'SET_EXTENSION_ENABLED') {
    chrome.management.setEnabled(request.id, request.enabled, () => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true });
      }
    });
    return true;
  }
  
  if (request.type === 'UNINSTALL_EXTENSION') {
    chrome.management.get(request.id, (extInfo) => {
      const extName = extInfo?.name || 'Extension';
      const extIcon = extInfo?.icons?.[extInfo.icons.length - 1]?.url || 'icon48.png';
      
      chrome.management.uninstall(request.id, { showConfirmDialog: true }, () => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          chrome.management.get(request.id, (info) => {
            if (chrome.runtime.lastError) {
              chrome.notifications.create(`uninstall-${request.id}`, {
                type: 'basic',
                iconUrl: extIcon,
                title: '扩展已卸载',
                message: `${extName} 已成功卸载`,
                priority: 1
              });
            }
            sendResponse({ success: true });
          });
        }
      });
    });
    return true;
  }
  
  if (request.type === 'GET_SELF_ID') {
    sendResponse({ id: chrome.runtime.id });
    return false;
  }
});

// Download completion notification
chrome.downloads?.onChanged?.addListener((delta) => {
  if (delta.state?.current === 'complete') {
    chrome.downloads.search({ id: delta.id }, (results) => {
      if (results && results.length > 0) {
        const item = results[0];
        const filename = item.filename.split(/[/\\]/).pop() || 'Unknown file';
        
        // Use extension icon (Downloads API doesn't provide app icons)
        const iconUrl = chrome.runtime.getURL('icon128.png');
        
        chrome.notifications.create(`download-${delta.id}`, {
          type: 'basic',
          iconUrl: iconUrl,
          title: '下载完成',
          message: filename,
          priority: 1
        });
      }
    });
  }
});
