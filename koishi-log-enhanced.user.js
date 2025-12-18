// ==UserScript==
// @name         Koishi 控制台日志增强
// @namespace    https://github.com/CookSleep
// @version      1.2
// @description  控制 Koishi 控制台日志滚动 + 一键复制日志全文/内容
// @author       Cook Sleep
// @match        http://localhost:5140/logs*
// @icon         https://koishi.chat/logo.png
// @grant        GM_addStyle
// @license      GPLv3
// @downloadURL  https://github.com/CookSleep/koishi-log-pauser/raw/main/koishi-log-pauser.user.js
// @updateURL    https://github.com/CookSleep/koishi-log-pauser/raw/main/koishi-log-pauser.user.js
// ==/UserScript==

(function() {
    'use strict';

    const SELECTORS = {
        SCROLL_WRAP: '.el-scrollbar__wrap',
        HEADER: '.layout-header',
        TITLE: '.layout-header .left',
        LOG_LINE: '.line'
    };
    const TARGET_TITLE = '日志';

    const ICONS = {
        COPY: `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`,
        CHECK: `<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`,
        PAUSE: `<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
        PLAY: `<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>`
    };

    const STYLES = `
        :root {
            --k-btn-bg: transparent;
            --k-btn-border: #4C4C52;
            --k-btn-text: #B0B0B0;
            --k-btn-hover-border: #7459FF;
            --k-btn-hover-text: #7459FF;
            --k-btn-hover-bg: rgba(116, 89, 255, 0.08);
            --k-btn-radius: 6px;
        }

        @media (prefers-color-scheme: light) {
            :root {
                --k-btn-bg: transparent;
                --k-btn-border: #C8C9CC;
                --k-btn-text: #606266;
                --k-btn-hover-border: #409EFF;
                --k-btn-hover-text: #409EFF;
                --k-btn-hover-bg: rgba(64, 158, 255, 0.08);
            }
        }

        #koishi-log-toggle-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 30px;
            padding: 0 14px;
            margin-left: auto;
            margin-right: 16px;
            font-size: 13px;
            font-weight: 500;
            white-space: nowrap;
            letter-spacing: 0.5px;
            background-color: var(--k-btn-bg);
            border: 1px solid var(--k-btn-border);
            border-radius: var(--k-btn-radius);
            color: var(--k-btn-text);
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            user-select: none;
            z-index: 1000;
        }

        #koishi-log-toggle-btn:hover {
            border-color: var(--k-btn-hover-border);
            color: var(--k-btn-hover-text);
            background-color: var(--k-btn-hover-bg);
        }

        #koishi-log-toggle-btn svg {
            margin-right: 6px;
            width: 14px;
            height: 14px;
        }

        #koishi-log-toggle-btn.paused {
            border-color: #F56C6C;
            color: #F56C6C;
        }

        #koishi-log-toggle-btn.paused:hover {
            background-color: rgba(245, 108, 108, 0.15);
        }

        .line { position: relative !important; }

        .koishi-copy-group {
            position: absolute;
            top: 6px;
            right: 8px;
            display: flex;
            gap: 8px;
            opacity: 0;
            transform: translateY(-2px);
            transition: all 0.2s ease;
            z-index: 100;
        }

        .line:hover .koishi-copy-group {
            opacity: 1;
            transform: translateY(0);
        }

        .koishi-btn {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            background-color: var(--k-btn-bg);
            border: 1px solid var(--k-btn-border);
            border-radius: var(--k-btn-radius);
            color: var(--k-btn-text);
            cursor: pointer;
            transition: all 0.2s;
        }

        .koishi-btn:hover {
            border-color: var(--k-btn-hover-border);
            color: var(--k-btn-hover-text);
            background-color: var(--k-btn-hover-bg);
            transform: translateY(-1px);
        }

        .koishi-btn.success {
            color: #67C23A !important;
            border-color: #67C23A !important;
            background-color: rgba(103, 194, 58, 0.1) !important;
        }

        .koishi-btn::after {
            content: attr(data-label);
            position: absolute;
            bottom: 2px;
            left: 3px;
            font-size: 9px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-weight: 700;
            line-height: 1;
            opacity: 0.6;
        }
    `;

    let isTracking = true;
    let scrollWrap = null;
    let toggleBtn = null;
    let currentScrollTop = 0;
    let initTimer = null;

    function injectStyles() {
        if (document.getElementById('koishi-enhanced-style')) return;
        const style = document.createElement('style');
        style.id = 'koishi-enhanced-style';
        style.textContent = STYLES;
        document.head.appendChild(style);
    }

    function performCopy(btn, mode) {
        const line = btn.closest('.line');
        const codeEl = line.querySelector('code');
        if (!codeEl) return;

        let textToCopy = "";
        if (mode === 'all') {
            textToCopy = codeEl.innerText.trim();
        } else {
            const spans = codeEl.querySelectorAll('span');
            if (spans.length >= 2) {
                const lastSpan = spans[spans.length - 1];
                let content = "";
                let nextNode = lastSpan.nextSibling;
                while (nextNode) {
                    content += nextNode.textContent;
                    nextNode = nextNode.nextSibling;
                }
                textToCopy = content.trim();
            } else {
                textToCopy = codeEl.innerText.trim();
            }
        }

        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = ICONS.CHECK;
            btn.classList.add('success');
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.classList.remove('success');
            }, 1000);
        });
    }

    function addCopyGroup() {
        document.addEventListener('mouseover', (e) => {
            const line = e.target.closest('.line');
            if (line && !line.querySelector('.koishi-copy-group')) {
                const group = document.createElement('div');
                group.className = 'koishi-copy-group';

                const btnText = document.createElement('div');
                btnText.className = 'koishi-btn';
                btnText.setAttribute('data-label', 'T');
                btnText.title = '仅复制内容 (Text)';
                btnText.innerHTML = ICONS.COPY;
                btnText.onclick = (ev) => { ev.stopPropagation(); performCopy(btnText, 'text'); };

                const btnAll = document.createElement('div');
                btnAll.className = 'koishi-btn';
                btnAll.setAttribute('data-label', 'All');
                btnAll.title = '复制整行 (All)';
                btnAll.innerHTML = ICONS.COPY;
                btnAll.onclick = (ev) => { ev.stopPropagation(); performCopy(btnAll, 'all'); };

                group.appendChild(btnText);
                group.appendChild(btnAll);
                line.appendChild(group);
            }
        });
    }

    function init() {
        if (initTimer) clearInterval(initTimer);
        injectStyles();
        initTimer = setInterval(() => {
            const header = document.querySelector(SELECTORS.HEADER);
            const titleEl = document.querySelector(SELECTORS.TITLE);
            scrollWrap = document.querySelector(SELECTORS.SCROLL_WRAP);
            if (header && scrollWrap && titleEl?.textContent.trim() === TARGET_TITLE) {
                if (!document.getElementById('koishi-log-toggle-btn')) {
                    createScrollBtn(header);
                    hijackScroll();
                    addCopyGroup();
                    scrollWrap.addEventListener('scroll', () => { if (!isTracking) currentScrollTop = scrollWrap.scrollTop; });
                }
            }
        }, 500);
    }

    function createScrollBtn(header) {
        toggleBtn = document.createElement('div');
        toggleBtn.id = 'koishi-log-toggle-btn';
        updateScrollBtn();
        toggleBtn.onclick = () => {
            isTracking = !isTracking;
            if (isTracking) scrollWrap.scrollTop = scrollWrap.scrollHeight;
            else currentScrollTop = scrollWrap.scrollTop;
            updateScrollBtn();
        };
        header.style.display = 'flex';
        header.appendChild(toggleBtn);
    }

    function updateScrollBtn() {
        toggleBtn.innerHTML = isTracking ? `${ICONS.PAUSE} 跟踪中` : `${ICONS.PLAY} 已暂停`;
        toggleBtn.className = isTracking ? '' : 'paused';
    }

    function hijackScroll() {
        if (!scrollWrap || scrollWrap.hasOwnProperty('scrollTop')) return;
        const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTop');
        Object.defineProperty(scrollWrap, 'scrollTop', {
            get: function() { return descriptor.get.call(this); },
            set: function(value) { descriptor.set.call(this, isTracking ? value : currentScrollTop); },
            configurable: true
        });
    }

    init();
    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastUrl) { lastUrl = location.href; init(); }
        else if (document.querySelector(SELECTORS.TITLE)?.textContent.trim() === TARGET_TITLE && !document.getElementById('koishi-log-toggle-btn')) { init(); }
    }).observe(document.body, { subtree: true, childList: true });
})();
