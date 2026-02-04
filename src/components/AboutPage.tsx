import { useState } from 'react';
import { Github, ExternalLink, ChevronRight, Shield, FileText, Scale, Package, History, AlertCircle, Tag, RefreshCw, Sparkles } from 'lucide-react';

type TabType = 'about' | 'changelog' | 'licenses' | 'privacy';

const AppIcon = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="14" fill="#18181B"/>
    <rect x="2" y="2" width="60" height="60" rx="12" stroke="white" strokeOpacity="0.1" strokeWidth="2"/>
    <circle cx="32" cy="28" r="12" stroke="#3B82F6" strokeWidth="2.5" fill="none"/>
    <path d="M32 20V28L38 32" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="16" y="44" width="32" height="4" rx="2" fill="#3B82F6" fillOpacity="0.3"/>
    <rect x="20" y="50" width="24" height="3" rx="1.5" fill="#3B82F6" fillOpacity="0.2"/>
  </svg>
);

interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
  releaseNotes?: string;
  publishedAt?: string;
  error?: string;
}

export const AboutPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('about');
  const [checking, setChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  
  const version = '1.0.8';
  const buildDate = '2026-02-05';
  const repoUrl = 'https://github.com/tlkppm/zen-newtab';

  const changelog = [
    {
      version: '1.0.8',
      date: '2026-02-05',
      tag: `${repoUrl}/releases/tag/v1.0.8`,
      changes: [
        '新增 AI 工具调用系统，支持联网搜索和网页内容获取',
        'AI 对话实时显示工具执行状态和结果',
        'AI 现在知道当前日期时间，搜索更准确',
        '支持用户自定义系统提示词',
        '改进消息气泡布局，解决内容溢出问题',
        '优化工具调用提示，防止无限循环',
      ]
    },
    {
      version: '1.0.7',
      date: '2026-02-02',
      tag: `${repoUrl}/releases/tag/v1.0.7`,
      changes: [
        '修复日历节日期间不显示农历日期的问题',
        '假期期间正确显示初二、初三等农历日期',
      ]
    },
    {
      version: '1.0.6',
      date: '2026-01-29',
      tag: `${repoUrl}/releases/tag/v1.0.6`,
      changes: [
        '新增生日祝福功能，支持设置生日日期',
        '生日当天自动显示动态祝福动画（五彩纸屑、气球效果）',
        '生日祝福支持背景音乐播放',
        '新增生日预览功能，可在设置中预览祝福效果',
        '修复生日设置弹窗逻辑问题',
      ]
    },
    {
      version: '1.0.5',
      date: '2026-01-28',
      tag: `${repoUrl}/releases/tag/v1.0.5`,
      changes: [
        '新增开发者工具箱组件',
        '新增白噪音专注组件',
        '新增深呼吸放松组件',
        '支持剪贴板自动识别分享码',
        '新增默认随机背景图片',
        '修复本地背景图片刷新后消失的问题',
        '修复番茄钟提示音试听功能',
        '修复 Monaco 编辑器 CSP 加载问题',
      ]
    },
    {
      version: '1.0.4',
      date: '2026-01-28',
      tag: `${repoUrl}/releases/tag/v1.0.4`,
      changes: [
        '新增蓝图可视化编辑器，支持节点式组件行为定义',
        '集成 Monaco 代码编辑器，支持语法高亮和智能提示',
        '新增实时代码错误检测功能',
        '新增 Toast 通知系统，统一用户操作反馈',
        '修复蓝图节点连接线显示问题',
      ]
    },
    {
      version: '1.0.3',
      date: '2026-01-28',
      tag: `${repoUrl}/releases/tag/v1.0.3`,
      changes: [
        '新增版本更新提示功能',
        '自动检测 GitHub 最新版本并弹窗提醒',
        '支持忽略当前版本提醒',
      ]
    },
    {
      version: '1.0.2',
      date: '2026-01-28',
      tag: `${repoUrl}/releases/tag/v1.0.2`,
      changes: [
        '天气 API 改用 wttr.in，国内可直接访问无需代理',
        '天气地理位置显示中文地名',
        '分享码格式优化，长度减少约 40%',
        '兼容旧版分享码导入',
      ]
    },
    {
      version: '1.0.1',
      date: '2026-01-27',
      tag: `${repoUrl}/releases/tag/v1.0.1`,
      changes: [
        '新增日历组件，支持农历显示',
        '新增待办事项组件，支持任务优先级',
        '新增便签组件，支持多便签管理',
        '新增番茄钟组件，支持自定义时长',
        '新增关于页面，包含版本信息与更新日志',
        '优化布局编辑体验，添加智能对齐吸附功能',
        '修复图片磁贴分割显示问题',
        '修复 TypeScript 类型检查错误',
      ]
    },
    {
      version: '1.0.0',
      date: '2026-01-20',
      tag: `${repoUrl}/releases/tag/v1.0.0`,
      changes: [
        '初始版本发布',
        '支持自定义背景（在线图片/本地图片/本地视频/纯色）',
        '集成时钟、日期、搜索、书签、天气、每日一言组件',
        '支持自由拖拽布局与组件大小调整',
        '支持布局导出与导入分享功能',
        '支持多搜索引擎切换（Google/Bing/Baidu/DuckDuckGo）',
        '支持媒体播放器组件',
        '支持浏览器书签与历史记录查看',
        '支持扩展程序管理',
      ]
    }
  ];

  const thirdPartyLicenses = [
    { name: '@monaco-editor/react', version: '4.7.0', license: 'MIT', url: 'https://github.com/suren-atoyan/monaco-react' },
    { name: 'React', version: '18.3.1', license: 'MIT', url: 'https://github.com/facebook/react' },
    { name: 'React DOM', version: '18.3.1', license: 'MIT', url: 'https://github.com/facebook/react' },
    { name: 'TypeScript', version: '5.8.3', license: 'Apache-2.0', url: 'https://github.com/microsoft/TypeScript' },
    { name: 'Tailwind CSS', version: '3.4.17', license: 'MIT', url: 'https://github.com/tailwindlabs/tailwindcss' },
    { name: 'Zustand', version: '5.0.10', license: 'MIT', url: 'https://github.com/pmndrs/zustand' },
    { name: 'Vite', version: '6.3.5', license: 'MIT', url: 'https://github.com/vitejs/vite' },
    { name: 'Lucide React', version: '0.511.0', license: 'ISC', url: 'https://github.com/lucide-icons/lucide' },
    { name: 'Day.js', version: '1.11.19', license: 'MIT', url: 'https://github.com/iamkun/dayjs' },
    { name: 'idb-keyval', version: '6.2.2', license: 'Apache-2.0', url: 'https://github.com/jakearchibald/idb-keyval' },
    { name: 'clsx', version: '2.1.1', license: 'MIT', url: 'https://github.com/lukeed/clsx' },
    { name: 'tailwind-merge', version: '3.4.0', license: 'MIT', url: 'https://github.com/dcastil/tailwind-merge' },
    { name: 'lunar-javascript', version: '1.7.7', license: 'MIT', url: 'https://github.com/6tail/lunar-javascript' },
    { name: 'React Router DOM', version: '7.13.0', license: 'MIT', url: 'https://github.com/remix-run/react-router' },
  ];

  const tabs = [
    { id: 'about' as TabType, label: '关于', icon: AlertCircle },
    { id: 'changelog' as TabType, label: '更新日志', icon: History },
    { id: 'licenses' as TabType, label: '第三方许可', icon: Package },
    { id: 'privacy' as TabType, label: '隐私与条款', icon: Shield },
  ];

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex border-b border-white/10 mb-4">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
              activeTab === id 
                ? 'text-white border-blue-500' 
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === 'about' && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <AppIcon />
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-white">静谧新标签页</h1>
                <p className="text-zinc-400 text-sm">Zen New Tab</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-zinc-500">
                  <span>版本 {version}</span>
                  <span>构建日期 {buildDate}</span>
                  <span>Manifest V3</span>
                  <span>Chrome / Edge</span>
                </div>
                <button
                  onClick={async () => {
                    setChecking(true);
                    setUpdateInfo(null);
                    try {
                      const res = await fetch('https://api.github.com/repos/tlkppm/zen-newtab/releases/latest');
                      const data = await res.json();
                      const latestVersion = data.tag_name?.replace('v', '') || version;
                      const parts1 = latestVersion.split('.').map(Number);
                      const parts2 = version.split('.').map(Number);
                      let hasUpdate = false;
                      for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
                        const p1 = parts1[i] || 0;
                        const p2 = parts2[i] || 0;
                        if (p1 > p2) { hasUpdate = true; break; }
                        if (p1 < p2) break;
                      }
                      setUpdateInfo({
                        hasUpdate,
                        currentVersion: version,
                        latestVersion,
                        releaseUrl: data.html_url || '',
                        releaseNotes: data.body || '',
                        publishedAt: data.published_at || ''
                      });
                    } catch (err) {
                      setUpdateInfo({ hasUpdate: false, currentVersion: version, latestVersion: version, releaseUrl: '', error: '检查更新失败' });
                    }
                    setChecking(false);
                  }}
                  disabled={checking}
                  className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 text-white text-xs rounded-lg transition-colors"
                >
                  <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
                  {checking ? '检查中...' : '检查更新'}
                </button>
                {updateInfo && (
                  <div className={`mt-2 p-2 rounded-lg text-xs ${updateInfo.hasUpdate ? 'bg-green-500/10 border border-green-500/20' : 'bg-zinc-800/50 border border-zinc-700'}`}>
                    {updateInfo.error ? (
                      <span className="text-red-400">检查失败: {updateInfo.error}</span>
                    ) : updateInfo.hasUpdate ? (
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-green-400" />
                        <span className="text-green-400">发现新版本: v{updateInfo.latestVersion}</span>
                        <a href={updateInfo.releaseUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-2">查看</a>
                      </div>
                    ) : (
                      <span className="text-zinc-400">已是最新版本 (v{updateInfo.currentVersion})</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <p className="text-zinc-300 text-sm leading-relaxed">
              静谧新标签页是一款为 Chrome 和 Microsoft Edge 浏览器设计的扩展程序，
              旨在提供宁静、高效且高度可定制化的新标签页体验。本扩展集成了多种实用工具，
              帮助用户保持专注与条理，提升日常工作效率。
            </p>

            <div className="bg-zinc-800/40 border border-white/10 rounded-lg p-4">
              <h3 className="text-sm font-medium text-white mb-3">核心功能</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="text-zinc-400">自定义背景：在线图片、本地图片、本地视频、纯色</div>
                <div className="text-zinc-400">自由布局：拖拽定位、大小调整、智能对齐</div>
                <div className="text-zinc-400">时钟日期：可选秒数显示、农历日期</div>
                <div className="text-zinc-400">多引擎搜索：Google、Bing、Baidu、DuckDuckGo</div>
                <div className="text-zinc-400">日历组件：月视图、农历、节气显示</div>
                <div className="text-zinc-400">待办事项：任务管理、优先级标记</div>
                <div className="text-zinc-400">便签组件：快速记录、多便签管理</div>
                <div className="text-zinc-400">番茄钟：专注计时、休息提醒</div>
                <div className="text-zinc-400">天气组件：实时天气信息</div>
                <div className="text-zinc-400">每日一言：励志名言展示</div>
                <div className="text-zinc-400">媒体播放：背景音乐播放器</div>
                <div className="text-zinc-400">布局分享：导出导入配置</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-zinc-800/60 hover:bg-zinc-700/60 border border-white/10 rounded-lg p-3 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Github size={18} className="text-zinc-400" />
                  <div>
                    <div className="text-sm text-white">源代码</div>
                    <div className="text-xs text-zinc-500">GitHub</div>
                  </div>
                </div>
                <ExternalLink size={14} className="text-zinc-500" />
              </a>
              <a
                href={`${repoUrl}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-zinc-800/60 hover:bg-zinc-700/60 border border-white/10 rounded-lg p-3 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-zinc-400" />
                  <div>
                    <div className="text-sm text-white">反馈问题</div>
                    <div className="text-xs text-zinc-500">Issues</div>
                  </div>
                </div>
                <ExternalLink size={14} className="text-zinc-500" />
              </a>
              <a
                href={`${repoUrl}/wiki`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-zinc-800/60 hover:bg-zinc-700/60 border border-white/10 rounded-lg p-3 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-zinc-400" />
                  <div>
                    <div className="text-sm text-white">使用文档</div>
                    <div className="text-xs text-zinc-500">Wiki</div>
                  </div>
                </div>
                <ExternalLink size={14} className="text-zinc-500" />
              </a>
              <a
                href={`${repoUrl}/discussions`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-zinc-800/60 hover:bg-zinc-700/60 border border-white/10 rounded-lg p-3 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-zinc-400" />
                  <div>
                    <div className="text-sm text-white">社区讨论</div>
                    <div className="text-xs text-zinc-500">Discussions</div>
                  </div>
                </div>
                <ExternalLink size={14} className="text-zinc-500" />
              </a>
            </div>

            <div className="bg-zinc-800/40 border border-white/10 rounded-lg p-4">
              <h3 className="text-sm font-medium text-white mb-2">系统要求</h3>
              <div className="text-xs text-zinc-400 space-y-1">
                <p>Google Chrome 88 或更高版本</p>
                <p>Microsoft Edge 88 或更高版本</p>
                <p>其他基于 Chromium 的浏览器（需支持 Manifest V3）</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2 text-xs text-zinc-500">
              <p>Copyright 2026 tlkppm. 保留所有权利。</p>
              <p>本软件基于 MIT 许可证开源发布，允许自由使用、修改和分发。</p>
              <p>本扩展不收集任何用户数据，所有信息均存储在本地浏览器中。</p>
            </div>
          </div>
        )}

        {activeTab === 'changelog' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-zinc-400">版本发布历史记录</p>
              <a
                href={`${repoUrl}/releases`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
              >
                查看全部版本
                <ExternalLink size={12} />
              </a>
            </div>
            {changelog.map((release) => (
              <div key={release.version} className="border-l-2 border-blue-500/50 pl-4">
                <div className="flex items-center gap-3 mb-2">
                  <a
                    href={release.tag}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-medium hover:text-blue-400 flex items-center gap-1"
                  >
                    <Tag size={14} />
                    v{release.version}
                  </a>
                  <span className="text-xs text-zinc-500">{release.date}</span>
                  <a
                    href={release.tag}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-zinc-600 hover:text-zinc-400 ml-auto"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>
                <ul className="space-y-1">
                  {release.changes.map((change, i) => (
                    <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                      <ChevronRight size={14} className="text-zinc-600 mt-0.5 shrink-0" />
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'licenses' && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400 mb-4">
              本扩展程序使用了以下开源软件。感谢这些项目的贡献者。
            </p>
            <div className="space-y-2">
              {thirdPartyLicenses.map((lib) => (
                <a
                  key={lib.name}
                  href={lib.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between bg-zinc-800/40 hover:bg-zinc-800/60 border border-white/5 rounded-lg p-3 transition-colors"
                >
                  <div>
                    <div className="text-sm text-white">{lib.name}</div>
                    <div className="text-xs text-zinc-500">版本 {lib.version}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-zinc-700/50 rounded text-zinc-400">{lib.license}</span>
                    <ExternalLink size={14} className="text-zinc-500" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
            <section>
              <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                <Shield size={16} className="text-blue-400" />
                隐私声明
              </h3>
              <div className="space-y-2 text-zinc-400">
                <p>本扩展程序尊重并保护用户隐私。我们承诺：</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>所有用户数据均存储在本地浏览器中，不会上传至任何服务器</li>
                  <li>不收集任何个人身份信息或浏览历史</li>
                  <li>不包含任何广告或跟踪代码</li>
                  <li>不与任何第三方共享用户数据</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                <FileText size={16} className="text-green-400" />
                权限说明
              </h3>
              <div className="space-y-2 text-zinc-400">
                <ul className="space-y-2 ml-2">
                  <li><span className="text-zinc-300">storage</span> - 用于保存用户设置和布局配置</li>
                  <li><span className="text-zinc-300">bookmarks</span> - 用于读取并显示浏览器书签</li>
                  <li><span className="text-zinc-300">history</span> - 用于显示浏览历史记录</li>
                  <li><span className="text-zinc-300">tabs</span> - 用于新标签页功能</li>
                  <li><span className="text-zinc-300">management</span> - 用于管理扩展程序</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                <Scale size={16} className="text-yellow-400" />
                使用条款
              </h3>
              <div className="space-y-2 text-zinc-400">
                <p>本软件按"原样"提供，不附带任何明示或暗示的保证。在适用法律允许的最大范围内，
                作者不对因使用本软件而产生的任何损害承担责任。</p>
                <p>
                  完整许可证文本请参阅 
                  <a href={`${repoUrl}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline ml-1">
                    LICENSE
                  </a>
                  。
                </p>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
