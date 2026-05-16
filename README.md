# MyBlog

> 个人博客 · Hugo + PaperMod · caiyu.life

---

## 技术栈

| 项目 | 版本/说明 |
|------|----------|
| **Hugo** | 静态站点生成器 |
| **主题** | PaperMod（含自定义改动） |
| **数学公式** | KaTeX + mhchem |
| **部署** | Cloudflare Pages（GitHub 集成自动构建） |
| **域名** | caiyu.life |

---

## 目录结构

```
MyBlog/
├── archetypes/          # 文章模板
├── archive/             # 归档页面
├── assets/              # 自定义 CSS/JS（Hugo 管道处理）
├── content/
│   ├── posts/           # 博客文章
│   └── tools/           # 工具页内容（Markdown + front matter）
├── docs/
│   ├── caiyu-life-screenshots/  # 网站截图存档
│   └── plans/           # 开发计划
├── layouts/
│   ├── _default/        # 默认模板
│   ├── partials/        # 模板片段
│   └── tools/           # 工具页专用模板（list + single）
├── static/              # 静态资源（原样复制）
├── themes/
│   └── PaperMod/        # 主题（submodule）
├── hugo.yaml            # Hugo 配置
└── README.md            # 本文件
```

---

## 核心内容

### 讲义系列
- **电化学方法精讲** — 电化学基础知识系列
- **康德纯粹理性批判精读** — 哲学经典精读系列

### 工具页
- **TXT 数据可视化** (`/tools/txt-chart/`) — 拖拽上传 TXT 文件，自动生成折线图。支持批量上传、多文件叠加对比、**X 轴范围裁剪**（单文件+叠加图均支持）、**交互式缩放**（Shift+拖动/滚轮）、底部数轴实时预览。叠加图 minimap 显示所有文件轮廓，选中范围以各自颜色高亮
- **EChem Analyzer** (`/echem-analyzer/`) — 电化学数据自动化处理

工具页通过 Hugo 模板体系管理（`content/tools/` + `layouts/tools/`），自动继承网站导航栏和暗色切换。

### 其他文章
见 `content/posts/` 目录，涵盖技术、哲学、随笔等。

---

## 发布流程

博客发布依赖现有自动构建链路：

1. **本地**: 编辑/创建 `content/posts/` 中的 Markdown 文件
2. **提交**: `git add content/posts/xxx.md` → `git commit` → `git push`
3. **自动**: Cloudflare Pages 检测到 GitHub push → 自动构建并部署

**禁止**: 手动上传 `public/` 构建产物到仓库。

---

## 注意事项

- `design-preview-*.html` 文件为主题调试时的设计稿，不影响生产构建
- PaperMod 主题通过 git submodule 管理，更新时注意不要丢失自定义改动
- KaTeX 公式支持已配置，在 Markdown 中直接用 `$...$` 或 `$$...$$`
- **工具页架构**: 工具页放在 `content/tools/` + `layouts/tools/` 下，走 Hugo 模板引擎，自动继承 `partials/header.html` 导航栏。不要放回 `static/`。

---

*重建于 2026-04-07 · 设计系统: PaperMod + 自定义 CSS*
