# MyBlog - Solren的网络自留地

> 个人博客项目文档。本文档供 Claude Code 及协作者参考，帮助快速理解项目结构和开发规范。

---

## 📌 项目概述

- **网站地址**: https://caiyu.life
- **GitHub 仓库**: https://github.com/so1ren/MyBlog
- **构建部署**: Cloudflare Pages（GitHub 集成自动构建）
- **域名**: caiyu.life
- **作者**: So1ren
- **邮箱**: caiyu2001@126.com

---

## 🛠 技术栈

| 组件 | 版本/说明 |
|------|----------|
| **静态站点生成器** | Hugo |
| **主题** | PaperMod（含自定义改动，通过 git submodule 管理） |
| **数学公式** | KaTeX + mhchem |
| **评论系统** | Giscus（基于 GitHub Discussions） |
| **搜索** | Fuse.js（客户端搜索） |
| **部署** | Cloudflare Pages（GitHub 集成自动构建） |
| **域名** | caiyu.life |

---

## 📁 目录结构

```
MyBlog/
├── archetypes/              # 文章模板（default.md）
│   └── default.md
├── assets/
│   └── css/
│       └── extended/        # 自定义 CSS（覆盖主题样式）
│           ├── custom.css
│           ├── components/    # 组件级样式
│           ├── layouts/       # 布局样式
│           └── pages/         # 页面级样式
│               └── tools.css  # 工具箱列表页样式
├── content/
│   ├── posts/               # 📄 博客文章目录
│   │   ├── 2026-04-26_电化学方法精讲第一讲电极过程概述.md
│   │   ├── lesson_001.md
│   │   ├── lesson_002.md
│   │   ├── lesson_003.md
│   │   └── 基于Hugo和PaperMod搭建的个人博客.md
│   ├── tools/               # 🔧 工具页面
│   │   ├── _index.md        # 工具页索引
│   │   ├── echem-analyzer.md
│   │   ├── gitt-overpotential.md
│   │   └── txt-chart.md
│   ├── about.md             # 关于页面
│   └── archives.md          # 归档页面
├── data/                    # 数据文件（ Hugo 数据模板用）
├── docs/                    # 📂 截图存档、开发计划
│   ├── caiyu-life-screenshots/
│   └── plans/
├── layouts/                 # HTML 模板（覆盖/扩展主题）
│   ├── _default/            # 默认模板
│   ├── partials/            # 模板片段
│   │   └── extend_head.html # 自定义 head 内容（KaTeX、Giscus 等）
│   └── tools/               # 工具页专用模板
├── static/                  # 静态资源（原样复制到站点根目录）
│   ├── cow.jpg              # 网站图标/头像
│   ├── qq.jpg               # QQ 二维码
│   └── ...                  # 其他静态文件
├── themes/
│   └── PaperMod/            # 主题（git submodule）
├── archive/                 # 归档内容（旧版本讲义等，不入 git）
├── hugo.yaml                # Hugo 主配置文件
├── .gitmodules              # Git 子模块配置
├── README.md                # 项目说明
└── TODO.md                  # 待办清单
```

> **其他目录**（非项目核心，不入 git）：
> - `kant-offline-backline/`、`kant-offline-backup/` — 康德讲义离线备份
> - `design-preview-*.html` — 主题调试时的设计稿预览，不影响生产构建
> - `skills/` — RedSkill 外部技能安装目录（通过 `redskill install` 管理）

---

## ✍️ 内容规范

### 文章 Front Matter 模板

每篇文章必须以 YAML front matter 开头：

```yaml
---
title: "文章标题"
date: 2026-04-26T10:00:00+08:00
draft: false
tags: ["tag1", "tag2"]
categories: ["分类名"]
series: ["系列名"]  # 可选，用于相关文章
summary: "文章摘要，显示在列表页"
cover:
    image: "/images/cover.jpg"  # 可选，封面图
---
```

### 文章存放位置

- **普通文章**: `content/posts/文章标题.md`
- **系列讲义**: `content/posts/`（推荐在 front matter 中使用 `series` 字段关联）
- **工具页面**: `content/tools/工具名.md`

### 数学公式支持

- 行内公式: `$...$`
- 块级公式: `$$...$$`
- 化学方程式: `\ce{...}`（需 mhchem 扩展）

