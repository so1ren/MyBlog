document.addEventListener('DOMContentLoaded', function() {
    // 等待页面完全渲染后再处理
    setTimeout(function() {
        // 初始化代码块功能
        if (typeof setupCodeBlocks === 'function') {
            setupCodeBlocks();
        }
        
        // 初始化目录功能
        if (typeof setupToc === 'function') {
            setupToc();
        }
    }, 100);
});