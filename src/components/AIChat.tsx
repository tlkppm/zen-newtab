import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Paperclip, Mic, Globe, MicOff, FileText, Image, Loader2, Trash2, Copy, Check, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';

const CodeBlock = ({ code, language }: { code: string; language?: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="relative group my-2 rounded-lg overflow-hidden bg-zinc-900 border border-white/10">
            <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800/50 border-b border-white/5">
                <span className="text-[10px] text-zinc-500 uppercase">{language || 'code'}</span>
                <button onClick={handleCopy} className="p-1 text-zinc-500 hover:text-white transition-colors">
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
            </div>
            <pre className="p-3 overflow-x-auto text-xs"><code className="text-zinc-300">{code}</code></pre>
        </div>
    );
};

const renderMessageContent = (content: string) => {
    const parts: React.ReactNode[] = [];
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    let key = 0;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            parts.push(<span key={key++}>{content.slice(lastIndex, match.index)}</span>);
        }
        parts.push(<CodeBlock key={key++} language={match[1]} code={match[2].trim()} />);
        lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < content.length) {
        parts.push(<span key={key++}>{content.slice(lastIndex)}</span>);
    }
    
    return parts.length > 0 ? parts : content;
};


interface Attachment {
    id: string;
    type: 'image' | 'text';
    name: string;
    content: string;
    preview?: string;
}

interface ToolCall {
    name: string;
    arguments: Record<string, unknown>;
    status: 'running' | 'done' | 'error';
    result?: string;
}

interface Message {
    id: number;
    role: 'user' | 'ai';
    content: string;
    time: string;
    attachments?: Attachment[];
    searchResults?: { title: string; url: string; snippet: string }[];
    toolCalls?: ToolCall[];
}

const AVAILABLE_TOOLS = [
    { name: 'web_search', description: '联网搜索获取最新信息', params: ['query'] },
    { name: 'fetch_url', description: '获取网页内容', params: ['url'] },
];

