# 计划：文章上下页按钮移到左侧

**日期：** 2026-03-30
**状态：** 进行中

## 目标
将文章上下页按钮（prev/next）从底部移到内容区左侧，垂直排列 sticky 展示。

## 现状
- `single.html` 中 `<nav class="paginav">` 位于 `<footer class="post-footer">` 内，渲染在文章内容下方
- prev/next 左右排列

## 目标效果
- 桌面端（≥1024px）：左侧 sticky 垂直导航，上下排列
- 移动端（<1024px）：底部保持原样（paginav 在 footer 内）
- 宽度：140px

## 改动文件

### 1. `layouts/_default/single.html`

**改动：** 将 `<nav class="paginav">` 从 footer 移到内容区左侧

新的布局结构：
```
<article class="post-single">
  <header>...</header>
  <cover>
  <div class="post-with-side-nav">      <!-- 新增 wrapper -->
    <aside class="post-side-nav">       <!-- 新增：左侧导航 -->
      <nav class="paginav">...</nav>
    </aside>
    <div class="post-content-toc-wrapper"> <!-- 原内容区 -->
      <div class="post-content">...</div>
      <aside class="post-toc-float">...</aside>
    </div>
  </div>
  <footer>...</footer>                  <!-- 移除 paginav -->
</article>
```

### 2. `assets/css/extended/layouts/single.css`

**新增样式：**

```css
/* 桌面端：双栏 Grid */
@media (min-width: 1024px) {
    .post-with-side-nav {
        display: grid;
        grid-template-columns: 140px 1fr;
        gap: 24px;
        align-items: start;
    }
    
    .post-side-nav {
        position: sticky;
        top: 30vh;
        height: fit-content;
    }
    
    .post-side-nav .paginav {
        flex-direction: column;
        background: transparent;
        border: none;
    }
    
    .post-side-nav .paginav a {
        padding: 8px 0;
        border: none;
        background: transparent;
    }
    
    .post-side-nav .paginav .prev {
        order: -1;  /* prev 在上 */
    }
    
    .post-side-nav .paginav .next {
        order: 1;   /* next 在下 */
    }
}

/* 移动端：隐藏侧边，恢复底部 */
@media (max-width: 1023px) {
    .post-with-side-nav {
        display: block;
    }
    .post-side-nav {
        display: none;
    }
}
```

## 步骤

- [x] 1. 修改 `single.html` — 重构布局 + 迁移 nav
- [x] 2. 新增 `post-side-nav` CSS 样式
- [x] 3. 本地构建验证 `hugo`
- [x] 4. commit ✅ (71ef695)
