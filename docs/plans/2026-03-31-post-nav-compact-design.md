# 计划：文章导航改为紧凑图标式

**日期：** 2026-03-31
**决策：** A（紧凑图标式）→ 内容区左边缘贴靠 → 纯文字箭头单行

## 目标
将文章上下页导航改为极简紧凑风格，与内容区左/右边缘贴靠，单行 `← 标题名` 格式。

## 设计规格

### 布局
- 导航置于文章内容区内，作为 `.post-content-toc-wrapper` 的首/末子元素
- prev 链接：内容区左边缘贴靠，文字右对齐
- next 链接：内容区右边缘贴靠，文字左对齐
- 宽度各自自然延伸，`white-space: nowrap` + `overflow: hidden` + `text-overflow: ellipsis` 处理超长标题

### 样式
- 单行：`← 标题` 或 `标题 →`，纯文字，简洁
- 字号：与正文 footnote 相近，约 13px
- 颜色：与正文链接色一致（`var(--secondary)`）
- hover：文字颜色加深，下划线
- 上下两链接间距约 8px，无边框无背景无阴影
- 整体极简，轻盈，不抢注意力

### 响应式
- 移动端（≤768px）：导航隐藏（与 TOC 一致）
- 中屏（769px–1200px）：保持左右边缘贴靠

## 改动文件

### `layouts/_default/single.html`
将 `post-side-nav` 改为直接在 `.post-content-toc-wrapper` 内前后各放一个导航链接：

```html
<div class="post-content-toc-wrapper">
  <!-- 左：prev 导航，贴左边缘 -->
  <div class="post-nav-float post-nav-prev">
    {{- with $pages.Prev . }}
    <a href="{{ .Permalink }}">← {{ .Name }}</a>
    {{- end }}
  </div>

  <div class="post-content">...</div>

  <!-- 右：next 导航，贴右边缘 -->
  <div class="post-nav-float post-nav-next">
    {{- with $pages.Next . }}
    <a href="{{ .Permalink }}">{{ .Name }} →</a>
    {{- end }}
  </div>

  <aside class="post-toc-float">...</aside>
</div>
```

### `assets/css/extended/layouts/single.css`
替换原有的 `post-side-nav` CSS 为：

```css
/* 移动端隐藏 */
@media (max-width: 768px) {
    .post-nav-float { display: none; }
}

/* 桌面端：内容区边缘贴靠 */
@media (min-width: 769px) {
    .post-content-toc-wrapper {
        position: relative;
    }

    .post-nav-float {
        position: absolute;
        top: 0;
        width: 45%;
    }

    .post-nav-prev {
        left: 0;
        text-align: left;
    }

    .post-nav-next {
        right: 0;
        text-align: right;
    }

    .post-nav-float a {
        display: inline;
        font-size: 13px;
        color: var(--secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        display: block;
    }

    .post-nav-float a:hover {
        color: var(--primary);
        text-decoration: underline;
    }
}
```

## 步骤

- [ ] 1. 修改 single.html — 移除 post-side-nav，新增 inline nav 结构
- [ ] 2. 新增 post-nav-float CSS
- [ ] 3. 移除/清理旧的 post-side-nav 相关 CSS
- [ ] 4. hugo 构建验证
- [ ] 5. commit + push
