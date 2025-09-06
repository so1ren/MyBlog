// 目录功能
let isScrolling = false;
let isMouseInToc = false;
let lastActiveIndex = -1;

// 初始化目录折叠状态
function initTocCollapse() {
    const tocContainer = document.querySelector('.toc');
    if (!tocContainer) return;
    
    // 找到所有有子菜单的目录项
    const tocItemsWithChildren = tocContainer.querySelectorAll('li:has(ul)');
    
    // 默认折叠所有有子菜单的目录项
    tocItemsWithChildren.forEach(item => {
        item.classList.add('collapsed');
    });
    
    const tocFloat = document.querySelector('.post-toc-float');
    // 监听目录区域的鼠标事件
    if (tocFloat) {
        tocFloat.addEventListener('mouseenter', () => {
            isMouseInToc = true;
        });
        
        tocFloat.addEventListener('mouseleave', () => {
            isMouseInToc = false;
            setTimeout(() => {
                if (!isMouseInToc) {
                    collapseNonActiveItems();
                }
            }, 500);
        });
    }
}

// 折叠非活跃目录项
function collapseNonActiveItems() {
    const tocContainer = document.querySelector('.toc');
    if (!tocContainer || isMouseInToc) return;
    
    const activeItem = tocContainer.querySelector('a.active');
    
    // 如果没有活跃项，折叠所有项
    if (!activeItem) {
        const allItemsWithChildren = tocContainer.querySelectorAll('li:has(ul)');
        allItemsWithChildren.forEach(item => {
            item.classList.add('collapsed');
        });
        return;
    }
    
    const allItemsWithChildren = tocContainer.querySelectorAll('li:has(ul)');
    
    // 先折叠所有项
    allItemsWithChildren.forEach(item => {
        item.classList.add('collapsed');
    });
    
    // 展开活跃项及其父级
    let currentItem = activeItem.closest('li');
    while (currentItem) {
        currentItem.classList.remove('collapsed');
        currentItem = currentItem.parentElement.closest('li');
    }
}

// 设置目录悬停和点击事件
function setupTocHover() {
    const tocContainer = document.querySelector('.toc');
    if (!tocContainer) return;
    
    // 找到所有有子菜单的目录项
    const tocItemsWithChildren = tocContainer.querySelectorAll('li:has(ul)');
    const tocLinks = document.querySelectorAll('.toc a[href^="#"]');
    
    tocItemsWithChildren.forEach(item => {
        const link = item.querySelector('a');
        
        // 鼠标悬停时展开
        item.addEventListener('mouseenter', () => {
            if (isMouseInToc) {
                item.classList.remove('collapsed');
            }
        });
        
        // 点击时切换展开/折叠
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(decodeURIComponent(targetId));
                
                if (targetElement) {
                    // 滚动到目标位置
                    window.scrollTo({
                        top: targetElement.offsetTop - 100,
                        behavior: 'smooth'
                    });
                    
                    // 更新活跃状态
                    tocLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    
                    // 切换当前项的展开状态
                    item.classList.toggle('collapsed');
                    
                    // 确保目录滚动到正确位置
                    setTimeout(scrollToActiveItem, 300);
                }
            });
        }
    });
}

// 滚动到活跃目录项
function scrollToActiveItem() {
    const activeLink = document.querySelector('.toc a.active');
    const tocContainer = document.querySelector('.toc');
    if (!activeLink || !tocContainer || isScrolling) return;
    
    isScrolling = true;
    
    // 计算位置
    const containerRect = tocContainer.getBoundingClientRect();
    const activeRect = activeLink.getBoundingClientRect();
    const offset = activeRect.top - containerRect.top - (containerRect.height / 3);
    
    // 平滑滚动
    tocContainer.scrollTo({
        top: tocContainer.scrollTop + offset,
        behavior: 'smooth'
    });
    
    // 重置滚动标志
    setTimeout(() => {
        isScrolling = false;
    }, 800);
}

