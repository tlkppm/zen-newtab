import { useState, useEffect } from 'react';
import { Code, Braces, Terminal, Play, Copy, Check, Clock } from 'lucide-react';

type ToolMode = 'json' | 'js' | 'timestamp';

export const DevTools = () => {
  const [mode, setMode] = useState<ToolMode>('json');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Timestamp tool state
  const [tsNow, setTsNow] = useState(Date.now());
  const [tsInput, setTsInput] = useState('');

  useEffect(() => {
      if (mode === 'timestamp') {
          const interval = setInterval(() => setTsNow(Date.now()), 1000);
          return () => clearInterval(interval);
      }
  }, [mode]);

  const handleFormatJSON = () => {
    try {
      if (!input.trim()) {
          setOutput('');
          setError(null);
          return;
      }
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleRunJS = () => {
    try {
      // Very basic eval, mainly for calculation or simple logic
      // Note: CSP might block 'eval'. If so, we can't do this easily without 'unsafe-eval'.
      // But for a "New Tab" extension with proper CSP in manifest, it might work or we use Function constructor.
      // Let's try Function constructor which is slightly safer but still eval-like.
      
      // Capture console.log
      let logs: string[] = [];
      const mockConsole = {
          log: (...args: any[]) => logs.push(args.map(a => String(a)).join(' ')),
          error: (...args: any[]) => logs.push('Error: ' + args.map(a => String(a)).join(' ')),
          warn: (...args: any[]) => logs.push('Warn: ' + args.map(a => String(a)).join(' '))
      };

      const func = new Function('console', `
        try {
            ${input}
        } catch(e) {
            throw e;
        }
      `);
      
      const result = func(mockConsole);
      
      let outputText = '';
      if (logs.length > 0) {
          outputText += 'Logs:\n' + logs.join('\n') + '\n\n';
      }
      if (result !== undefined) {
          outputText += 'Result:\n' + String(result);
      } else if (logs.length === 0) {
          outputText += 'Executed successfully (No output)';
      }
      
      setOutput(outputText);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col text-sm">
        {/* Toolbar */}
        <div className="flex items-center gap-1 mb-4 bg-zinc-800/50 p-1 rounded-lg border border-zinc-700/50 self-start">
            <button 
                onClick={() => setMode('json')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${mode === 'json' ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
                <Braces size={14} />
                <span>JSON</span>
            </button>
            <button 
                onClick={() => setMode('js')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${mode === 'js' ? 'bg-yellow-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
                <Terminal size={14} />
                <span>JS Runner</span>
            </button>
            <button 
                onClick={() => setMode('timestamp')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${mode === 'timestamp' ? 'bg-green-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
                <Clock size={14} />
                <span>Timestamp</span>
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-zinc-900/50 rounded-xl border border-white/10 overflow-hidden backdrop-blur-md">
            {mode === 'timestamp' ? (
                <div className="p-6 space-y-8 flex flex-col items-center justify-center h-full">
                    <div className="text-center">
                        <div className="text-zinc-400 text-xs uppercase tracking-widest mb-2">当前时间戳 (ms)</div>
                        <div className="text-4xl font-mono text-white font-bold tracking-tight select-all">{tsNow}</div>
                        <div className="text-zinc-500 mt-1 font-mono">{new Date(tsNow).toLocaleString('zh-CN')}</div>
                    </div>
                    
                    <div className="w-full max-w-md space-y-4">
                        <div className="h-px bg-white/10 w-full" />
                        <div className="space-y-2">
                             <label className="text-zinc-400 text-xs">转换时间戳</label>
                             <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={tsInput}
                                    onChange={(e) => setTsInput(e.target.value)}
                                    placeholder="输入时间戳..."
                                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white font-mono focus:border-green-500 focus:outline-none"
                                />
                             </div>
                             {tsInput && (
                                 <div className="bg-zinc-800/50 p-3 rounded border border-zinc-700/50 text-green-400 font-mono text-center">
                                     {!isNaN(Number(tsInput)) ? new Date(Number(tsInput)).toLocaleString('zh-CN') : '无效的时间戳'}
                                 </div>
                             )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex h-full divide-x divide-white/10">
                    {/* Input */}
                    <div className="flex-1 flex flex-col">
                        <div className="px-4 py-2 border-b border-white/10 text-xs text-zinc-500 font-medium uppercase flex justify-between items-center">
                            <span>Input ({mode.toUpperCase()})</span>
                            {mode === 'js' && (
                                <button 
                                    onClick={handleRunJS}
                                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-[10px] transition-colors"
                                >
                                    <Play size={10} />
                                    RUN
                                </button>
                            )}
                            {mode === 'json' && (
                                <button 
                                    onClick={handleFormatJSON}
                                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-[10px] transition-colors"
                                >
                                    <Code size={10} />
                                    FORMAT
                                </button>
                            )}
                        </div>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={mode === 'json' ? 'Paste JSON here...' : 'console.log("Hello World");'}
                            className="flex-1 bg-transparent p-4 text-zinc-300 font-mono text-xs resize-none focus:outline-none custom-scrollbar"
                            spellCheck={false}
                        />
                    </div>

                    {/* Output */}
                    <div className="flex-1 flex flex-col bg-black/20">
                         <div className="px-4 py-2 border-b border-white/10 text-xs text-zinc-500 font-medium uppercase flex justify-between items-center">
                            <span>Output</span>
                            {output && (
                                <button 
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
                                >
                                    {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                                </button>
                            )}
                        </div>
                        <div className="flex-1 relative overflow-auto custom-scrollbar">
                            {error ? (
                                <div className="absolute inset-0 p-4 text-red-400 font-mono text-xs whitespace-pre-wrap">
                                    {error}
                                </div>
                            ) : (
                                <pre className="absolute inset-0 p-4 text-green-400/90 font-mono text-xs whitespace-pre-wrap">
                                    {output}
                                </pre>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};
