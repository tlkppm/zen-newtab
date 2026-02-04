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
  
  // Check for updates
  if (request.type === 'CHECK_UPDATE') {
    const currentVersion = chrome.runtime.getManifest().version;
    console.log('[BG] CHECK_UPDATE - Current version:', currentVersion);
    fetch('https://api.github.com/repos/tlkppm/zen-newtab/releases/latest')
      .then(res => {
        console.log('[BG] GitHub API response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('[BG] GitHub API data:', data);
        const latestVersion = data.tag_name?.replace('v', '') || currentVersion;
        const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;
        console.log('[BG] Latest version:', latestVersion, 'Has update:', hasUpdate);
        sendResponse({
          hasUpdate,
          currentVersion,
          latestVersion,
          releaseUrl: data.html_url || '',
          releaseNotes: data.body || '',
          publishedAt: data.published_at || ''
        });
      })
      .catch((err) => {
        console.error('[BG] CHECK_UPDATE error:', err);
        sendResponse({ hasUpdate: false, currentVersion, error: '检查更新失败' });
      });
    return true;
  }
  
  if (request.type === 'DEEPSEEK_CHAT') {
    const { question, system } = request;
    const url = 'https://yunzhiapi.cn/API/depsek3.2.php';
    
    const formData = new URLSearchParams();
    formData.append('question', question);
    formData.append('type', 'text');
    if (system) {
      formData.append('system', system);
    }
    
    (async () => {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString()
        });
        const text = await res.text();
        sendResponse({ success: true, data: { result: text } });
      } catch (err) {
        console.error('[BG] DEEPSEEK_CHAT error:', err);
        sendResponse({ success: false, error: err.message || 'Request failed' });
      }
    })();
    return true;
  }

  if (request.type === 'WEB_SEARCH') {
    const query = request.query;
    const encodedQuery = encodeURIComponent(query);
    
    fetch(`https://html.duckduckgo.com/html/?q=${encodedQuery}`, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'zh-CN,zh;q=0.9'
      }
    })
      .then(res => res.text())
      .then(html => {
        const results = [];
        
        const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
        const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/g;
        
        const links = [];
        let match;
        while ((match = resultRegex.exec(html)) !== null && links.length < 5) {
          let url = match[1];
          if (url.startsWith('//duckduckgo.com/l/?')) {
            const uddgMatch = url.match(/uddg=([^&]+)/);
            if (uddgMatch) url = decodeURIComponent(uddgMatch[1]);
          }
          if (url.startsWith('http') && !url.includes('duckduckgo.com')) {
            links.push({ url, title: match[2].trim() });
          }
        }
        
        const snippets = [];
        while ((match = snippetRegex.exec(html)) !== null && snippets.length < 5) {
          snippets.push(match[1].replace(/<[^>]+>/g, '').trim().slice(0, 150));
        }
        
        for (let i = 0; i < links.length; i++) {
          results.push({
            title: links[i].title,
            url: links[i].url,
            snippet: snippets[i] || ''
          });
        }
        
        if (results.length === 0) {
          results.push({
            title: `未找到结果，请尝试其他关键词`,
            url: `https://www.bing.com/search?q=${encodedQuery}`,
            snippet: `搜索: ${query}`
          });
        }
        
        console.log('[BG] WEB_SEARCH results:', results);
        sendResponse({ results });
      })
      .catch(err => {
        console.error('[BG] WEB_SEARCH error:', err);
        sendResponse({ 
          results: [{
            title: `搜索失败: ${query}`,
            url: `https://www.bing.com/search?q=${encodedQuery}`,
            snippet: `错误: ${err.message}`
          }]
        });
      });
    return true;
  }

  if (request.type === 'FETCH_URL') {
    fetch(request.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      },
      mode: 'cors',
      credentials: 'omit'
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(html => {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim().replace(/&[^;]+;/g, '') : '';
        
        const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        const description = metaDesc ? metaDesc[1].trim() : '';
        
        let content = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<nav[\s\S]*?<\/nav>/gi, '')
          .replace(/<header[\s\S]*?<\/header>/gi, '')
          .replace(/<footer[\s\S]*?<\/footer>/gi, '')
          .replace(/<aside[\s\S]*?<\/aside>/gi, '')
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&[^;]+;/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 8000);
        
        sendResponse({ 
          success: true, 
          content: `标题: ${title}\n${description ? `描述: ${description}\n` : ''}\n内容:\n${content}` 
        });
      })
      .catch(err => {
        console.error('[BG] FETCH_URL error:', err);
        sendResponse({ 
          success: false, 
          content: `无法获取 ${request.url} 的内容。\n错误: ${err.message}\n\n请直接访问链接查看。`,
          error: err.message 
        });
      });
    return true;
  }
  
  return false;
});

// Version comparison helper
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

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