const parseToolCalls = (content: string): { text: string; tools: ToolCall[] } => {
    const tools: ToolCall[] = [];
    let text = content;
    
    const toolBlockRegex = /```tool\n([\s\S]*?)```/g;
    let match;
    while ((match = toolBlockRegex.exec(content)) !== null) {
        try {
            const parsed = JSON.parse(match[1]);
            if (parsed.name && parsed.arguments) {
                tools.push({ name: parsed.name, arguments: parsed.arguments, status: 'running' });
            }
        } catch {}
    }
    text = text.replace(toolBlockRegex, '').trim();
    
    const jsonPatterns = [
        /\{\s*"name"\s*:\s*"([^"]+)"\s*,\s*"arguments"\s*:\s*(\{[^}]+\})\s*\}/g,
        /\{\s*['"]name['"]\s*:\s*['"]([^'"]+)['"]\s*,\s*['"]arguments['"]\s*:\s*(\{[^}]+\})\s*\}/g
    ];
    
    for (const regex of jsonPatterns) {
        let m;
        while ((m = regex.exec(text)) !== null) {
            try {
                const name = m[1];
                const argsStr = m[2].replace(/'/g, '"');
                const args = JSON.parse(argsStr);
                if (name && args && !tools.some(t => t.name === name)) {
                    tools.push({ name, arguments: args, status: 'running' });
                }
                text = text.replace(m[0], '').trim();
            } catch (e) {
                console.error('Tool parse error:', e, m[0]);
            }
        }
    }
    
    return { text, tools };
};

const MAX_CONTEXT_TOKENS = 128000;
const COMPRESS_THRESHOLD = 0.7;

const estimateTokens = (text: string): number => {
    return Math.ceil(text.length / 2);
};

const compressMessages = (msgs: Message[]): Message[] => {
    if (msgs.length <= 4) return msgs;
    const systemMsg = msgs[0];
    const recentMsgs = msgs.slice(-4);
    const middleMsgs = msgs.slice(1, -4);
    const summary = middleMsgs.map(m => 
        `${m.role === 'user' ? '用户' : 'AI'}: ${m.content.slice(0, 100)}${m.content.length > 100 ? '...' : ''}`
    ).join('\n');
    const compressedMsg: Message = {
        id: Date.now(),
        role: 'ai',
        content: `[历史对话摘要]\n${summary}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    return [systemMsg, compressedMsg, ...recentMsgs];
};

const INITIAL_MESSAGE: Message = { 
    id: 1, 
    role: 'ai', 
    content: '你好！我是 DeepSeek AI 助手。有什么我可以帮你的吗？', 
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
};

export const AIChat = () => {
    const { aiConfig, setAiConfig } = useStore();
    const [input, setInput] = useState('');
    const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
    const [contextUsage, setContextUsage] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [conversationHistory, setConversationHistory] = useState<{role: string; content: string}[]>([]);
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);

    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);

    useEffect(() => {
        const chromeAny = typeof chrome !== 'undefined' ? chrome as any : null;
        if (chromeAny?.identity?.getProfileUserInfo) {
            try {
                chromeAny.identity.getProfileUserInfo({ accountStatus: 'ANY' }, (info: any) => {
                    if (chromeAny.runtime?.lastError) return;
                    if (info?.email) {
                        const emailHash = btoa(info.email.toLowerCase().trim());
                        setUserAvatar(`https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=80`);
                    }
                });
            } catch {}
        }
    }, []);

    const handleNewChat = useCallback(() => {
        setMessages([{ ...INITIAL_MESSAGE, id: Date.now(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        setConversationHistory([]);
        setAttachments([]);
        setInput('');
        setContextUsage(0);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const totalText = conversationHistory.map(h => h.content).join('');
        const tokens = estimateTokens(totalText);
        const usage = Math.min(100, Math.round((tokens / MAX_CONTEXT_TOKENS) * 100));
        setContextUsage(usage);
        
        if (usage > COMPRESS_THRESHOLD * 100 && messages.length > 6) {
            setMessages(prev => compressMessages(prev));
            setConversationHistory(prev => {
                if (prev.length <= 6) return prev;
                const recent = prev.slice(-6);
                const older = prev.slice(0, -6);
                const summary = older.map(h => `${h.role}: ${h.content.slice(0, 50)}`).join('; ');
                return [{ role: 'system', content: `[摘要] ${summary}` }, ...recent];
            });
        }
    }, [conversationHistory, messages.length]);

    const startSpeechRecognition = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('您的浏览器不支持语音识别功能');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'zh-CN';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => setIsRecording(false);
        recognition.onerror = () => setIsRecording(false);

        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                .map((result: any) => result[0].transcript)
                .join('');
            setInput(prev => prev + transcript);
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, []);

    const stopSpeechRecognition = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setIsRecording(false);
    }, []);

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            const isImage = file.type.startsWith('image/');

            reader.onload = (event) => {
                const content = event.target?.result as string;
                const newAttachment: Attachment = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    type: isImage ? 'image' : 'text',
                    name: file.name,
                    content: isImage ? content : content,
                    preview: isImage ? content : undefined,
                };
                setAttachments(prev => [...prev, newAttachment]);
            };

            if (isImage) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
        });

        e.target.value = '';
    }, []);

    const removeAttachment = useCallback((id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    }, []);

    const performWebSearch = async (query: string): Promise<{ title: string; url: string; snippet: string }[]> => {
        const doSearch = async (): Promise<{ title: string; url: string; snippet: string }[]> => {
            if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
                try {
                    const response = await new Promise<any>((resolve, reject) => {
                        chrome.runtime.sendMessage({ type: 'WEB_SEARCH', query }, (res) => {
                            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                            else resolve(res);
                        });
                    });
                    const results = response?.results || [];
                    const validResults = results.filter((r: any) => 
                        r.url && !r.url.includes('bing.com/search') && !r.url.includes('google.com/search')
                    );
                    if (validResults.length > 0) return validResults;
                } catch (err) {
                    console.error('WEB_SEARCH via background failed:', err);
                }
            }
            
            try {
                const encodedQuery = encodeURIComponent(query);
                const searxUrls = [
                    `https://searx.be/search?q=${encodedQuery}&format=json`,
                    `https://search.sapti.me/search?q=${encodedQuery}&format=json`
                ];
                
                for (const apiUrl of searxUrls) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 5000);
                        const response = await fetch(apiUrl, { 
                            headers: { 'Accept': 'application/json' },
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);
                        
                        if (!response.ok) continue;
                        const data = await response.json();
                        
                        if (data.results && data.results.length > 0) {
                            const validResults = data.results
                                .slice(0, 5)
                                .filter((r: any) => r.url && !r.url.includes('/search?'))
                                .map((r: any) => ({
                                    title: r.title || query,
                                    url: r.url,
                                    snippet: (r.content || r.snippet || '').slice(0, 150)
                                }));
                            if (validResults.length > 0) return validResults;
                        }
                    } catch {
                        continue;
                    }
                }
            } catch (err) {
                console.error('Searx API failed:', err);
            }
            
            return [{ 
                title: `搜索: ${query}`, 
                url: `https://www.bing.com/search?q=${encodeURIComponent(query)}`, 
                snippet: `未能获取搜索结果，请点击链接手动搜索` 
            }];
        };
        
        return doSearch();
    };

    const callDeepSeekAPI = async (question: string, context?: string): Promise<string> => {
        if (aiConfig.useCustomApi && aiConfig.apiKey) {
            const response = await fetch(aiConfig.apiEndpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${aiConfig.apiKey}`
                },
                body: JSON.stringify({
                    model: aiConfig.model || 'deepseek-chat',
                    temperature: aiConfig.temperature || 0.7,
                    max_tokens: aiConfig.maxTokens || 2000,
                    messages: [
                        ...(aiConfig.systemPrompt ? [{ role: 'system', content: aiConfig.systemPrompt }] : []),
                        ...(context ? [{ role: 'system', content: context }] : []),
                        { role: 'user', content: question }
                    ],
                    stream: false
                })
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data.choices?.[0]?.message?.content || data.result || JSON.stringify(data);
        }
        
        const url = 'https://yunzhiapi.cn/API/depsek3.2.php';
        const formData = new URLSearchParams();
        formData.append('question', question);
        formData.append('type', 'text');
        
        let combinedSystem = context || '';
        if (aiConfig.systemPrompt) {
            combinedSystem = `${aiConfig.systemPrompt}\n\n${combinedSystem}`;
        }
        
        if (combinedSystem) {
            formData.append('system', combinedSystem);
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.text();
    };

    const fetchUrlContent = async (url: string): Promise<string> => {
        if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
            return `[网页链接] ${url}\n\n请点击上方链接查看完整内容。开发环境不支持直接获取网页内容。`;
        }
        
        try {
            const response = await new Promise<any>((resolve, reject) => {
                chrome.runtime.sendMessage({ type: 'FETCH_URL', url }, (res) => {
                    if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                    else resolve(res);
                });
            });
            return response?.content || `[网页链接] ${url}\n无法获取内容，请直接访问链接。`;
        } catch {
            return `[网页链接] ${url}\n获取失败，请直接访问链接。`;
        }
    };

    const executeTool = async (tool: ToolCall): Promise<ToolCall> => {
        try {
            switch (tool.name) {
                case 'web_search': {
                    const query = tool.arguments.query as string;
                    const results = await performWebSearch(query);
                    return {
                        ...tool,
                        status: 'done',
                        result: results.length > 0 
                            ? results.map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}`).join('\n\n')
                            : '未找到相关结果'
                    };
                }
                case 'fetch_url': {
                    const url = tool.arguments.url as string;
                    const content = await fetchUrlContent(url);
                    return { ...tool, status: 'done', result: content.slice(0, 5000) };
                }
                default:
                    return { ...tool, status: 'error', result: `未知工具: ${tool.name}` };
            }
        } catch (e: any) {
            return { ...tool, status: 'error', result: e.message || '执行失败' };
        }
    };

    const typeWriter = async (text: string, messageId: number) => {
        const chars = text.split('');
        let current = '';
        for (let i = 0; i < chars.length; i++) {
            current += chars[i];
            setMessages(prev => prev.map(m => 
                m.id === messageId ? { ...m, content: current } : m
            ));
            await new Promise(r => setTimeout(r, 15));
        }
        setMessages(prev => prev.map(m => 
            m.id === messageId ? { ...m, content: text } : m
        ));
    };

    const handleSend = async () => {
        if (!input.trim() && attachments.length === 0) return;
        
        const currentAttachments = [...attachments];
        const userInput = input;
        
        const newMessage: Message = {
            id: Date.now(),
            role: 'user',
            content: userInput,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
        };
        
        setMessages(prev => [...prev, newMessage]);
        setConversationHistory(prev => [...prev, { role: 'user', content: userInput }]);
        setInput('');
        setAttachments([]);
        setIsLoading(true);


        let attachmentContext = '';
        if (currentAttachments.length > 0) {
            attachmentContext = currentAttachments
                .filter(a => a.type === 'text')
                .map(a => `[附件: ${a.name}]\n${a.content}`)
                .join('\n\n');
        }

        const historyContext = conversationHistory.slice(-10).map(h => 
            `${h.role === 'user' ? '用户' : 'AI'}: ${h.content}`
        ).join('\n');

        const toolsDescription = `## 可用工具

你可以通过输出特定格式来调用工具。当需要使用工具时，输出如下格式：
\`\`\`tool
{"name": "工具名", "arguments": {"参数名": "参数值"}}
\`\`\`

### 工具列表
- **web_search**: 联网搜索。参数: query (简短精准的搜索关键词)
- **fetch_url**: 获取网页内容。参数: url (必须是搜索结果中返回的具体网页URL)

### 重要规则
1. web_search 会返回多个搜索结果，每个结果包含标题、URL和摘要
2. 如果需要详细信息，从搜索结果中选择一个具体的网页URL使用fetch_url获取
3. **禁止**对搜索引擎页面(如bing.com/search、google.com/search)使用fetch_url
4. 搜索关键词要简洁，如"2024春节放假安排"而不是完整句子
5. 通常搜索结果的摘要已足够回答问题，无需每次都fetch_url`;

        const now = new Date();
        const dateInfo = `[当前时间] ${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
        const contextInfo = `${dateInfo}\n[当前状态] 上下文使用: ${contextUsage}%，对话轮次: ${Math.floor(conversationHistory.length / 2)}`;
        
        const basePrompt = aiConfig.systemPrompt || '你是「静谧新标签页」浏览器扩展的 AI 助手。这是一个 Chrome/Edge 新标签页扩展，提供极简美观的新标签页体验。请用中文回答。代码请使用 ```language 代码块格式。';
        
        const systemPrompt = [
            basePrompt,
            contextInfo,
            isWebSearchEnabled ? toolsDescription : '',
            attachmentContext ? `[用户上传的文件]\n${attachmentContext}` : '',
            historyContext ? `[对话历史]\n${historyContext}` : ''
        ].filter(Boolean).join('\n\n');

        try {
            let currentQuestion = userInput;
            let maxIterations = 8;
            const aiMsgId = Date.now() + 1;
            
            setMessages(prev => [...prev, {
                id: aiMsgId,
                role: 'ai',
                content: '',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                toolCalls: [],
            }]);
            
            while (maxIterations > 0) {
                maxIterations--;
                const aiResponse = await callDeepSeekAPI(currentQuestion, systemPrompt);
                const { text, tools } = parseToolCalls(aiResponse);
                
                if (tools.length === 0) {
                    const finalText = text || aiResponse;
                    if (!finalText.trim()) {
                        setMessages(prev => prev.map(m => 
                            m.id === aiMsgId ? { ...m, content: '[AI 响应被截断，请简化问题或重试]' } : m
                        ));
                    } else {
                        await typeWriter(finalText, aiMsgId);
                    }
                    setIsLoading(false);
                    setConversationHistory(prev => [...prev, { role: 'assistant', content: finalText }]);
                    break;
                }
                
                const executedTools: ToolCall[] = [];
                for (const tool of tools) {
                    setMessages(prev => prev.map(m => 
                        m.id === aiMsgId 
                            ? { ...m, toolCalls: [...(m.toolCalls || []), { ...tool, status: 'running' as const }] }
                            : m
                    ));
                    
                    setIsSearching(true);
                    const result = await executeTool(tool);
                    executedTools.push(result);
                    
                    setMessages(prev => prev.map(m => {
                        if (m.id !== aiMsgId) return m;
                        const updatedCalls = (m.toolCalls || []).map(t => 
                            t.name === tool.name && t.status === 'running' ? result : t
                        );
                        return { ...m, toolCalls: updatedCalls };
                    }));
                }
                setIsSearching(false);
                
                const toolResults = executedTools.map(t => 
                    `工具 "${t.name}" 执行结果:\n${t.result || '无输出'}`
                ).join('\n\n');
                
                currentQuestion = `[工具执行结果]\n${toolResults}\n\n请基于以上工具结果继续回答用户的问题。如果信息已经足够，请直接回答，不要继续调用工具。`;
                
                if (maxIterations === 1) {
                    currentQuestion += '\n\n[系统提示] 这是最后一次工具调用机会，请直接基于已有信息回答用户。';
                }
            }
        } catch (error: any) {
            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.role === 'ai' && !lastMsg.content) {
                    return prev.map(m => 
                        m.id === lastMsg.id 
                            ? { ...m, content: `请求失败: ${error.message || '未知错误'}` }
                            : m
                    );
                }
                return [...prev, {
                    id: Date.now() + 1,
                    role: 'ai',
                    content: `请求失败: ${error.message || '未知错误'}`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                }];
            });
        } finally {
            setIsLoading(false);
            setIsSearching(false);
        }
    };

    return (
        <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-500 h-[75vh]">
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden h-full flex flex-col shadow-2xl">
                {/* Header */}
                <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-white/5" data-ai-header>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center ring-1 ring-blue-500/30">
                            <Bot size={16} className="text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-medium text-sm">DeepSeek AI</h3>
                            <p className="text-zinc-500 text-[10px]">Powered by DeepSeek-3.2</p>
                        </div>
                    </div>

                    {/* Context Indicator & New Chat */}
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${contextUsage > 80 ? 'bg-red-500' : 'bg-green-500'}`} />
                                上下文 {contextUsage}%
                            </div>
                            <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-500 ${contextUsage > 80 ? 'bg-red-500' : 'bg-blue-500'}`}
                                    style={{ width: `${contextUsage}%` }}
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handleNewChat}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            title="新建会话"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                </div>

                {/* Message List */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar" data-ai-message-list>
                    {messages.map((msg) => (
                        <div 
                            key={msg.id} 
                            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                            data-ai-message-item={msg.role}
                        >
                            {/* Avatar */}
                            {msg.role === 'ai' ? (
                                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30">
                                    <Bot size={20} />
                                </div>
                            ) : userAvatar ? (
                                <img src={userAvatar} alt="User" className="w-10 h-10 rounded-full flex-shrink-0 shadow-lg object-cover" />
                            ) : (
                                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg bg-zinc-700 text-zinc-300">
                                    <User size={20} />
                                </div>
                            )}

                            {/* Bubble */}
                            <div className={`flex flex-col gap-1 max-w-[80%] min-w-0 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {msg.attachments.map(att => (
                                            <div key={att.id} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-700/50 rounded-lg text-xs text-zinc-300">
                                                {att.type === 'image' ? <Image size={14} /> : <FileText size={14} />}
                                                <span className="max-w-[100px] truncate">{att.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {msg.toolCalls && msg.toolCalls.length > 0 && (
                                    <div className="mb-2 p-3 bg-zinc-900/50 border border-white/5 rounded-xl">
                                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 mb-2">
                                            <Globe size={12} />
                                            <span>工具调用</span>
                                        </div>
                                        <div className="space-y-2">
                                            {msg.toolCalls.map((tool, idx) => (
                                                <div key={idx} className="p-2 bg-zinc-800/50 rounded-lg">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <span className={`w-2 h-2 rounded-full ${tool.status === 'done' ? 'bg-green-500' : tool.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                                        <span className="text-blue-400 font-medium">{tool.name}</span>
                                                        <span className="text-zinc-600">
                                                            {tool.name === 'web_search' && `"${tool.arguments.query}"`}
                                                            {tool.name === 'fetch_url' && `${(tool.arguments.url as string)?.slice(0, 30)}...`}
                                                        </span>
                                                    </div>
                                                    {tool.result && (
                                                        <div className="mt-1 text-[10px] text-zinc-500 max-h-20 overflow-y-auto">
                                                            {tool.result.slice(0, 200)}{tool.result.length > 200 ? '...' : ''}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {msg.searchResults && msg.searchResults.length > 0 && (
                                    <div className="mb-2 p-3 bg-zinc-900/50 border border-white/5 rounded-xl">
                                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 mb-2">
                                            <Search size={12} />
                                            <span>联网搜索结果</span>
                                        </div>
                                        <div className="space-y-2">
                                            {msg.searchResults.slice(0, 3).map((result, idx) => (
                                                <a 
                                                    key={idx}
                                                    href={result.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block p-2 bg-zinc-800/50 hover:bg-zinc-700/50 rounded-lg transition-colors"
                                                >
                                                    <div className="text-xs text-blue-400 font-medium truncate">{result.title}</div>
                                                    <div className="text-[10px] text-zinc-500 truncate">{result.snippet}</div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className={`px-6 py-4 rounded-3xl text-sm leading-relaxed shadow-md overflow-hidden break-words ${
                                    msg.role === 'ai' 
                                        ? 'bg-zinc-800/80 text-zinc-200 rounded-tl-none border border-white/5' 
                                        : 'bg-blue-600 text-white rounded-tr-none whitespace-pre-wrap'
                                }`}>
                                    <div className="max-w-full overflow-x-auto">
                                        {msg.role === 'ai' ? renderMessageContent(msg.content) : msg.content}
                                    </div>
                                </div>
                                <span className="text-[10px] text-zinc-600 px-2">{msg.time}</span>
                            </div>
                        </div>
                    ))}
                    {isSearching && (
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                            <Loader2 size={16} className="animate-spin" />
                            正在联网搜索...
                        </div>
                    )}
                    {isLoading && !isSearching && (
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30">
                                <Bot size={20} />
                            </div>
                            <div className="px-6 py-4 rounded-3xl rounded-tl-none bg-zinc-800/80 border border-white/5 flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin text-blue-400" />
                                <span className="text-zinc-400 text-sm">正在思考...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-white/10 bg-zinc-900/50" data-ai-input-area>
                    <input 
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.txt,.md,.json,.js,.ts,.tsx,.jsx,.css,.html,.py"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    
                    {attachments.length > 0 && (
                        <div className="max-w-4xl mx-auto mb-3 flex flex-wrap gap-2">
                            {attachments.map(att => (
                                <div key={att.id} className="flex items-center gap-2 px-3 py-2 bg-zinc-800/80 border border-white/10 rounded-xl text-sm text-zinc-300 group">
                                    {att.type === 'image' ? (
                                        <img src={att.preview} alt={att.name} className="w-8 h-8 rounded object-cover" />
                                    ) : (
                                        <FileText size={16} className="text-blue-400" />
                                    )}
                                    <span className="max-w-[120px] truncate">{att.name}</span>
                                    <button 
                                        onClick={() => removeAttachment(att.id)}
                                        className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div className="max-w-4xl mx-auto relative bg-zinc-800/50 border border-white/10 rounded-2xl overflow-hidden focus-within:ring-1 focus-within:ring-blue-500/50 transition-all shadow-lg">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder={isRecording ? "正在录音..." : "输入消息..."}
                            className="w-full bg-transparent text-white text-sm p-4 min-h-[60px] max-h-[200px] resize-none focus:outline-none custom-scrollbar"
                            data-ai-input
                        />
                        
                        <div className="flex items-center justify-between px-3 pb-3">
                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-white/5 transition-colors" 
                                    title="上传文件"
                                >
                                    <Paperclip size={18} />
                                </button>
                                <button 
                                    onClick={isRecording ? stopSpeechRecognition : startSpeechRecognition}
                                    className={`p-2 rounded-lg transition-colors ${
                                        isRecording 
                                            ? 'text-red-400 bg-red-600/10 animate-pulse' 
                                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                    }`}
                                    title={isRecording ? "停止录音" : "语音输入"}
                                >
                                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                                </button>
                                <button 
                                    onClick={() => setIsWebSearchEnabled(!isWebSearchEnabled)}
                                    className={`p-2 rounded-lg transition-colors ${
                                        isWebSearchEnabled 
                                            ? 'text-blue-400 bg-blue-600/10' 
                                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                    }`} 
                                    title={isWebSearchEnabled ? "已开启联网搜索" : "开启联网搜索"}
                                >
                                    <Globe size={18} />
                                </button>
                            </div>
                            <button  
                                onClick={handleSend}
                                disabled={!input.trim() && attachments.length === 0}
                                className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl transition-all shadow-md"
                                data-ai-send-btn
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="text-center mt-3">
                        <p className="text-[10px] text-zinc-600">AI 可能生成不准确的信息，请核对重要事实。</p>
                    </div>
                </div>
            </div>
        </div>
    );
};