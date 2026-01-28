import { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, Plus, Code, Eye, FileCode, Palette, Zap, GitBranch } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useStore, CustomWidget } from '../store/useStore';
import { useToastStore } from '../store/useToastStore';
import { BlueprintEditor } from './BlueprintEditor';

interface WidgetEditorProps {
  onClose: () => void;
}

export const WidgetEditor = ({ onClose }: WidgetEditorProps) => {
  const { customWidgets, addCustomWidget, updateCustomWidget, removeCustomWidget } = useStore();
  const { addToast, confirm } = useToastStore();
  const [selectedWidget, setSelectedWidget] = useState<CustomWidget | null>(null);
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [name, setName] = useState('');
  const [html, setHtml] = useState('');
  const [css, setCss] = useState('');
  const [js, setJs] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [editorMode, setEditorMode] = useState<'code' | 'blueprint'>('code');
  const [errors, setErrors] = useState<{ line: number; message: string }[]>([]);
  const previewRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (selectedWidget) {
      setName(selectedWidget.name);
      setHtml(selectedWidget.html);
      setCss(selectedWidget.css);
      setJs(selectedWidget.js);
    }
  }, [selectedWidget]);

  const handleNew = () => {
    setSelectedWidget(null);
    setName('新组件');
    setHtml('<div class="widget">\n  <h3>我的组件</h3>\n  <p>在此编写 HTML</p>\n</div>');
    setCss('.widget {\n  padding: 16px;\n  color: white;\n  text-align: center;\n}\n\n.widget h3 {\n  margin: 0 0 8px 0;\n  font-size: 16px;\n}\n\n.widget p {\n  margin: 0;\n  opacity: 0.7;\n  font-size: 14px;\n}');
    setJs('');
    setActiveTab('html');
  };

  const handleSave = () => {
    if (!name.trim()) return;
    
    if (selectedWidget) {
      updateCustomWidget(selectedWidget.id, { name, html, css, js });
      addToast({ type: 'success', message: '组件已保存' });
    } else {
      const newWidget: CustomWidget = {
        id: `w_${Date.now()}`,
        name,
        html,
        css,
        js,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      addCustomWidget(newWidget);
      setSelectedWidget(newWidget);
      addToast({ type: 'success', message: '组件已创建' });
    }
  };

  const handleDelete = async () => {
    if (selectedWidget && await confirm('确定删除此组件？')) {
      removeCustomWidget(selectedWidget.id);
      setSelectedWidget(null);
      setName('');
      setHtml('');
      setCss('');
      setJs('');
      addToast({ type: 'success', message: '组件已删除' });
    }
  };

  const handlePreview = () => {
    setIsPreview(!isPreview);
  };

  const getPreviewContent = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            background: transparent; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          ${css}
        </style>
      </head>
      <body>
        ${html}
        <script>${js}</script>
      </body>
      </html>
    `;
  };

  const tabs = [
    { id: 'html' as const, label: 'HTML', icon: FileCode },
    { id: 'css' as const, label: 'CSS', icon: Palette },
    { id: 'js' as const, label: 'JS', icon: Zap },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Code size={20} className="text-blue-400" />
            <h2 className="text-white font-medium">自定义组件编辑器</h2>
            <div className="flex items-center bg-zinc-800 rounded-lg p-0.5 ml-4">
              <button
                onClick={() => setEditorMode('code')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-colors ${
                  editorMode === 'code' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Code size={12} />
                代码模式
              </button>
              <button
                onClick={() => setEditorMode('blueprint')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-colors ${
                  editorMode === 'blueprint' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <GitBranch size={12} />
                蓝图模式
              </button>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-56 border-r border-white/10 flex flex-col">
            <div className="p-3 border-b border-white/10">
              <button
                onClick={handleNew}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
              >
                <Plus size={16} />
                新建组件
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {customWidgets.length === 0 ? (
                <div className="text-zinc-500 text-sm text-center py-8">
                  暂无自定义组件
                </div>
              ) : (
                <div className="space-y-1">
                  {customWidgets.map(w => (
                    <button
                      key={w.id}
                      onClick={() => setSelectedWidget(w)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedWidget?.id === w.id
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {w.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {(selectedWidget || name) ? (
              <>
                <div className="flex items-center gap-4 px-4 py-3 border-b border-white/10">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="组件名称"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePreview}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        isPreview ? 'bg-green-600 text-white' : 'bg-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Eye size={14} />
                      预览
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
                    >
                      <Save size={14} />
                      保存
                    </button>
                    {selectedWidget && (
                      <button
                        onClick={handleDelete}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-sm rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {editorMode === 'code' ? (
                  <>
                    <div className="flex items-center border-b border-white/10">
                      {tabs.map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => { setActiveTab(tab.id); setErrors([]); }}
                          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors border-b-2 ${
                            activeTab === tab.id
                              ? 'text-blue-400 border-blue-400'
                              : 'text-zinc-400 border-transparent hover:text-white'
                          }`}
                        >
                          <tab.icon size={14} />
                          {tab.label}
                        </button>
                      ))}
                      {errors.length > 0 && (
                        <div className="ml-auto mr-3 flex items-center gap-1.5 text-red-400 text-xs">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          {errors.length} 个错误
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                      <div className={`flex-1 ${isPreview ? 'w-1/2' : 'w-full'}`}>
                        <Editor
                          height="100%"
                          language={activeTab === 'html' ? 'html' : activeTab === 'css' ? 'css' : 'javascript'}
                          value={activeTab === 'html' ? html : activeTab === 'css' ? css : js}
                          onChange={(value) => {
                            if (activeTab === 'html') setHtml(value || '');
                            else if (activeTab === 'css') setCss(value || '');
                            else setJs(value || '');
                          }}
                          onValidate={(markers) => {
                            const newErrors = markers
                              .filter(m => m.severity >= 4)
                              .map(m => ({ line: m.startLineNumber, message: m.message }));
                            setErrors(newErrors);
                          }}
                          theme="vs-dark"
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: 'on',
                            wordWrap: 'on',
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                            padding: { top: 12 },
                            tabSize: 2,
                            folding: true,
                            suggestOnTriggerCharacters: true,
                            quickSuggestions: true,
                          }}
                        />
                      </div>
                      {isPreview && (
                        <div className="w-1/2 border-l border-white/10 bg-zinc-800/50">
                          <div className="p-2 border-b border-white/10 text-xs text-zinc-500">
                            预览
                          </div>
                          <iframe
                            ref={previewRef}
                            srcDoc={getPreviewContent()}
                            className="w-full h-full border-0"
                            sandbox="allow-scripts"
                          />
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1">
                    <BlueprintEditor 
                      onGenerateCode={(genHtml, genCss, genJs) => {
                        setHtml(genHtml);
                        setCss(genCss);
                        setJs(genJs);
                      }} 
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500">
                <div className="text-center">
                  <Code size={48} className="mx-auto mb-4 opacity-30" />
                  <p>选择一个组件或创建新组件</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const CustomWidgetRenderer = ({ widget }: { widget: CustomWidget }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          background: transparent; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
        }
        ${widget.css}
      </style>
    </head>
    <body>
      ${widget.html}
      <script>${widget.js}</script>
    </body>
    </html>
  `;

  return (
    <iframe
      ref={iframeRef}
      srcDoc={content}
      className="w-full h-full border-0 bg-transparent"
      sandbox="allow-scripts"
    />
  );
};
