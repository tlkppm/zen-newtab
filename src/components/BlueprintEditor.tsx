import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Trash2, Plus, ZoomIn, ZoomOut, GitBranch } from 'lucide-react';

interface Node {
  id: string;
  type: 'event' | 'action' | 'variable' | 'output';
  title: string;
  x: number;
  y: number;
  inputs: Port[];
  outputs: Port[];
  data?: Record<string, any>;
}

interface Port {
  id: string;
  name: string;
  type: 'flow' | 'string' | 'number' | 'boolean' | 'any';
  connected?: string;
}

interface Connection {
  id: string;
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
}

interface BlueprintEditorProps {
  onGenerateCode: (html: string, css: string, js: string) => void;
}

const NODE_TEMPLATES: Record<string, Omit<Node, 'id' | 'x' | 'y'>> = {
  onLoad: {
    type: 'event',
    title: '页面加载时',
    inputs: [],
    outputs: [{ id: 'exec', name: '执行', type: 'flow' }],
  },
  onClick: {
    type: 'event',
    title: '点击时',
    inputs: [],
    outputs: [{ id: 'exec', name: '执行', type: 'flow' }],
  },
  onInterval: {
    type: 'event',
    title: '定时执行',
    inputs: [],
    outputs: [{ id: 'exec', name: '执行', type: 'flow' }],
    data: { interval: 1000 },
  },
  setText: {
    type: 'action',
    title: '设置文本',
    inputs: [
      { id: 'exec', name: '执行', type: 'flow' },
      { id: 'selector', name: '选择器', type: 'string' },
      { id: 'text', name: '文本', type: 'string' },
    ],
    outputs: [{ id: 'done', name: '完成', type: 'flow' }],
  },
  setStyle: {
    type: 'action',
    title: '设置样式',
    inputs: [
      { id: 'exec', name: '执行', type: 'flow' },
      { id: 'selector', name: '选择器', type: 'string' },
      { id: 'property', name: '属性', type: 'string' },
      { id: 'value', name: '值', type: 'string' },
    ],
    outputs: [{ id: 'done', name: '完成', type: 'flow' }],
  },
  getCurrentTime: {
    type: 'variable',
    title: '获取当前时间',
    inputs: [],
    outputs: [{ id: 'time', name: '时间', type: 'string' }],
  },
  formatDate: {
    type: 'variable',
    title: '格式化日期',
    inputs: [{ id: 'format', name: '格式', type: 'string' }],
    outputs: [{ id: 'result', name: '结果', type: 'string' }],
    data: { format: 'HH:mm:ss' },
  },
  createDiv: {
    type: 'output',
    title: '创建容器',
    inputs: [{ id: 'class', name: 'CSS类', type: 'string' }],
    outputs: [{ id: 'element', name: '元素', type: 'any' }],
    data: { class: 'widget' },
  },
  createText: {
    type: 'output',
    title: '创建文本',
    inputs: [
      { id: 'tag', name: '标签', type: 'string' },
      { id: 'content', name: '内容', type: 'string' },
    ],
    outputs: [{ id: 'element', name: '元素', type: 'any' }],
    data: { tag: 'p', content: '文本内容' },
  },
};

const PORT_COLORS: Record<string, string> = {
  flow: '#fff',
  string: '#22c55e',
  number: '#3b82f6',
  boolean: '#ef4444',
  any: '#a855f7',
};

const NODE_COLORS: Record<string, string> = {
  event: '#dc2626',
  action: '#2563eb',
  variable: '#16a34a',
  output: '#9333ea',
};

