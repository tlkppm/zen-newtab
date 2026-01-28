import { useState, useRef, useEffect } from 'react';
import { Copy, Check, Code, Hash, ArrowRightLeft, Palette, Type } from 'lucide-react';
import { useToastStore } from '../store/useToastStore';

type Tab = 'json' | 'base64' | 'color';

export const DevUtils = () => {
  const [activeTab, setActiveTab] = useState<Tab>('json');
  const { addToast } = useToastStore();

  // JSON State
  const [jsonInput, setJsonInput] = useState('');
  
  // Base64 State
  const [base64Input, setBase64Input] = useState('');
  const [base64Mode, setBase64Mode] = useState<'encode' | 'decode'>('encode');

  // Color State
  const [colorInput, setColorInput] = useState('#000000');
  const [colorOutput, setColorOutput] = useState<{ hex: string; rgb: string; hsl: string } | null>(null);

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
      addToast({ type: 'success', message: 'JSON formatted' });
    } catch (e) {
      addToast({ type: 'error', message: 'Invalid JSON' });
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed));
      addToast({ type: 'success', message: 'JSON minified' });
    } catch (e) {
      addToast({ type: 'error', message: 'Invalid JSON' });
    }
  };

  const processBase64 = () => {
    try {
      if (base64Mode === 'encode') {
        setBase64Input(btoa(base64Input));
      } else {
        setBase64Input(atob(base64Input));
      }
      addToast({ type: 'success', message: `Base64 ${base64Mode}d` });
    } catch (e) {
      addToast({ type: 'error', message: 'Invalid input' });
    }
  };

  const processColor = (val: string) => {
    setColorInput(val);
    // Simple hex to rgb/hsl
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      const r = parseInt(val.slice(1, 3), 16);
      const g = parseInt(val.slice(3, 5), 16);
      const b = parseInt(val.slice(5, 7), 16);
      
      const rgb = `rgb(${r}, ${g}, ${b})`;
      
      // HSL calc
      const r1 = r / 255;
      const g1 = g / 255;
      const b1 = b / 255;
      const max = Math.max(r1, g1, b1);
      const min = Math.min(r1, g1, b1);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r1: h = (g1 - b1) / d + (g1 < b1 ? 6 : 0); break;
          case g1: h = (b1 - r1) / d + 2; break;
          case b1: h = (r1 - g1) / d + 4; break;
        }
        h /= 6;
      }
      const hsl = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
      
      setColorOutput({ hex: val, rgb, hsl });
    } else {
        setColorOutput(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden text-white shadow-xl">
      <div className="flex border-b border-white/10 p-1 bg-white/5">
        <button onClick={() => setActiveTab('json')} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${activeTab === 'json' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
          <Code size={12} /> JSON
        </button>
        <button onClick={() => setActiveTab('base64')} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${activeTab === 'base64' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
          <Type size={12} /> Base64
        </button>
        <button onClick={() => setActiveTab('color')} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${activeTab === 'color' ? 'bg-pink-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
          <Palette size={12} /> Color
        </button>
      </div>

      <div className="flex-1 p-3 overflow-hidden flex flex-col">
        {activeTab === 'json' && (
          <div className="flex flex-col h-full gap-2">
            <textarea
              className="flex-1 w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs font-mono resize-none focus:outline-none focus:border-blue-500/50 text-zinc-300 placeholder:text-zinc-600 custom-scrollbar"
              placeholder="Paste JSON here..."
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={formatJson} className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs py-1.5 rounded border border-blue-500/20 transition-colors">Format</button>
              <button onClick={minifyJson} className="flex-1 bg-zinc-700/20 hover:bg-zinc-700/30 text-zinc-400 text-xs py-1.5 rounded border border-white/10 transition-colors">Minify</button>
            </div>
          </div>
        )}

        {activeTab === 'base64' && (
          <div className="flex flex-col h-full gap-2">
            <div className="flex bg-black/20 rounded-lg p-1 border border-white/5">
                <button onClick={() => setBase64Mode('encode')} className={`flex-1 py-1 rounded text-[10px] ${base64Mode === 'encode' ? 'bg-white/10 text-white' : 'text-zinc-500'}`}>Encode</button>
                <button onClick={() => setBase64Mode('decode')} className={`flex-1 py-1 rounded text-[10px] ${base64Mode === 'decode' ? 'bg-white/10 text-white' : 'text-zinc-500'}`}>Decode</button>
            </div>
            <textarea
              className="flex-1 w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs font-mono resize-none focus:outline-none focus:border-purple-500/50 text-zinc-300 placeholder:text-zinc-600 custom-scrollbar"
              placeholder={base64Mode === 'encode' ? "Text to encode..." : "Base64 to decode..."}
              value={base64Input}
              onChange={(e) => setBase64Input(e.target.value)}
            />
            <button onClick={processBase64} className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-xs py-1.5 rounded border border-purple-500/20 transition-colors">
                Process
            </button>
          </div>
        )}

        {activeTab === 'color' && (
          <div className="flex flex-col h-full gap-3">
            <div className="flex gap-2 items-center">
                <div 
                    className="w-10 h-10 rounded-lg border border-white/10 shadow-inner shrink-0" 
                    style={{ backgroundColor: colorInput }}
                />
                <input 
                    type="text" 
                    value={colorInput}
                    onChange={(e) => processColor(e.target.value)}
                    className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-pink-500/50 focus:outline-none"
                    placeholder="#000000"
                />
            </div>
            
            {colorOutput ? (
                <div className="space-y-2">
                    <div className="bg-black/20 rounded-lg p-2 border border-white/5 flex justify-between items-center group">
                        <span className="text-[10px] text-zinc-500">HEX</span>
                        <span className="text-xs font-mono text-zinc-300 select-all">{colorOutput.hex}</span>
                        <Copy size={12} className="text-zinc-600 cursor-pointer hover:text-white" onClick={() => { navigator.clipboard.writeText(colorOutput.hex); addToast({type:'success', message:'Copied'}); }} />
                    </div>
                    <div className="bg-black/20 rounded-lg p-2 border border-white/5 flex justify-between items-center group">
                        <span className="text-[10px] text-zinc-500">RGB</span>
                        <span className="text-xs font-mono text-zinc-300 select-all">{colorOutput.rgb}</span>
                        <Copy size={12} className="text-zinc-600 cursor-pointer hover:text-white" onClick={() => { navigator.clipboard.writeText(colorOutput.rgb); addToast({type:'success', message:'Copied'}); }} />
                    </div>
                    <div className="bg-black/20 rounded-lg p-2 border border-white/5 flex justify-between items-center group">
                        <span className="text-[10px] text-zinc-500">HSL</span>
                        <span className="text-xs font-mono text-zinc-300 select-all">{colorOutput.hsl}</span>
                        <Copy size={12} className="text-zinc-600 cursor-pointer hover:text-white" onClick={() => { navigator.clipboard.writeText(colorOutput.hsl); addToast({type:'success', message:'Copied'}); }} />
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-zinc-600">
                    Invalid Hex Color
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
