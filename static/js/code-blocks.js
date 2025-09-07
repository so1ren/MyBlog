// 代码块配置
const CODE_BLOCK_CONFIG = {
    lineThreshold: 20,
    languageAliases: {
        yml: 'yaml', sh: 'bash', zsh: 'bash', shell: 'bash',
        js: 'javascript', ts: 'typescript', py: 'python',
        rs: 'rust', docker: 'dockerfile', mk: 'makefile', conf: 'ini'
    }
};

function getLanguageName(classes) {
    const langClass = classes.find(c =>
        c.startsWith('language-') ||
        c.startsWith('chroma-language-') ||
        c.startsWith('chroma-')
    );
    let name = langClass
        ? langClass.replace(/^(language|chroma-language|chroma)-/, '')
        : 'code';
    if (CODE_BLOCK_CONFIG.languageAliases[name]) name = CODE_BLOCK_CONFIG.languageAliases[name];
    if (name === 'html' || name === 'xml') return 'HTML';
    if (name === 'bash') return 'BASH';
    if (name === 'yaml') return 'YAML';
    return name.length > 1 ? name.toUpperCase() : name;
}

function getOrCreateHeader(block) {
    let h = block.querySelector('.code-header');
    if (!h) {
        h = document.createElement('div');
        h.className = 'code-header';
        block.prepend(h);
    }
    h.innerHTML = '';
    return h;
}

function createButton(cls, title, svg) {
    const b = document.createElement('button');
    b.className = `code-btn ${cls}`;
    b.title = title;
    b.innerHTML = svg;
    return b;
}

function waitAndFill(block) {
    let lastText = '';
    let stableTimer = 0;
    const tick = () => {
        const codeEl = block.querySelector('code');
        if (!codeEl) { requestAnimationFrame(tick); return; }
        const currText = codeEl.textContent;
        if (currText !== lastText) {
            lastText = currText;
            stableTimer = 0;
            requestAnimationFrame(tick);
            return;
        }
        stableTimer++;
        if (stableTimer < 3) {
            requestAnimationFrame(tick);
            return;
        }
        realFill(block, codeEl);
    };
    requestAnimationFrame(tick);
}

function realFill(block, codeEl) {
    if (block.dataset.filled) return;
    block.dataset.filled = 'true';

    const classes = Array.from(codeEl.classList);
    const lang = getLanguageName(classes);
    const lines = codeEl.textContent.trim().split('\n').length;

    const header = block.querySelector('.code-header');
    const langSpan = header.querySelector('.code-lang');
    const foldBtn = header.querySelector('.fold-btn');
    const copyBtn = header.querySelector('.copy-btn');

    /* 折叠逻辑 */
    const toggleFold = () => {
        const collapsed = block.classList.toggle('collapsed');
        foldBtn.title = collapsed ? '展开代码' : '折叠代码';
        foldBtn.innerHTML = collapsed
            ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>'
            : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';
        langSpan.textContent = collapsed ? `${lang} (${lines} 行 - 已折叠)` : `${lang} (${lines} 行)`;
    };

    foldBtn.addEventListener('click', e => { e.stopPropagation(); toggleFold(); });
    header.addEventListener('click', toggleFold);

    /* 复制逻辑 */
    copyBtn.addEventListener('click', e => {
        e.stopPropagation();
        navigator.clipboard.writeText(codeEl.innerText)
            .then(() => {
                const old = copyBtn.innerHTML;
                copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
                setTimeout(() => copyBtn.innerHTML = old, 2000);
            })
            .catch(err => console.error('无法复制代码: ', err));
    });

    /* ✅ 初始折叠：直接设置状态，不调用 toggleFold() */
    if (lines > CODE_BLOCK_CONFIG.lineThreshold) {
        block.classList.add('collapsed');
        foldBtn.title = '展开代码';
        foldBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';
        langSpan.textContent = `${lang} (${lines} 行 - 已折叠)`;
    } else {
        langSpan.textContent = `${lang} (${lines} 行)`;
    }
}

function processCodeBlock(block) {
    if (block.dataset.filled) return;

    const header = getOrCreateHeader(block);
    const langSpan = document.createElement('span');
    langSpan.className = 'code-lang';
    langSpan.textContent = 'CODE';

    const btnBox = document.createElement('div');
    btnBox.className = 'code-buttons';

    const foldBtn = createButton('fold-btn', '折叠代码', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>');
    const copyBtn = createButton('copy-btn', '复制代码', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>');

    btnBox.appendChild(foldBtn);
    btnBox.appendChild(copyBtn);
    header.appendChild(langSpan);
    header.appendChild(btnBox);

    waitAndFill(block);
}

function setupCodeBlocks() {
    document.querySelectorAll('.highlight').forEach(processCodeBlock);
}
