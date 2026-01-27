# Chrome/Edge 浏览器美化插件技术架构文档

## 1. 技术栈选择
- **核心框架**：React 18 + TypeScript
- **构建工具**：Vite (针对 Chrome Extension 优化)
- **样式方案**：Tailwind CSS (配置为极简配色)
- **状态管理**：Zustand (轻量级，用于管理背景图设置、快捷方式数据)
- **图标库**：Lucide React
- **浏览器 API**：Chrome Extension Manifest V3

## 2. 项目结构
```
src/
  manifest.json      # 插件配置文件
  background/        # Service Worker (如有需要)
  newtab/           # 新标签页主入口
    index.html
    main.tsx
    App.tsx
    components/      # 组件
      Background.tsx # 背景图组件
      Clock.tsx      # 时钟组件
      Search.tsx     # 搜索框组件
      Shortcuts.tsx  # 快捷方式组件
    hooks/           # 自定义 Hooks
    store/           # Zustand store
    styles/          # 全局样式
```

## 3. 关键模块实现
### 3.1 Manifest V3 配置
- `manifest_version`: 3
- `chrome_url_overrides`: 定义 `newtab` 指向 `index.html`。
- `permissions`: 需要 `storage` 权限保存用户设置，`topSites` (可选) 获取常用网站。

### 3.2 背景图处理
- 初始版本内置几张高质量 Unsplash 风格风景图（存放在 `public/images`）。
- 使用 `img` 标签配合 `object-cover` 实现全屏。
- 遮罩层使用 `bg-black/30` 这种纯色半透明 Tailwind 类。

### 3.3 样式策略 (Tailwind)
- 禁用默认的渐变工具类（虽然 Tailwind 包含，但在编码时严格不使用 `bg-gradient-*`）。
- 使用 `backdrop-blur` 实现磨砂玻璃效果（符合极简现代感，非赛博朋克）。
- 字体颜色使用 `text-white` 或 `text-zinc-800`。

## 4. 数据存储
- 使用 `chrome.storage.local` 持久化用户配置（如是否显示秒、搜索引擎选择）。
- 使用 Zustand 中间件同步 Chrome Storage。

## 5. 构建与发布
- `vite build` 输出到 `dist` 目录。
- 确保 `assets` 路径在插件环境中正确加载。