// 滚动处理函数
function onScroll() {
    const tocLinks = document.querySelectorAll('.toc a[href^="#"]');
    let activeIndex = -1;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // 如果在页面顶部，清除所有活跃状态
    if (scrollTop < 100) {
        tocLinks.forEach(link => {
            link.classList.remove('active');
        });
        collapseNonActiveItems();
        lastActiveIndex = -1;
        return;
    }
    
    for (let i = 0; i < tocLinks.length; i++) {
        if (tocLinks[i].hash) {
            const rawHref = tocLinks[i].getAttribute('href').replace('#', '');
            const id = decodeURIComponent(rawHref);
            const heading = document.getElementById(id);
            if (heading && heading.getBoundingClientRect().top - 100 < 0) {
                activeIndex = i;
            }
        }
    }
    
    // 只有当活跃项改变时才更新
    if (activeIndex !== lastActiveIndex) {
        tocLinks.forEach((link, idx) => {
            if (idx === activeIndex) {
                link.classList.add('active');
                
                // 先展开父级目录
                let parentLi = link.closest('li');
                while (parentLi) {
                    parentLi.classList.remove('collapsed');
                    parentLi = parentLi.parentElement.closest('li');
                }
                
                // 然后折叠其他非活跃目录
                if (!isMouseInToc) {
                    collapseNonActiveItems();
                }
                
                // 最后滚动到活跃项
                setTimeout(scrollToActiveItem, 100);
            } else {
                link.classList.remove('active');
            }
        });
        
        lastActiveIndex = activeIndex;
    }
}

// 设置目录点击动画增强
function setupTocClickAnimation() {
    const tocLinks = document.querySelectorAll('.toc a[href^="#"]');
    
    tocLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(decodeURIComponent(targetId));
            
            if (targetElement) {
                e.preventDefault();
                
                // 滚动到目标位置
                window.scrollTo({
                    top: targetElement.offsetTop - 100,
                    behavior: 'smooth'
                });
                
                // 更新活跃状态
                tocLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                // 确保目录滚动到正确位置
                setTimeout(scrollToActiveItem, 300);
            }
        });
    });
}

// 优化目录折叠和展开动画
function setupTocSmoothCollapse() {
    const tocItems = document.querySelectorAll('.toc li:has(ul)');
    
    tocItems.forEach(item => {
        const link = item.querySelector('a');
        
        // 添加类名标识有子菜单的项
        item.classList.add('has-children');
        
        // 点击目录项切换折叠状态
        link.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#' || this.getAttribute('href') === '#0') {
                e.preventDefault();
            }
            
            // 切换折叠状态
            item.classList.toggle('collapsed');
            
            // 阻止事件冒泡
            e.stopPropagation();
        });
        
        // 添加键盘支持
        link.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.classList.toggle('collapsed');
            }
        });
    });
}

// 修复浮动目录样式
function fixTocFloatStyle() {
    const tocFloat = document.querySelector('.post-toc-float');
    if (tocFloat) {
        tocFloat.style.overflowY = 'hidden';
        tocFloat.style.padding = '0';
        tocFloat.style.border = 'none';
        tocFloat.style.boxShadow = 'none';
        tocFloat.style.background = 'transparent';
    }
}

// 设置目录功能
function setupToc() {
    const tocContainer = document.querySelector('.toc');
    if (!tocContainer) return;
    
    const tocLinks = document.querySelectorAll('.toc a[href^="#"]');
    
    // 初始状态：折叠所有目录项
    initTocCollapse();
    
    // 添加防抖处理
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(onScroll, 100);
    });
    
    // 初始滚动定位
    setTimeout(() => {
        setupTocHover();
        onScroll(); // 初始检查滚动位置
        setupTocClickAnimation();
        setupTocSmoothCollapse();
        fixTocFloatStyle();
    }, 500);
}