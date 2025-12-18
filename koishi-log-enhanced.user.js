// ==UserScript==
// @name         Koishi 控制台日志增强
// @namespace    https://github.com/CookSleep
// @version      1.3
// @description  控制 Koishi 控制台日志滚动 + 一键复制日志正文内容/原始文本
// @author       Cook Sleep
// @match        *://*/*
// @icon         https://koishi.chat/logo.png
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @license      GPLv3
// @downloadURL  https://github.com/CookSleep/koishi-log-enhanced/raw/main/koishi-log-enhanced.user.js
// @updateURL    https://github.com/CookSleep/koishi-log-enhanced/raw/main/koishi-log-enhanced.user.js
// ==/UserScript==

/**
 * 更新说明
 * 
 * v1.3 (2025-12-19)
 * - 改为使用篡改猴菜单打开弹窗修改 Koishi URL（旧版本更新至新版本需由此重新配置）
 * - 仅在配置的 URL 中运行脚本
 * - 新增多控制台支持，可配置多个 Koishi 地址
 */

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
        PLAY: `<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>`,
        CLOSE: `<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
        QUESTION: `<svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" stroke="currentColor" stroke-width="1" d="M11 18h2v-2h-2v2zm1-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/></svg>`
    };

    const DEFAULT_URL = 'http://127.0.0.1:5140';
    const STORAGE_KEY = 'koishi_console_url';

    // 注册篡改猴菜单命令
    GM_registerMenuCommand('⚙️ 设置控制台地址', () => {
        injectStyles();
        showSettingsModal();
    });

    const STYLES = `
        :root {
            --k-btn-bg: transparent;
            --k-btn-border: #4C4C52;
            --k-btn-text: #B0B0B0;
            --k-btn-hover-border: #7459FF;
            --k-btn-hover-text: #7459FF;
            --k-btn-hover-bg: rgba(116, 89, 255, 0.08);
            --k-btn-radius: 6px;
            --k-modal-bg: #252529;
            --k-modal-border: #3a3a44;
            --k-modal-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
            --k-modal-title: #fff;
            --k-modal-label: #999;
            --k-input-bg: #18181c;
            --k-input-border: #3a3a44;
            --k-input-text: #e0e0e0;
            --k-scrollbar-thumb: #4a4a52;
            --k-scrollbar-hover: #5a5a62;
            --k-hint-color: #666;
            --k-copy-btn-bg: rgba(30, 30, 35, 0.85);
            --k-copy-btn-hover-bg: rgba(116, 89, 255, 0.25);
            --k-primary: #7459FF;
            --k-primary-hover: #5a3fd6;
            --k-primary-bg: rgba(116, 89, 255, 0.08);
            --k-primary-bg-hover: rgba(116, 89, 255, 0.15);
            --k-primary-border: rgba(116, 89, 255, 0.4);
        }

        @media (prefers-color-scheme: light) {
            :root {
                --k-btn-bg: transparent;
                --k-btn-border: #C8C9CC;
                --k-btn-text: #606266;
                --k-btn-hover-border: #409EFF;
                --k-btn-hover-text: #409EFF;
                --k-btn-hover-bg: rgba(64, 158, 255, 0.08);
                --k-modal-bg: #FFFFFF;
                --k-modal-border: #e0e0e0;
                --k-modal-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
                --k-modal-title: #333;
                --k-modal-label: #666;
                --k-input-bg: #f5f5f5;
                --k-input-border: #C8C9CC;
                --k-input-text: #333;
                --k-scrollbar-thumb: #c0c0c0;
                --k-scrollbar-hover: #a0a0a0;
                --k-hint-color: #999;
                --k-copy-btn-bg: rgba(255, 255, 255, 0.9);
                --k-copy-btn-hover-bg: rgba(64, 158, 255, 0.15);
                --k-primary: #409EFF;
                --k-primary-hover: #337ecc;
                --k-primary-bg: rgba(64, 158, 255, 0.08);
                --k-primary-bg-hover: rgba(64, 158, 255, 0.15);
                --k-primary-border: rgba(64, 158, 255, 0.4);
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
            background-color: var(--k-copy-btn-bg);
            border: 1px solid var(--k-btn-border);
            border-radius: var(--k-btn-radius);
            color: var(--k-btn-text);
            cursor: pointer;
            transition: all 0.2s;
        }

        .koishi-btn:hover {
            border-color: var(--k-btn-hover-border);
            color: var(--k-btn-hover-text);
            background-color: var(--k-copy-btn-hover-bg);
            transform: translateY(-1px);
        }

        .koishi-btn.success {
            color: #67C23A !important;
            border-color: #67C23A !important;
            background-color: rgba(103, 194, 58, 0.15) !important;
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

        #koishi-settings-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 16px;
            box-sizing: border-box;
        }

        #koishi-settings-modal .modal-content {
            background: var(--k-modal-bg);
            border: 1px solid var(--k-modal-border);
            border-radius: 12px;
            padding: 24px;
            width: 100%;
            max-width: 420px;
            box-shadow: var(--k-modal-shadow);
        }

        #koishi-settings-modal h3 {
            margin: 0 0 20px 0;
            font-size: 18px;
            font-weight: 600;
            color: var(--k-modal-title);
        }

        #koishi-settings-modal .form-group {
            margin-bottom: 20px;
        }

        #koishi-settings-modal label {
            display: block;
            margin-bottom: 8px;
            font-size: 13px;
            color: var(--k-modal-label);
            font-weight: 500;
        }

        #koishi-settings-modal .url-list {
            max-height: 240px;
            overflow-y: auto;
            margin-bottom: 12px;
            padding-right: 4px;
        }

        #koishi-settings-modal .url-list::-webkit-scrollbar {
            width: 4px;
        }

        #koishi-settings-modal .url-list::-webkit-scrollbar-track {
            background: transparent;
        }

        #koishi-settings-modal .url-list::-webkit-scrollbar-thumb {
            background: var(--k-scrollbar-thumb);
            border-radius: 2px;
        }

        #koishi-settings-modal .url-list::-webkit-scrollbar-thumb:hover {
            background: var(--k-scrollbar-hover);
        }

        #koishi-settings-modal .url-item {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }

        #koishi-settings-modal .url-item input {
            flex: 1;
        }

        #koishi-settings-modal .btn-remove {
            position: relative;
            width: 38px;
            height: 38px;
            padding: 0;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--k-input-bg);
            border: 1px solid var(--k-input-border);
            border-radius: var(--k-btn-radius);
            color: var(--k-modal-label);
            cursor: pointer;
            transition: all 0.2s;
        }

        #koishi-settings-modal .btn-remove:hover {
            background: rgba(245, 108, 108, 0.1);
            border-color: #F56C6C;
            color: #F56C6C;
        }

        #koishi-settings-modal .btn-remove .confirm-badge {
            display: none;
            position: absolute;
            bottom: -5px;
            right: -5px;
            width: 18px;
            height: 18px;
            background: #F56C6C;
            border-radius: 50%;
            color: #fff;
            align-items: center;
            justify-content: center;
        }

        #koishi-settings-modal .btn-remove.confirm .confirm-badge {
            display: flex;
        }

        #koishi-settings-modal .btn-remove.confirm {
            border-color: #F56C6C;
            color: #F56C6C;
        }

        #koishi-settings-modal .btn-add {
            width: 100%;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--k-primary-bg);
            border: 1px dashed var(--k-primary-border);
            border-radius: var(--k-btn-radius);
            color: var(--k-primary);
            cursor: pointer;
            transition: all 0.2s;
            font-size: 13px;
            font-weight: 500;
        }

        #koishi-settings-modal .btn-add:hover {
            background: var(--k-primary-bg-hover);
            border-color: var(--k-primary);
        }

        #koishi-settings-modal input {
            width: 100%;
            height: 38px;
            padding: 0 12px;
            font-size: 14px;
            border: 1px solid var(--k-input-border);
            border-radius: var(--k-btn-radius);
            background: var(--k-input-bg);
            color: var(--k-input-text);
            box-sizing: border-box;
            transition: border-color 0.2s;
        }

        #koishi-settings-modal input:focus {
            outline: none;
            border-color: var(--k-btn-hover-border);
        }

        #koishi-settings-modal .modal-buttons {
            display: flex;
            gap: 12px;
            margin-top: 24px;
        }

        #koishi-settings-modal button {
            height: 38px;
            padding: 0 20px;
            font-size: 14px;
            font-weight: 500;
            border-radius: var(--k-btn-radius);
            cursor: pointer;
            transition: all 0.2s;
        }

        #koishi-settings-modal .modal-buttons button {
            flex: 1;
        }

        #koishi-settings-modal .btn-cancel {
            background: transparent;
            border: 1px solid var(--k-btn-border);
            color: var(--k-modal-label);
        }

        #koishi-settings-modal .btn-cancel:hover {
            border-color: var(--k-btn-hover-border);
            color: var(--k-btn-hover-text);
            background-color: var(--k-btn-hover-bg);
        }

        #koishi-settings-modal .btn-save {
            background: var(--k-primary);
            border: none;
            color: #fff;
        }

        #koishi-settings-modal .btn-save:hover {
            background: var(--k-primary-hover);
        }

        #koishi-settings-modal .hint {
            margin-top: 4px;
            font-size: 11px;
            color: var(--k-hint-color);
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

    function showSettingsModal() {
        if (document.getElementById('koishi-settings-modal')) return;
        let urls = GM_getValue(STORAGE_KEY, []);
        if (urls.length === 0) urls = [DEFAULT_URL];

        const modal = document.createElement('div');
        modal.id = 'koishi-settings-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Koishi 控制台日志增强设置</h3>
                <div class="form-group">
                    <label>控制台地址</label>
                    <div class="url-list" id="koishi-url-list"></div>
                    <button type="button" class="btn-add" id="koishi-add-url">+ 添加地址</button>
                    <div class="hint">留空保存则使用默认值 ${DEFAULT_URL}</div>
                </div>
                <div class="modal-buttons">
                    <button class="btn-cancel">取消</button>
                    <button class="btn-save">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const urlList = document.getElementById('koishi-url-list');
        const addUrlBtn = document.getElementById('koishi-add-url');

        function createUrlItem(value = '') {
            const item = document.createElement('div');
            item.className = 'url-item';
            item.innerHTML = `
                <input type="text" value="${value}" placeholder="http://localhost:5140 或 https://koishi.example.com">
                <button type="button" class="btn-remove">${ICONS.CLOSE}<span class="confirm-badge">${ICONS.QUESTION}</span></button>
            `;
            item.querySelector('input').addEventListener('blur', (e) => {
                let val = e.target.value.trim();
                try {
                    const url = new URL(val);
                    val = url.origin;
                } catch {}
                e.target.value = val.replace(/\/+$/, '');
            });
            const removeBtn = item.querySelector('.btn-remove');
            removeBtn.onclick = () => {
                if (urlList.children.length <= 1) return;
                if (removeBtn.classList.contains('confirm')) {
                    item.remove();
                } else {
                    removeBtn.classList.add('confirm');
                    setTimeout(() => removeBtn.classList.remove('confirm'), 2000);
                }
            };
            return item;
        }

        urls.forEach(url => urlList.appendChild(createUrlItem(url)));
        addUrlBtn.onclick = () => urlList.appendChild(createUrlItem());

        modal.querySelector('.btn-cancel').onclick = () => modal.remove();
        modal.querySelector('.btn-save').onclick = () => {
            const inputs = urlList.querySelectorAll('input');
            const newUrls = Array.from(inputs)
                .map(input => input.value.trim().replace(/\/+$/, ''))
                .filter(url => url);
            GM_setValue(STORAGE_KEY, newUrls);
            modal.remove();
        };
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
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

    function getEffectiveUrls() {
        const urls = GM_getValue(STORAGE_KEY, []);
        return urls.length > 0 ? urls : [DEFAULT_URL];
    }

    function isTargetUrl() {
        const urls = getEffectiveUrls();
        return urls.some(url => location.href.startsWith(url));
    }

    function isKoishiLogPage() {
        const titleEl = document.querySelector(SELECTORS.TITLE);
        return titleEl?.textContent.trim() === TARGET_TITLE;
    }

    // 始终只在配置的 URL（包括默认地址）中运行
    if (isTargetUrl()) {
        init();
        let lastUrl = location.href;
        new MutationObserver(() => {
            if (location.href !== lastUrl) { lastUrl = location.href; init(); }
            else if (isKoishiLogPage() && !document.getElementById('koishi-log-toggle-btn')) {
                init();
            }
        }).observe(document.body, { subtree: true, childList: true });
    }
})();
