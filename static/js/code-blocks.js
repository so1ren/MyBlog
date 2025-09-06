// 代码块配置
const CODE_BLOCK_CONFIG = {
    lineThreshold: 20,
    languageAliases: {
        yml: 'yaml', sh: 'bash', zsh: 'bash', shell: 'bash',
        js: 'javascript', ts: 'typescript', py: 'python',
        rs: 'rust', docker: 'dockerfile', mk: 'makefile', conf: 'ini'
    }
};

// 获取语言名称
function getLanguageName(classes) {
    const languageClass = classes.find(cls => 
        cls.startsWith('language-') || 
        cls.startsWith('chroma-language-') ||
        cls.startsWith('chroma-')
    );
    
    let langName = languageClass ? 
        languageClass.replace('language-', '')
                    .replace('chroma-language-', '')
                    .replace('chroma-', '') : 'code';
    
    // 应用语言别名
    if (CODE_BLOCK_CONFIG.languageAliases[langName]) {
        langName = CODE_BLOCK_CONFIG.languageAliases[langName];
    }
    
    // 特殊处理某些语言名称
    if (langName === 'html' || langName === 'xml') {
        return 'HTML';
    } else if (langName === 'bash') {
        return 'Bash';
    } else if (langName === 'yaml') {
        return 'YAML';
    } else if (langName.length > 1) {
        return langName.charAt(0).toUpperCase() + langName.slice(1);
    }
    
    return langName;
}

// 创建或获取代码块标题栏
function getOrCreateHeader(codeBlock) {
    let header = codeBlock.querySelector('.code-header');
    if (!header) {
        header = document.createElement('div');
        header.className = 'code-header';
        codeBlock.insertBefore(header, codeBlock.firstChild);
    }
    
    header.innerHTML = '';
    return header;
}

// 创建按钮元素
function createButton(className, title, innerHTML) {
    const btn = document.createElement('button');
    btn.className = `code-btn ${className}`;
    btn.title = title;
    btn.innerHTML = innerHTML;
    return btn;
}

// 处理单个代码块
function processCodeBlock(codeBlock) {
    const codeElement = codeBlock.querySelector('code');
    const classes = codeElement ? Array.from(codeElement.classList) : [];
    
    // 获取语言名称
    const langName = getLanguageName(classes);
    
    // 获取代码文本和行数
    const codeText = codeElement ? codeElement.textContent : '';
    const lineCount = codeText.split('\n').length;
    
    // 创建或获取标题栏
    const header = getOrCreateHeader(codeBlock);
    
    // 添加语言标签
    const langSpan = document.createElement('span');
    langSpan.className = 'code-lang';
    langSpan.textContent = `${langName} (${lineCount-1} 行)`;
    header.appendChild(langSpan);
    
    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'code-buttons';
    
    // 添加折叠按钮
    const foldBtn = createButton('fold-btn', '折叠代码', 
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>'
    );
    buttonContainer.appendChild(foldBtn);
    
    // 添加复制按钮
    const copyBtn = createButton('copy-btn', '复制代码', 
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
    );
    buttonContainer.appendChild(copyBtn);
    
    header.appendChild(buttonContainer);
    
    // 切换折叠状态函数
    const toggleFold = function() {
        codeBlock.classList.toggle('collapsed');
        if (codeBlock.classList.contains('collapsed')) {
            foldBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';
            foldBtn.title = '展开代码';
            langSpan.textContent = `${langName} (${lineCount-1} 行)`;
        } else {
            foldBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';
            foldBtn.title = '折叠代码';
            langSpan.textContent = `${langName} (${lineCount-1} 行)`;
        }
    };
    
    // 折叠按钮事件
    foldBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleFold();
    });
    
    // 标题栏点击事件
    header.addEventListener('click', function() {
        toggleFold();
    });
    
    // 复制按钮事件
    copyBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const code = codeBlock.querySelector('code').innerText;
        navigator.clipboard.writeText(code).then(function() {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
            setTimeout(function() {
                copyBtn.innerHTML = originalHTML;
            }, 2000);
        }).catch(function(err) {
            console.error('无法复制代码: ', err);
        });
    });
    
    // 自动折叠长代码块
    if (lineCount > CODE_BLOCK_CONFIG.lineThreshold) {
        codeBlock.classList.add('collapsed');
        foldBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';
        foldBtn.title = '展开代码';
        langSpan.textContent = `${langName} (${lineCount -1} 行 - 已折叠)`;
    }
}

// 设置代码块功能
function setupCodeBlocks() {
    document.querySelectorAll('.highlight').forEach(processCodeBlock);
}