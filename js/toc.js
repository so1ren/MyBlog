// 目录功能
let isScrolling = false;
let isMouseInToc = false;
let lastActiveIndex = -1;

// 初始化目录折叠状态
function initTocCollapse() {
    const tocContainer = document.querySelector('.toc');
    if (!tocContainer) return;

    const tocItemsWithChildren = tocContainer.querySelectorAll('li:has(ul)');
    tocItemsWithChildren.forEach(item => {
        item.classList.add('collapsed');
    });

    const tocFloat = document.querySelector('.post-toc-float');
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

// 折叠非活跃目录项（带动画）
function collapseNonActiveItems() {
    const tocContainer = document.querySelector('.toc');
    if (!tocContainer || isMouseInToc) return;

    const activeItem = tocContainer.querySelector('a.active');
    const allItemsWithChildren = tocContainer.querySelectorAll('li:has(ul)');

    allItemsWithChildren.forEach(item => {
        item.classList.add('collapsed');
    });

    if (activeItem) {
        let currentItem = activeItem.closest('li');
        while (currentItem) {
            currentItem.classList.remove('collapsed');
            currentItem = currentItem.parentElement.closest('li');
        }
    }
}

// 滚动到活跃目录项（带动画）
function scrollToActiveItem() {
    const activeLink = document.querySelector('.toc a.active');
    const tocContainer = document.querySelector('.toc');
    if (!activeLink || !tocContainer || isScrolling) return;

    isScrolling = true;
    const containerRect = tocContainer.getBoundingClientRect();
    const activeRect = activeLink.getBoundingClientRect();
    const offset = activeRect.top - containerRect.top - containerRect.height / 3;

    tocContainer.scrollTo({
        top: tocContainer.scrollTop + offset,
        behavior: 'smooth'
    });

    setTimeout(() => {
        isScrolling = false;
    }, 800);
}

// 滚动处理函数（优化动画顺序）
function onScroll() {
    const tocLinks = document.querySelectorAll('.toc a[href^="#"]');
    let activeIndex = -1;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop < 100) {
        tocLinks.forEach(link => link.classList.remove('active'));
        collapseNonActiveItems();
        lastActiveIndex = -1;
        return;
    }

    for (let i = 0; i < tocLinks.length; i++) {
        const rawHref = tocLinks[i].getAttribute('href').replace('#', '');
        const id = decodeURIComponent(rawHref);
        const heading = document.getElementById(id);
        if (heading && heading.getBoundingClientRect().top - 100 < 0) {
            activeIndex = i;
        }
    }

    if (activeIndex !== lastActiveIndex) {
        const newActiveLink = tocLinks[activeIndex];

        // Step 1: 展开目标目录（含父级）
        if (newActiveLink) {
            let parentLi = newActiveLink.closest('li');
            while (parentLi) {
                parentLi.classList.remove('collapsed');
                parentLi = parentLi.parentElement.closest('li');
            }
        }

        // Step 2: 更新 active 状态
        tocLinks.forEach((link, idx) => {
            link.classList.toggle('active', idx === activeIndex);
        });

        // Step 3: 滚动到目标目录
        setTimeout(() => scrollToActiveItem(), 100);

        // Step 4: 折叠非活跃目录（延迟执行，确保动画流畅）
        if (!isMouseInToc) {
            setTimeout(() => collapseNonActiveItems(), 600);
        }

        lastActiveIndex = activeIndex;
    }
}

// 设置目录悬停和点击事件
function setupTocHover() {
    const tocContainer = document.querySelector('.toc');
    if (!tocContainer) return;

    const tocItemsWithChildren = tocContainer.querySelectorAll('li:has(ul)');
    const tocLinks = document.querySelectorAll('.toc a[href^="#"]');

    tocItemsWithChildren.forEach(item => {
        const link = item.querySelector('a');

        item.addEventListener('mouseenter', () => {
            if (isMouseInToc) {
                item.classList.remove('collapsed');
            }
        });

        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();

                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(decodeURIComponent(targetId));

                if (targetElement) {
                    // 使用 scrollIntoView 配合 CSS scroll-margin-top 实现精确滚动
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    tocLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');

                    item.classList.toggle('collapsed');
                    setTimeout(scrollToActiveItem, 300);
                }
            });
        }
    });
}

// 设置目录点击动画增强
function setupTocClickAnimation() {
    const tocLinks = document.querySelectorAll('.toc a[href^="#"]');

    tocLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(decodeURIComponent(targetId));

            if (targetElement) {
                e.preventDefault();

                // 使用 scrollIntoView 配合 CSS scroll-margin-top 实现精确滚动
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });

                tocLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');

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
        item.classList.add('has-children');

        if (link) {
            link.addEventListener('click', function (e) {
                if (this.getAttribute('href') === '#' || this.getAttribute('href') === '#0') {
                    e.preventDefault();
                }
                item.classList.toggle('collapsed');
                e.stopPropagation();
            });

            link.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.classList.toggle('collapsed');
                }
            });
        }
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

    initTocCollapse();

    let scrollTimeout;
    window.addEventListener('scroll', function () {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(onScroll, 100);
    });

    setTimeout(() => {
        setupTocHover();
        onScroll();
        setupTocClickAnimation();
        setupTocSmoothCollapse();
        fixTocFloatStyle();
    }, 500);
}
