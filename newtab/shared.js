// 共享数据管理器
class DataManager {
    // 网站数据管理
    static getSites() {
        try {
            const stored = localStorage.getItem('square-inch-sites');
            return stored ? JSON.parse(stored) : this.getExampleSites();
        } catch (error) {
            console.error('加载网站失败:', error);
            return this.getExampleSites();
        }
    }

    static async saveSites(sites) {
        try {
            localStorage.setItem('square-inch-sites', JSON.stringify(sites));
            return true;
        } catch (error) {
            console.error('保存网站失败:', error);
            return false;
        }
    }

    // 标签数据管理
    static getTags() {
        try {
            const stored = localStorage.getItem('square-inch-tags');
            return stored ? JSON.parse(stored) : this.getExampleTags();
        } catch (error) {
            console.error('加载标签失败:', error);
            return this.getExampleTags();
        }
    }

    static async saveTags(tags) {
        try {
            localStorage.setItem('square-inch-tags', JSON.stringify(tags));
            return true;
        } catch (error) {
            console.error('保存标签失败:', error);
            return false;
        }
    }

    // 回收站数据管理
    static getRecycleBin() {
        try {
            const stored = localStorage.getItem('square-inch-recycle-bin');
            return stored ? JSON.parse(stored) : { sites: {}, tags: {} };
        } catch (error) {
            console.error('加载回收站失败:', error);
            return { sites: {}, tags: {} };
        }
    }

    static async saveRecycleBin(recycleBin) {
        try {
            localStorage.setItem('square-inch-recycle-bin', JSON.stringify(recycleBin));
            return true;
        } catch (error) {
            console.error('保存回收站失败:', error);
            return false;
        }
    }

    // 主题管理
    static getTheme() {
        return localStorage.getItem('square-inch-theme') || 'light';
    }

    static setTheme(theme) {
        localStorage.setItem('square-inch-theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }

    // 其他设置
    static getSetting(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(`square-inch-${key}`);
            return value !== null ? JSON.parse(value) : defaultValue;
        } catch (error) {
            return defaultValue;
        }
    }

    static setSetting(key, value) {
        try {
            localStorage.setItem(`square-inch-${key}`, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`保存设置 ${key} 失败:`, error);
            return false;
        }
    }

    // 示例数据
    static getExampleSites() {
        return [
            {
                id: this.generateId(),
                name: '示例一',
                url: 'https://example1.com',
                icon: '',
                tags: ['example-work'],
                sortOrder: {}
            },
            {
                id: this.generateId(),
                name: '示例二',
                url: 'https://example2.com',
                icon: '',
                tags: ['example-study'],
                sortOrder: {}
            },
            {
                id: this.generateId(),
                name: '示例三',
                url: 'https://example3.com',
                icon: '',
                tags: ['example-life'],
                sortOrder: {}
            },
            {
                id: this.generateId(),
                name: '示例四',
                url: 'https://example4.com',
                icon: '',
                tags: ['example-work', 'example-study'],
                sortOrder: {}
            }
        ];
    }

    static getExampleTags() {
        return [
            {
                id: 'example-work',
                name: '工作',
                createdAt: new Date().toISOString()
            },
            {
                id: 'example-study',
                name: '学习',
                createdAt: new Date().toISOString()
            },
            {
                id: 'example-life',
                name: '生活',
                createdAt: new Date().toISOString()
            }
        ];
    }

    // 工具方法
    static generateId() {
        return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static getDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    }

    // 导出导入功能
    static exportData() {
        const data = {
            version: "3.0",
            timestamp: new Date().toISOString(),
            sites: this.getSites(),
            tags: this.getTags(),
            theme: this.getTheme()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `方寸导航_${new Date().toISOString().split('T')[0]}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return true;
    }

    static validateImportData(data) {
        if (!data || typeof data !== 'object') return false;
        if (!Array.isArray(data.sites)) return false;

        for (const site of data.sites) {
            if (!site.id || !site.url || !site.name) return false;
        }

        if (data.tags && !Array.isArray(data.tags)) return false;
        if (data.tags) {
            for (const tag of data.tags) {
                if (!tag.id || !tag.name) return false;
            }
        }

        return true;
    }

    // =================== 全局通知组件 ===================
    
    /**
     * 创建全局通知组件
     * @param {Object} options - 通知配置
     * @param {string} options.type - 通知类型: 'info', 'success', 'warning', 'error'
     * @param {string} options.message - 通知消息
     * @param {string} [options.icon] - 自定义图标SVG
     * @param {boolean} [options.dismissible=true] - 是否可关闭
     * @param {number} [options.duration=0] - 自动关闭时间(ms)，0表示不自动关闭
     * @param {string} [options.containerId] - 容器ID，默认插入到body
     * @param {Function} [options.onDismiss] - 关闭回调
     * @returns {HTMLElement} 通知元素
     */
    static createNotice(options) {
        const {
            type = 'info',
            message = '',
            icon = null,
            dismissible = true,
            duration = 0,
            containerId = null,
            onDismiss = null
        } = options;

        // 预定义图标
        const icons = {
            info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
            </svg>`,
            success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.54 0 4.84 1.04 6.5 2.73"/>
            </svg>`,
            warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>`,
            error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>`
        };

        // 创建或获取固定toast容器（右上角）
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        // 创建通知元素
        const noticeId = 'notice-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const noticeHtml = `
            <div id="${noticeId}" class="toast ${type}">
                <div class="toast-content">
                    <div class="toast-icon">
                        ${icon || icons[type] || icons.info}
                    </div>
                    <div class="toast-message">
                        <span class="toast-title">${this.escapeHtml(message)}</span>
                    </div>
                    ${dismissible ? `
                        <button type="button" class="toast-close" title="关闭">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        // 插入到toast容器
        toastContainer.insertAdjacentHTML('beforeend', noticeHtml);
        
        const noticeElement = document.getElementById(noticeId);

        // 显示动画
        setTimeout(() => {
            noticeElement.classList.add('show');
        }, 10);

        // 关闭函数
        const dismiss = () => {
            if (noticeElement && noticeElement.parentNode) {
                noticeElement.classList.remove('show');
                setTimeout(() => {
                    if (noticeElement.parentNode) {
                        noticeElement.parentNode.removeChild(noticeElement);
                    }
                    if (onDismiss) onDismiss();
                }, 300);
            }
        };

        // 绑定关闭事件
        if (dismissible) {
            const dismissBtn = noticeElement.querySelector('.toast-close');
            if (dismissBtn) {
                dismissBtn.addEventListener('click', dismiss);
            }
        }

        // 自动关闭
        if (duration > 0) {
            setTimeout(dismiss, duration);
        }

        // 返回通知元素和关闭函数
        noticeElement.dismiss = dismiss;
        return noticeElement;
    }

    /**
     * 快捷方法：显示信息通知
     */
    static showInfo(message, options = {}) {
        return this.createNotice({ ...options, type: 'info', message });
    }

    /**
     * 快捷方法：显示成功通知
     */
    static showSuccess(message, options = {}) {
        return this.createNotice({ ...options, type: 'success', message });
    }

    /**
     * 快捷方法：显示警告通知
     */
    static showWarning(message, options = {}) {
        return this.createNotice({ ...options, type: 'warning', message });
    }

    /**
     * 快捷方法：显示错误通知
     */
    static showError(message, options = {}) {
        return this.createNotice({ ...options, type: 'error', message });
    }
} 