export const BlueprintEditor = ({ onGenerateCode }: BlueprintEditorProps) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<{ nodeId: string; portId: string; isOutput: boolean } | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showNodePalette, setShowNodePalette] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0 });

  const addNode = (templateKey: string, x: number, y: number) => {
    const template = NODE_TEMPLATES[templateKey];
    if (!template) return;
    
    const newNode: Node = {
      id: `node_${Date.now()}`,
      ...template,
      x: (x - pan.x) / zoom,
      y: (y - pan.y) / zoom,
      inputs: template.inputs.map(p => ({ ...p, id: `${p.id}_${Date.now()}` })),
      outputs: template.outputs.map(p => ({ ...p, id: `${p.id}_${Date.now()}` })),
    };
    setNodes([...nodes, newNode]);
    setShowNodePalette(false);
  };

  const deleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setConnections(connections.filter(c => c.fromNode !== nodeId && c.toNode !== nodeId));
    setSelectedNode(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNode(nodeId);
    setDraggedNode(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      dragStart.current = { x: e.clientX, y: e.clientY, nodeX: node.x, nodeY: node.y };
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom,
      });
    }
    
    if (draggedNode) {
      const dx = (e.clientX - dragStart.current.x) / zoom;
      const dy = (e.clientY - dragStart.current.y) / zoom;
      setNodes(nodes.map(n => 
        n.id === draggedNode 
          ? { ...n, x: dragStart.current.nodeX + dx, y: dragStart.current.nodeY + dy }
          : n
      ));
    }
  }, [draggedNode, nodes, zoom, pan]);

  const handleMouseUp = useCallback(() => {
    setDraggedNode(null);
    setConnecting(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handlePortClick = (nodeId: string, portId: string, isOutput: boolean) => {
    if (!connecting) {
      setConnecting({ nodeId, portId, isOutput });
    } else {
      if (connecting.isOutput !== isOutput && connecting.nodeId !== nodeId) {
        const newConnection: Connection = {
          id: `conn_${Date.now()}`,
          fromNode: connecting.isOutput ? connecting.nodeId : nodeId,
          fromPort: connecting.isOutput ? connecting.portId : portId,
          toNode: connecting.isOutput ? nodeId : connecting.nodeId,
          toPort: connecting.isOutput ? portId : connecting.portId,
        };
        setConnections([...connections, newConnection]);
      }
      setConnecting(null);
    }
  };

  const [showGeneratedMsg, setShowGeneratedMsg] = useState(false);

  const generateCode = () => {
    let html = '<div class="widget">\n  <p id="content">Hello Blueprint!</p>\n</div>';
    let css = '.widget { padding: 16px; color: white; text-align: center; }\n.widget p { font-size: 18px; }';
    let js = '';

    const eventNodes = nodes.filter(n => n.type === 'event');
    
    eventNodes.forEach(event => {
      if (event.title === '页面加载时') {
        js += 'document.addEventListener("DOMContentLoaded", () => {\n';
        js += '  // Generated code\n';
        js += '});\n';
      } else if (event.title === '定时执行') {
        const interval = event.data?.interval || 1000;
        js += `setInterval(() => {\n`;
        js += '  // Generated code\n';
        js += `}, ${interval});\n`;
      }
    });

    onGenerateCode(html, css, js);
    setShowGeneratedMsg(true);
    setTimeout(() => setShowGeneratedMsg(false), 2000);
  };

  const getPortPosition = (node: Node, portId: string, isOutput: boolean): { x: number; y: number } => {
    const ports = isOutput ? node.outputs : node.inputs;
    const portIndex = ports.findIndex(p => p.id === portId);
    const nodeWidth = 180;
    const headerHeight = 32;
    const portSpacing = 24;
    
    return {
      x: node.x + (isOutput ? nodeWidth : 0),
      y: node.y + headerHeight + portIndex * portSpacing + 12,
    };
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-white/10">
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setShowNodePalette(!showNodePalette)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
          >
            <Plus size={14} />
            添加节点
          </button>
          {showNodePalette && (
            <div className="absolute top-full left-0 mt-2 bg-zinc-900 border border-white/10 rounded-xl p-3 z-50 w-64 shadow-2xl">
              <div className="text-xs text-zinc-500 mb-2 font-medium">节点类型</div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {Object.entries(NODE_TEMPLATES).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => addNode(key, 300, 200)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ background: NODE_COLORS[template.type] }}
                    />
                    <span className="text-zinc-300">{template.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => setZoom(Math.min(zoom + 0.1, 2))}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs text-zinc-500">{Math.round(zoom * 100)}%</span>
        </div>
        <button
          onClick={generateCode}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-colors"
        >
          <Play size={14} />
          生成代码
        </button>
        {showGeneratedMsg && (
          <span className="text-green-400 text-sm animate-pulse">✓ 代码已生成，切换到代码模式查看</span>
        )}
      </div>

<div 
        ref={canvasRef}
        className="flex-1 relative overflow-hidden"
        style={{ 
          backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)',
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
          {connections.map(conn => {
            const fromNode = nodes.find(n => n.id === conn.fromNode);
            const toNode = nodes.find(n => n.id === conn.toNode);
            if (!fromNode || !toNode) return null;
            
            const fromPos = getPortPosition(fromNode, conn.fromPort, true);
            const toPos = getPortPosition(toNode, conn.toPort, false);
            const from = { x: fromPos.x * zoom + pan.x, y: fromPos.y * zoom + pan.y };
            const to = { x: toPos.x * zoom + pan.x, y: toPos.y * zoom + pan.y };
            const midX = (from.x + to.x) / 2;
            
            return (
              <path
                key={conn.id}
                d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                stroke="#fff"
                strokeWidth="2"
                fill="none"
                opacity="0.8"
              />
            );
          })}
          {connecting && (() => {
            const node = nodes.find(n => n.id === connecting.nodeId);
            if (!node) return null;
            const fromPos = getPortPosition(node, connecting.portId, connecting.isOutput);
            const from = { x: fromPos.x * zoom + pan.x, y: fromPos.y * zoom + pan.y };
            const to = { x: mousePos.x * zoom + pan.x, y: mousePos.y * zoom + pan.y };
            const midX = (from.x + to.x) / 2;
            return (
              <path
                d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
                stroke="#3b82f6"
                strokeWidth="3"
                strokeDasharray="5,5"
                fill="none"
                opacity="0.9"
              />
            );
          })()}
        </svg>

        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
          {nodes.map(node => (
            <div
              key={node.id}
              className={`absolute w-44 rounded-lg overflow-hidden shadow-xl cursor-move select-none ${
                selectedNode === node.id ? 'ring-2 ring-blue-500' : ''
              }`}
              style={{ 
                left: node.x, 
                top: node.y,
                background: 'linear-gradient(180deg, #27272a 0%, #18181b 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            >
              <div 
                className="px-3 py-2 text-sm font-medium text-white flex items-center justify-between"
                style={{ background: NODE_COLORS[node.type] }}
              >
                <span>{node.title}</span>
                {selectedNode === node.id && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                    className="text-white/60 hover:text-white"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              
              <div className="p-2 space-y-1">
                {node.inputs.map((port, i) => (
                  <div key={port.id} className="flex items-center gap-2 text-xs">
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePortClick(node.id, port.id, false); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded-full border-2 transition-transform hover:scale-125 cursor-crosshair"
                      style={{ 
                        borderColor: PORT_COLORS[port.type],
                        background: connecting?.portId === port.id ? PORT_COLORS[port.type] : 'transparent',
                      }}
                    />
                    <span className="text-zinc-400">{port.name}</span>
                  </div>
                ))}
                {node.outputs.map((port, i) => (
                  <div key={port.id} className="flex items-center justify-end gap-2 text-xs">
                    <span className="text-zinc-400">{port.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePortClick(node.id, port.id, true); }}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded-full border-2 transition-transform hover:scale-125 cursor-crosshair"
                      style={{ 
                        borderColor: PORT_COLORS[port.type],
                        background: connecting?.portId === port.id ? PORT_COLORS[port.type] : 'transparent',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600">
            <div className="text-center">
              <GitBranch size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">点击"添加节点"开始创建蓝图</p>
              <p className="text-xs mt-1 opacity-60">通过连接节点来定义组件行为</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