### 代码块

支持语法高亮和行号，使用标准 Markdown 代码块：

````markdown
```python
def hello():
    print("Hello, World!")
```
````

---

## 🚀 发布流程

**禁止**手动上传 `public/` 构建产物到仓库。

正确的发布流程：

1. **本地编辑**: 创建/修改 `content/posts/` 中的 Markdown 文件
2. **本地预览**（可选）: `hugo server -D`
3. **提交更改**:
   ```bash
   git add content/posts/xxx.md
   git commit -m "文章标题"
   git push origin main
   ```
4. **自动部署**: Cloudflare Pages 检测到 GitHub push → 自动构建并部署

---

## ⚙️ 关键配置说明

### hugo.yaml 重要参数

| 参数 | 说明 |
|------|------|
| `baseURL` | 站点根 URL，必须为 `https://caiyu.life/` |
| `defaultTheme` | `auto`（跟随系统暗色/亮色模式） |
| `buildDrafts` | `false`（草稿不构建） |
| `hasCJKLanguage` | `true`（中文内容优化） |
| `ShowToc` | `true`（默认显示目录） |
| `ShowLastMod` | `true`（显示最后修改时间） |
| `ShowReadingTime` | `true`（显示阅读时间） |

### 评论系统（Giscus）

配置位于 `hugo.yaml` 的 `params.giscus` 段：
- 仓库: `so1ren/MyBlog`
- 讨论分类: `Announcements`
- 语言: `zh-CN`

**如需修改评论配置**，访问 https://giscus.app/zh-CN 获取新的 repoID 和 categoryID。

### 搜索配置

使用 Fuse.js 客户端搜索，配置在 `hugo.yaml` 的 `params.fuseOpts` 中。
搜索页面路由: `/search/`

---

## 🎨 自定义样式

自定义 CSS 放在 `assets/css/extended/custom.css`，会自动被 Hugo 管道处理并合并到主题样式中。

主题通过 git submodule 管理，更新时注意不要丢失自定义改动。

---

## 🔧 工具页架构

工具页通过 Hugo 模板体系管理：

- **内容**: `content/tools/xxx.md`
- **模板**: `layouts/tools/`（list.html + single.html）
- **静态资源**: 放在 `static/` 或 `assets/` 下

工具页自动继承网站导航栏和暗色模式切换。

**不要**将工具页放回 `static/` 目录下走纯静态文件方式。

---

## 📝 现有内容系列

### 讲义系列
- **电化学方法精讲** — `series: ["电化学方法精讲"]`
- **康德纯粹理性批判精读** — `series: ["康德纯粹理性批判精读"]`

### 工具页
- **TXT 数据可视化** (`/tools/txt-chart/`) — 拖拽上传 TXT 文件生成折线图
- **EChem Analyzer** (`/tools/echem-analyzer/`) — 电化学数据自动化处理：支持 CV / EIS 数据提取、循环分割、Origin 格式输出；EIS 数据自动绘制 Nyquist 图与 Bode 图（|Z|、相位角），**内置图例**，支持多组数据叠加对比、浏览器本地保存复用
- **GITT Overpotential** (`/tools/gitt-overpotential/`) — GITT 过电位计算

---

## ⚠️ 注意事项

1. **不要提交 `public/` 目录**：Cloudflare Pages 会自动构建
2. **不要提交 Hugo 构建产物**：如 `resources/_gen/`
3. **主题更新**：PaperMod 是 fork 的版本（`so1ren/hugo-PaperMod`），通过 git submodule 管理。**不要建议更新子模块**——fork 包含自定义修改
4. **Front matter 必须完整**：特别是 `date` 和 `title` 字段
5. **图片路径**：使用绝对路径 `/images/xxx.jpg` 或相对路径 `./xxx.jpg`

---

## 🔗 相关资源

- [Hugo 文档](https://gohugo.io/documentation/)
- [PaperMod 主题文档](https://github.com/adityatelange/hugo-PaperMod/wiki)
- [Giscus 配置](https://giscus.app/zh-CN)
- [KaTeX 支持的命令](https://katex.org/docs/supported.html)

---

*本文档最后更新: 2026-06-04*
