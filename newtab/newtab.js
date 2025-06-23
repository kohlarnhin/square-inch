// 方寸 (Square Inch) - 新标签页主要功能
class SquareInch {
    constructor() {
        this.sites = [];
        this.tags = [];
        this.currentEditingId = null;
        this.currentTagDeleteId = null;
        this.currentTag = 'all'; // 当前选中的标签
        this.activeDeleteRestore = null; // 当前激活的删除恢复函数

        this.init();
    }

    // 初始化应用
    async init() {
        this.showLoading();
        
        try {
            await this.loadSites();
            await this.loadTags();
            this.setupEventListeners();
            this.startClock();
            this.renderTags();
            this.renderSites();
            this.checkAndShowExampleNotice();
            
            // 检查是否需要添加新网站（来自右键菜单）
            this.checkUrlParams();
        } catch (error) {
            console.error('初始化失败:', error);
        } finally {
            this.hideLoading();
        }
    }

    // 检查URL参数，处理右键菜单添加网站
    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        
        if (action === 'add') {
            const fullUrl = urlParams.get('url');
            
            if (fullUrl) {
                // 打开添加网站模态框并填充完整URL
                this.openModal();
                
                // 填充表单，填充完整网址
                setTimeout(() => {
                    document.getElementById('bookmark-url').value = fullUrl;
                    document.getElementById('bookmark-name').focus();
                }, 100);
                
                // 清除URL参数
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            }
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        // 模态框关闭按钮
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        // 取消按钮
        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.closeModal();
        });

        // 表单提交
        document.getElementById('bookmark-form').addEventListener('submit', (e) => {
            this.handleFormSubmit(e);
        });

        // 删除确认
        document.getElementById('confirm-delete').addEventListener('click', () => {
            this.confirmDelete();
        });

        document.getElementById('cancel-delete').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        // ESC 键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeDeleteModal();
                this.closeImportModal();
                this.closeTagModal();
                this.closeTagDeleteModal();
            }
        });

        // 搜索功能
        this.initSearch();

        // 主题切换功能
        this.initTheme();

        // 导入导出功能
        this.initImportExport();

        // 标签功能
        this.initTags();

        // 绑定网格事件（只绑定一次）
        this.bindGridEvents();

        // 示例数据提示事件
        this.initExampleNotice();
    }

    // 启动时钟
    startClock() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }

    // 更新时钟显示
    updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('zh-CN', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const dateString = now.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });

        document.getElementById('current-time').textContent = timeString;
        document.getElementById('current-date').textContent = dateString;
    }



    // 从本地存储加载网站
    async loadSites() {
        try {
            const stored = localStorage.getItem('square-inch-sites');
            this.sites = stored ? JSON.parse(stored) : this.getExampleSites();

            // 如果是第一次使用，保存示例网站
            if (!stored) {
                await this.saveSites();
            }
        } catch (error) {
            console.error('加载网站失败:', error);
            this.sites = this.getExampleSites();
        }
    }



    // 获取示例网站
    getExampleSites() {
        return [
            {
                id: this.generateId(),
                name: '示例一',
                url: 'https://example1.com',
                icon: '',
                tags: ['example-work'] // 对应工作标签
            },
            {
                id: this.generateId(),
                name: '示例二',
                url: 'https://example2.com',
                icon: '',
                tags: ['example-study'] // 对应学习标签
            },
            {
                id: this.generateId(),
                name: '示例三',
                url: 'https://example3.com',
                icon: '',
                tags: ['example-life'] // 对应生活标签
            },
            {
                id: this.generateId(),
                name: '示例四',
                url: 'https://example4.com',
                icon: '',
                tags: ['example-work', 'example-study'] // 多个标签
            }
        ];
    }

    // 保存网站到本地存储
    async saveSites() {
        try {
            localStorage.setItem('square-inch-sites', JSON.stringify(this.sites));
        } catch (error) {
            console.error('保存网站失败:', error);
        }
    }

    // 渲染网站网格
    renderSites() {
        const grid = document.getElementById('navigation-grid');

        // 根据当前标签过滤网站
        let filteredSites = this.sites;
        if (this.currentTag !== 'all') {
            filteredSites = this.sites.filter(site =>
                site.tags && site.tags.includes(this.currentTag)
            );
        }

        // 渲染现有网站卡片
        const siteCards = filteredSites.map(site => {
            const iconContent = this.getIconContent(site);
            return `
                <div class="nav-card" data-id="${site.id}">
                    <div class="card-actions">
                        <button class="card-action-btn edit-btn" data-action="edit" data-id="${site.id}" title="编辑">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="card-action-btn delete-btn" data-action="delete" data-id="${site.id}" title="删除">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                            </svg>
                        </button>
                    </div>
                    ${iconContent}
                    <div class="nav-content">
                        <div class="nav-name">${this.escapeHtml(site.name || this.getDomain(site.url))}</div>
                        <div class="nav-url">${this.escapeHtml(this.getDomain(site.url))}</div>
                    </div>
                </div>
            `;
        }).join('');

        // 添加"添加"卡片
        const addCard = `
            <div class="nav-card add-card" data-action="add">
                <div class="add-icon">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </div>
            </div>
        `;

        grid.innerHTML = siteCards + addCard;
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 恢复所有删除确认状态
    restoreAllDeleteConfirms() {
        if (this.activeDeleteRestore) {
            this.activeDeleteRestore();
            this.activeDeleteRestore = null;
        }
    }

    // 获取默认图标


    // 获取域名
    getDomain(url) {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url;
        }
    }

    // 获取图标内容（图片或文字）
    getIconContent(site) {
        if (site.icon && site.icon.trim()) {
            // 有图标URL，显示图片，失败时显示文字
            return `<img class="nav-icon" 
                        src="${site.icon}" 
                        alt="${site.name || '网站'}" 
                        loading="lazy"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="nav-icon nav-icon-text" style="display: none;">${this.getIconText(site)}</div>`;
        } else {
            // 没有图标，直接显示文字
            return `<div class="nav-icon nav-icon-text">${this.getIconText(site)}</div>`;
        }
    }

    // 获取图标文字（网站名称首字母或域名首字母）
    getIconText(site) {
        if (site.name && site.name.trim()) {
            // 如果有网站名称，取首字母
            const firstChar = site.name.trim().charAt(0).toUpperCase();
            return firstChar;
        } else {
            // 如果没有名称，取域名首字母
            const domain = this.getDomain(site.url);
            return domain.charAt(0).toUpperCase();
        }
    }

    // HTML 转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 显示/隐藏加载指示器
    showLoading() {
        document.getElementById('loading-indicator').classList.add('show');
    }

    hideLoading() {
        document.getElementById('loading-indicator').classList.remove('show');
    }

    // 打开模态框
    openModal(site = null) {
        const modal = document.getElementById('bookmark-modal');
        const modalContent = modal.querySelector('.modal-content');
        const form = document.getElementById('bookmark-form');
        const title = document.getElementById('modal-title');
        
        // 为添加网站弹窗添加CSS类
        modalContent.classList.add('bookmark-modal');

        // 更新标签选择器
        this.updateTagsSelect();

        if (site) {
            // 编辑模式
            title.textContent = '编辑网站';
            document.getElementById('bookmark-name').value = site.name || '';
            document.getElementById('bookmark-url').value = site.url;
            document.getElementById('bookmark-icon').value = site.icon || '';

            // 使用 setTimeout 确保 DOM 更新完成后再设置选中状态
            setTimeout(() => {
            const tagsSelector = document.getElementById('bookmark-tags');
            const tagOptions = tagsSelector.querySelectorAll('.select-option');
            tagOptions.forEach(option => {
                const tagId = option.dataset.tagId;
                if (site.tags && site.tags.includes(tagId)) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            });
            this.updateSelectDisplay(tagsSelector);
            }, 0);

            this.currentEditingId = site.id;
        } else {
            // 添加模式
            title.textContent = '添加网站';
            form.reset();
            
            // 清除标签选择状态
            setTimeout(() => {
                const tagsSelector = document.getElementById('bookmark-tags');
                const tagOptions = tagsSelector.querySelectorAll('.select-option');
                tagOptions.forEach(option => option.classList.remove('selected'));
                this.updateSelectDisplay(tagsSelector);
            }, 0);
            
            this.currentEditingId = null;
        }

        modal.classList.add('show');
        document.getElementById('bookmark-name').focus();
    }

    // 关闭模态框
    closeModal() {
        const modal = document.getElementById('bookmark-modal');
        modal.classList.remove('show');
        this.currentEditingId = null;
        document.getElementById('bookmark-form').reset();

        // 清除标签选择状态
        const tagsSelector = document.getElementById('bookmark-tags');
        const tagOptions = tagsSelector.querySelectorAll('.select-option');
        tagOptions.forEach(option => option.classList.remove('selected'));
        tagsSelector.classList.remove('open');
        this.updateSelectDisplay(tagsSelector);
    }

    // 处理表单提交
    async handleFormSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);

        // 获取选中的标签
        const selectedTags = Array.from(document.querySelectorAll('#bookmark-tags .select-option.selected'))
            .map(option => option.dataset.tagId);

        const siteData = {
            name: formData.get('name').trim(),
            url: formData.get('url').trim(),
            icon: formData.get('icon').trim(),
            tags: selectedTags
        };

        // 验证数据
        if (!siteData.name || !siteData.url) {
            alert('请填写网站名称和网址');
            return;
        }

        this.showLoading();

        try {
            // 如果没有提供图标，保持为空，不自动获取
            // siteData.icon 保持用户输入的值（可能为空）

            if (this.currentEditingId) {
                // 更新现有网站
                const index = this.sites.findIndex(s => s.id === this.currentEditingId);
                if (index !== -1) {
                    this.sites[index] = {
                        ...this.sites[index],
                        ...siteData
                    };
                }
            } else {
                // 添加新网站
                const newSite = {
                    id: this.generateId(),
                    ...siteData
                };
                this.sites.push(newSite);
            }

            await this.saveSites();
            this.renderSites();
            this.renderTags(); // 刷新左侧标签列表以更新网站数量
            this.closeModal();
        } catch (error) {
            console.error('保存网站失败:', error);
            alert('保存失败，请重试');
        } finally {
            this.hideLoading();
        }
    }

    // 编辑网站
    editSite(id) {
        const site = this.sites.find(s => s.id === id);
        if (site) {
            this.openModal(site);
        }
    }

    // 删除网站
    deleteSite(id, deleteBtn) {
        // 恢复所有其他的删除确认状态
        this.restoreAllDeleteConfirms();
        
        const card = deleteBtn.closest('.nav-card');
        const site = this.sites.find(s => s.id === id);
        if (!site) return;
        
        // 保存原内容
        const originalContent = card.innerHTML;
        
        // 创建确认删除的内容，添加动画过渡
        const confirmContent = `
            <div class="delete-confirm-content">
                <span class="confirm-text">删除此网站?</span>
                <div class="confirm-actions">
                    <button class="confirm-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                    </button>
                    <button class="cancel-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        // 添加动画类并设置内容
        card.style.transition = 'none';
        card.classList.add('delete-confirm-mode');
        card.innerHTML = confirmContent;
        
        // 强制重绘后启用过渡
        card.offsetHeight; // 触发重绘
        card.style.transition = '';
        
        // 绑定事件
        const confirmBtn = card.querySelector('.confirm-btn');
        const cancelBtn = card.querySelector('.cancel-btn');
        
        const restore = () => {
            card.classList.remove('delete-confirm-mode');
            card.innerHTML = originalContent;
            this.activeDeleteRestore = null; // 清除激活状态
        };
        
        // 设置当前激活的恢复函数
        this.activeDeleteRestore = restore;
        
        confirmBtn.addEventListener('click', async () => {
            await this.confirmDeleteSite(id);
        });
        
        cancelBtn.addEventListener('click', restore);
        
        // 点击其他地方恢复
        setTimeout(() => {
            document.addEventListener('click', function closeConfirm(e) {
                if (!card.contains(e.target)) {
                    restore();
                    document.removeEventListener('click', closeConfirm);
                }
            });
        }, 0);
    }

    // 确认删除网站
    async confirmDeleteSite(id) {
        this.sites = this.sites.filter(s => s.id !== id);
        await this.saveSites();
        this.renderSites();
        this.renderTags(); // 刷新左侧标签列表以更新网站数量
        this.activeDeleteRestore = null; // 清除激活状态
    }

    // 确认删除（兼容旧的删除模态框）
    async confirmDelete() {
        if (this.currentEditingId) {
            await this.confirmDeleteSite(this.currentEditingId);
            this.closeDeleteModal();
        }
    }

    // 关闭删除确认模态框
    closeDeleteModal() {
        const modal = document.getElementById('delete-modal');
        modal.classList.remove('show');
        this.currentEditingId = null;
    }

    // 验证 URL 格式
    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch {
            return false;
        }
    }

    // 初始化搜索功能
    initSearch() {
        const searchInput = document.getElementById('search-input');
        const clearButton = document.getElementById('clear-search');

        // 搜索输入事件
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            this.filterSites(query);

            // 显示/隐藏清除按钮
            if (query) {
                clearButton.style.display = 'block';
            } else {
                clearButton.style.display = 'none';
            }
        });

        // 清除搜索
        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            clearButton.style.display = 'none';
            this.filterSites('');
            searchInput.focus();
        });

        // 回车键搜索
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchInput.value.trim();
                if (query) {
                    this.filterSites(query);
                }
            }
        });
    }

    // 过滤网站
    filterSites(query) {
        if (!query) {
            // 没有搜索词，显示所有网站
            this.renderSites();
            return;
        }

        // 模糊搜索
        const filteredSites = this.sites.filter(site => {
            const name = (site.name || '').toLowerCase();
            const url = (site.url || '').toLowerCase();
            const domain = this.getDomain(site.url).toLowerCase();
            const searchQuery = query.toLowerCase();

            return name.includes(searchQuery) ||
                   url.includes(searchQuery) ||
                   domain.includes(searchQuery);
        });

        this.renderFilteredSites(filteredSites);
    }

    // 渲染过滤后的网站
    renderFilteredSites(filteredSites) {
        const grid = document.getElementById('navigation-grid');

        if (filteredSites.length === 0) {
            // 没有搜索结果
            grid.innerHTML = `
                <div class="no-results">
                    <div class="no-results-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="m21 21-4.35-4.35"></path>
                        </svg>
                    </div>
                    <div class="no-results-text">没有找到匹配的网站</div>
                    <div class="no-results-hint">尝试使用不同的关键词搜索</div>
                </div>
            `;
            return;
        }

        // 渲染过滤后的网站卡片
        const siteCards = filteredSites.map(site => {
            const iconContent = this.getIconContent(site);
            return `
                <div class="nav-card" data-id="${site.id}">
                    <div class="card-actions">
                        <button class="card-action-btn edit-btn" data-action="edit" data-id="${site.id}" title="编辑">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="card-action-btn delete-btn" data-action="delete" data-id="${site.id}" title="删除">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                            </svg>
                        </button>
                    </div>
                    ${iconContent}
                    <div class="nav-content">
                        <div class="nav-name">${this.escapeHtml(site.name || this.getDomain(site.url))}</div>
                        <div class="nav-url">${this.escapeHtml(this.getDomain(site.url))}</div>
                    </div>
                </div>
            `;
        }).join('');

        grid.innerHTML = siteCards;
    }

    // 绑定网格事件
    bindGridEvents() {
        const grid = document.getElementById('navigation-grid');

        // 使用事件委托处理所有点击事件
        grid.addEventListener('click', (e) => {
            const card = e.target.closest('.nav-card');
            if (!card) return;

            // 处理添加卡片点击
            if (card.classList.contains('add-card')) {
                this.openModal();
                return;
            }

            const actionBtn = e.target.closest('.card-action-btn');
            if (actionBtn) {
                // 处理操作按钮点击
                const action = actionBtn.dataset.action;
                const id = actionBtn.dataset.id;

                if (action === 'edit') {
                    this.editSite(id);
                } else if (action === 'delete') {
                    this.deleteSite(id, actionBtn);
                }
                return;
            }

            // 处理卡片点击（打开网址）
            const id = card.dataset.id;
            const site = this.sites.find(s => s.id === id);
            if (site) {
                this.openUrl(site.url);
            }
        });
    }

    // 初始化主题功能
    initTheme() {
        // 从本地存储加载主题设置
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);

        // 绑定主题切换按钮事件
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });
    }

    // 设置主题
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.currentTheme = theme;
    }

    // 切换主题
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    // 获取当前主题
    getCurrentTheme() {
        return this.currentTheme || 'light';
    }

    // 打开URL的统一方法
    openUrl(url) {
        // 检查是否为浏览器内部协议
        if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('edge://') || url.startsWith('about:')) {
            // 对于浏览器内部协议，使用chrome.tabs.create API
            try {
                if (chrome && chrome.tabs) {
                    chrome.tabs.create({ url: url });
                } else {
                    // 如果chrome.tabs API不可用，则在当前窗口打开
                    window.location.href = url;
                }
            } catch (error) {
                console.warn('无法使用chrome.tabs API，使用fallback方法:', error);
                window.location.href = url;
            }
        } else {
            // 对于其他协议，先尝试在新标签页打开
            try {
                window.open(url, '_blank');
            } catch (error) {
                // 如果window.open失败，则直接导航
                console.warn('window.open失败，使用fallback方法:', error);
                window.location.href = url;
            }
        }
    }

    // 选择所有导入项
    selectAllImportItems(checked) {
        const checkboxes = document.querySelectorAll('#import-preview input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
    }

    // 只选择新增项
    selectNewImportItems() {
        const checkboxes = document.querySelectorAll('#import-preview input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            const item = checkbox.closest('.import-preview-item');
            checkbox.checked = item.dataset.type === 'new';
        });
    }

    // 加载标签
    async loadTags() {
        try {
            const stored = localStorage.getItem('square-inch-tags');
            this.tags = stored ? JSON.parse(stored) : this.getExampleTags();

            // 如果是第一次使用，保存示例标签
            if (!stored) {
                await this.saveTags();
            }
        } catch (error) {
            console.error('加载标签失败:', error);
            this.tags = this.getExampleTags();
        }
    }

    // 获取示例标签
    getExampleTags() {
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

    // 保存标签
    async saveTags() {
        try {
            localStorage.setItem('square-inch-tags', JSON.stringify(this.tags));
        } catch (error) {
            console.error('保存标签失败:', error);
        }
    }

    // 渲染标签列表
    renderTags() {
        const tagsList = document.getElementById('tags-list');

        // 全部标签
        const allTag = `
            <div class="tag-item ${this.currentTag === 'all' ? 'active' : ''}" data-tag="all">
                <div class="tag-content">
                    <span class="tag-name">全部</span>
                    <span class="tag-count">${this.sites.length}</span>
                </div>
                <div class="tag-actions">
                    <!-- 全部标签没有删除按钮，但保留空间以对齐 -->
                </div>
            </div>
        `;

        // 自定义标签
        const customTags = this.tags.map(tag => {
            const count = this.sites.filter(site =>
                site.tags && site.tags.includes(tag.id)
            ).length;

            return `
                <div class="tag-item ${this.currentTag === tag.id ? 'active' : ''}" data-tag="${tag.id}">
                    <div class="tag-content">
                        <span class="tag-name">${this.escapeHtml(tag.name)}</span>
                        <span class="tag-count">${count}</span>
                    </div>
                    <div class="tag-actions">
                        <button class="tag-delete" data-tag-id="${tag.id}" title="删除标签">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // 添加标签按钮
        const addTag = `
            <div class="tag-item add-tag-item" data-action="add-tag">
                <svg class="add-tag-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </div>
        `;

        tagsList.innerHTML = allTag + customTags + addTag;
    }

    // 初始化标签功能
    initTags() {
        // 标签点击事件（使用事件委托）
        document.getElementById('tags-list').addEventListener('click', (e) => {
            const tagItem = e.target.closest('.tag-item');
            if (!tagItem) return;

            // 处理删除标签按钮
            if (e.target.closest('.tag-delete')) {
                e.stopPropagation();
                const deleteBtn = e.target.closest('.tag-delete');
                const tagId = deleteBtn.dataset.tagId;
                this.deleteTag(tagId, deleteBtn);
                return;
            }

            // 处理添加标签
            if (tagItem.dataset.action === 'add-tag') {
                this.openTagModal();
                return;
            }

            // 处理标签选择
            const tagId = tagItem.dataset.tag;
            this.selectTag(tagId);
        });

        // 标签模态框事件
        document.getElementById('close-tag-modal').addEventListener('click', () => {
            this.closeTagModal();
        });

        document.getElementById('cancel-tag-btn').addEventListener('click', () => {
            this.closeTagModal();
        });

        document.getElementById('tag-form').addEventListener('submit', (e) => {
            this.handleTagFormSubmit(e);
        });

        // 标签删除确认事件
        document.getElementById('cancel-tag-delete').addEventListener('click', () => {
            this.closeTagDeleteModal();
        });

        document.getElementById('confirm-tag-delete').addEventListener('click', () => {
            this.confirmTagDelete();
        });
    }

    // 选择标签
    selectTag(tagId) {
        this.currentTag = tagId;
        this.renderTags();
        this.renderSites();
    }

    // 打开标签模态框
    openTagModal() {
        document.getElementById('tag-name').value = '';
        const modal = document.getElementById('tag-modal');
        const modalContent = modal.querySelector('.modal-content');
        
        // 为添加标签弹窗添加CSS类
        modalContent.classList.add('tag-modal');
        
        modal.classList.add('show');
        document.getElementById('tag-name').focus();
    }

    // 关闭标签模态框
    closeTagModal() {
        document.getElementById('tag-modal').classList.remove('show');
    }

    // 处理标签表单提交
    async handleTagFormSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const name = formData.get('name').trim();

        if (!name) {
            this.showToast('请输入标签名称', 'error');
            return;
        }

        // 检查标签名称是否已存在
        if (this.tags.some(tag => tag.name.toLowerCase() === name.toLowerCase())) {
            this.showToast('标签名称已存在', 'error');
            return;
        }

        // 创建新标签
        const newTag = {
            id: this.generateId(),
            name: name,
            createdAt: new Date().toISOString()
        };

        this.tags.push(newTag);
        await this.saveTags();

        this.renderTags();
        this.updateTagsSelect();
        this.closeTagModal();

        this.showToast('标签添加成功！', 'success');
    }

    // 删除标签
    deleteTag(tagId, deleteBtn) {
        // 恢复所有其他的删除确认状态
        this.restoreAllDeleteConfirms();
        
        const tag = this.tags.find(t => t.id === tagId);
        if (!tag) return;

        // 检查是否有网站使用了这个标签
        const sitesWithTag = this.sites.filter(site =>
            site.tags && site.tags.includes(tagId)
        );

        // 如果有关联网站，不允许删除
        if (sitesWithTag.length > 0) {
            this.showToast(`无法删除标签"${tag.name}"，该标签下还有 ${sitesWithTag.length} 个关联网站`, 'error');
            return;
        }

        const tagItem = deleteBtn.closest('.tag-item');
        
        // 保存原内容
        const originalContent = tagItem.innerHTML;
        
        // 创建确认删除的内容
        const confirmContent = `
            <div class="delete-confirm-content">
                <span class="confirm-text">删除?</span>
                <div class="confirm-actions">
                    <button class="confirm-btn">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                    </button>
                    <button class="cancel-btn">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        // 添加动画类并设置内容
        tagItem.style.transition = 'none';
        tagItem.classList.add('delete-confirm-mode');
        tagItem.innerHTML = confirmContent;
        
        // 强制重绘后启用过渡
        tagItem.offsetHeight; // 触发重绘
        tagItem.style.transition = '';
        
        // 绑定事件
        const confirmBtn = tagItem.querySelector('.confirm-btn');
        const cancelBtn = tagItem.querySelector('.cancel-btn');
        
        const restore = () => {
            tagItem.classList.remove('delete-confirm-mode');
            tagItem.innerHTML = originalContent;
            this.activeDeleteRestore = null; // 清除激活状态
        };
        
        // 设置当前激活的恢复函数
        this.activeDeleteRestore = restore;
        
        confirmBtn.addEventListener('click', async () => {
            await this.confirmDeleteTag(tagId);
        });
        
        cancelBtn.addEventListener('click', restore);
        
        // 点击其他地方恢复
        setTimeout(() => {
            document.addEventListener('click', function closeConfirm(e) {
                if (!tagItem.contains(e.target)) {
                    restore();
                    document.removeEventListener('click', closeConfirm);
                }
            });
        }, 0);
    }

    // 确认删除标签
    async confirmDeleteTag(tagId) {
        // 删除标签
        this.tags = this.tags.filter(tag => tag.id !== tagId);
        await this.saveTags();

        // 如果当前选中的是被删除的标签，切换到"全部"
        if (this.currentTag === tagId) {
            this.currentTag = 'all';
        }

        // 重新渲染
        this.renderTags();
        this.renderSites();
        this.updateTagsSelect();
        this.activeDeleteRestore = null; // 清除激活状态

        this.showToast('标签删除成功', 'success');
    }

    // 关闭标签删除模态框（兼容旧代码）
    closeTagDeleteModal() {
        document.getElementById('tag-delete-modal').classList.remove('show');
        this.currentTagDeleteId = null;
    }

    // 确认删除标签（兼容旧的删除模态框）
    async confirmTagDelete() {
        if (!this.currentTagDeleteId) return;

        // 再次检查是否有关联网站（双重保险）
        const sitesWithTag = this.sites.filter(site =>
            site.tags && site.tags.includes(this.currentTagDeleteId)
        );

        if (sitesWithTag.length > 0) {
            this.showToast('删除失败：该标签下还有关联网站', 'error');
        this.closeTagDeleteModal();
            return;
        }

        await this.confirmDeleteTag(this.currentTagDeleteId);
        this.closeTagDeleteModal();
    }

    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // 重置标签选择器分页状态
    resetTagsSelectPagination() {
        const selector = document.getElementById('bookmark-tags');
        if (selector) {
            // 重置分页数据
            selector.tagsPagination = {
                currentPage: 0,
                pageSize: 5,
                totalTags: this.tags.length
            };
        }
    }

    // 更新标签选择器
    updateTagsSelect() {
        const selector = document.getElementById('bookmark-tags');
        const optionsContainer = selector.querySelector('.select-options');

        if (this.tags.length === 0) {
            optionsContainer.innerHTML = `
                <div class="select-option disabled">暂无可选标签</div>
                <div class="select-option add-new-tag">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    <span>新增标签</span>
                </div>`;
            this.bindAddTagEvent(selector);
            return;
        }

        // 分页数据
        selector.tagsPagination = {
            currentPage: 0,
            pageSize: 5,
            totalTags: this.tags.length,
            loadedTags: []
        };

        // 渲染初始5个标签
        this.renderTagsList(selector);

        // 只在未初始化时初始化下拉列表功能
        if (!selector.dataset.initialized) {
            this.initCustomSelect(selector);
            selector.dataset.initialized = 'true';
        }
    }

    // 渲染标签列表
    renderTagsList(selector) {
        const optionsContainer = selector.querySelector('.select-options');
        const pagination = selector.tagsPagination;
        const startIndex = pagination.currentPage * pagination.pageSize;
        const endIndex = Math.min(startIndex + pagination.pageSize, this.tags.length);
        
        // 获取新的标签
        const newTags = this.tags.slice(startIndex, endIndex);
        pagination.loadedTags.push(...newTags);
        pagination.currentPage++;
        pagination.hasMore = endIndex < this.tags.length;

        // 生成所有已加载标签的HTML
        const tagsHTML = pagination.loadedTags.map(tag =>
            `<div class="select-option" data-tag-id="${tag.id}">
                <span class="option-label">${this.escapeHtml(tag.name)}</span>
                <svg class="option-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
            </div>`
        ).join('');

        // 固定在底部的新增标签按钮
        const addTagHTML = `
            <div class="select-option add-new-tag">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>新增标签</span>
            </div>`;

        // 构建完整的HTML结构
        optionsContainer.innerHTML = `
            <div class="tags-scroll-area">${tagsHTML}</div>
            ${addTagHTML}
        `;

        this.bindAddTagEvent(selector);
        this.bindScrollEvent(selector);
    }

    // 绑定新增标签事件
    bindAddTagEvent(selector) {
        const addTagBtn = selector.querySelector('.add-new-tag');
        if (addTagBtn && !addTagBtn.dataset.bound) {
            addTagBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                selector.classList.remove('open');
                this.openTagModal();
            });
            addTagBtn.dataset.bound = 'true';
        }
    }

    // 绑定滚动事件
    bindScrollEvent(selector) {
        const scrollArea = selector.querySelector('.tags-scroll-area');
        if (scrollArea && !scrollArea.dataset.scrollBound) {
            scrollArea.addEventListener('scroll', () => {
                const pagination = selector.tagsPagination;
                if (pagination && pagination.hasMore) {
                    if (scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - 10) {
                        this.loadMoreTags(selector);
                    }
                }
            });
            scrollArea.dataset.scrollBound = 'true';
        }
    }

    // 加载更多标签
    loadMoreTags(selector) {
        const pagination = selector.tagsPagination;
        const startIndex = pagination.currentPage * pagination.pageSize;
        const endIndex = Math.min(startIndex + pagination.pageSize, this.tags.length);
        
        if (startIndex < this.tags.length) {
            const newTags = this.tags.slice(startIndex, endIndex);
            pagination.loadedTags.push(...newTags);
            pagination.currentPage++;
            pagination.hasMore = endIndex < this.tags.length;

            // 只更新滚动区域
            const scrollArea = selector.querySelector('.tags-scroll-area');
            const newTagsHTML = newTags.map(tag =>
                `<div class="select-option" data-tag-id="${tag.id}">
                    <span class="option-label">${this.escapeHtml(tag.name)}</span>
                    <svg class="option-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20,6 9,17 4,12"></polyline>
                    </svg>
                </div>`
            ).join('');
            
            scrollArea.insertAdjacentHTML('beforeend', newTagsHTML);
        }
    }



    // 初始化自定义下拉列表
    initCustomSelect(selector) {
        const trigger = selector.querySelector('.select-trigger');
        const optionsContainer = selector.querySelector('.select-options');

        // 点击触发器切换下拉列表
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            // 关闭其他可能打开的选择器
            document.querySelectorAll('.custom-select.open').forEach(select => {
                if (select !== selector) {
                    select.classList.remove('open');
                }
            });
            selector.classList.toggle('open');
        });

        // 使用事件委托处理选项点击
        optionsContainer.addEventListener('click', (e) => {
            const option = e.target.closest('.select-option');
            if (option && !option.classList.contains('disabled') && !option.classList.contains('add-new-tag')) {
                option.classList.toggle('selected');
                this.updateSelectDisplay(selector);
            }
        });

        // 只绑定一次全局点击事件
        if (!document.body.dataset.customSelectInitialized) {
        document.addEventListener('click', (e) => {
                // 关闭所有打开的自定义选择器
                document.querySelectorAll('.custom-select.open').forEach(select => {
                    if (!select.contains(e.target)) {
                        select.classList.remove('open');
                    }
                });
            });
            document.body.dataset.customSelectInitialized = 'true';
        }

        // 初始化显示
        this.updateSelectDisplay(selector);
    }

    // 更新选择器显示
    updateSelectDisplay(selector) {
        const selectedOptions = selector.querySelectorAll('.select-option.selected');
        const placeholder = selector.querySelector('.select-placeholder');

        if (selectedOptions.length === 0) {
            placeholder.textContent = '选择标签...';
            placeholder.classList.remove('has-selection');
        } else {
            const selectedNames = Array.from(selectedOptions).map(option =>
                option.querySelector('.option-label').textContent
            );
            placeholder.textContent = `已选择 ${selectedOptions.length} 个标签: ${selectedNames.join(', ')}`;
            placeholder.classList.add('has-selection');
        }
    }

    // 初始化导入导出功能
    initImportExport() {
        // 导出按钮
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportData();
        });

        // 导入按钮
        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        // 文件选择
        document.getElementById('import-file').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImportFile(file);
            }
        });

        // 导入模态框事件
        document.getElementById('close-import-modal').addEventListener('click', () => {
            this.closeImportModal();
        });

        document.getElementById('cancel-import').addEventListener('click', () => {
            this.closeImportModal();
        });

        document.getElementById('confirm-import').addEventListener('click', () => {
            this.confirmImport();
        });

        // 选择按钮事件
        document.getElementById('select-all').addEventListener('click', () => {
            this.selectAllImportItems(true);
        });

        document.getElementById('select-none').addEventListener('click', () => {
            this.selectAllImportItems(false);
        });

        document.getElementById('select-new').addEventListener('click', () => {
            this.selectNewImportItems();
        });
    }

    // 导出数据
    exportData() {
        try {
            const exportData = {
                version: "2.0",
                timestamp: new Date().toISOString(),
                sites: this.sites,
                tags: this.tags,
                theme: this.getCurrentTheme()
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            // 创建下载链接
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `快速导航_${new Date().toISOString().split('T')[0]}.json`;

            // 触发下载
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // 显示成功提示
            this.showToast('数据导出成功！', 'success');
        } catch (error) {
            console.error('导出失败:', error);
            this.showToast('导出失败，请重试', 'error');
        }
    }

    // 处理导入文件
    async handleImportFile(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // 验证数据格式
            if (!this.validateImportData(data)) {
                this.showToast('文件格式不正确', 'error');
                return;
            }

            // 显示导入预览
            this.showImportPreview(data);
        } catch (error) {
            console.error('文件读取失败:', error);
            this.showToast('文件读取失败，请检查文件格式', 'error');
        }

        // 清空文件输入
        document.getElementById('import-file').value = '';
    }

    // 验证导入数据
    validateImportData(data) {
        if (!data || typeof data !== 'object') return false;
        if (!Array.isArray(data.sites)) return false;

        // 验证每个网站数据
        for (const site of data.sites) {
            if (!site.id || !site.url || !site.name) return false;
        }

        // 验证标签数据（可选）
        if (data.tags && !Array.isArray(data.tags)) return false;
        if (data.tags) {
            for (const tag of data.tags) {
                if (!tag.id || !tag.name) return false;
            }
        }

        return true;
    }

    // 显示导入预览
    showImportPreview(data) {
        this.importData = data;

        // 分析导入数据
        const analysis = this.analyzeImportData(data);

        // 更新模态框内容
        const totalItems = data.sites.length + (data.tags ? data.tags.length : 0);
        const totalNew = analysis.newSites.length + analysis.newTags.length;
        const totalUpdate = analysis.updateSites.length + analysis.updateTags.length;

        document.getElementById('import-count').textContent = totalItems;
        document.getElementById('new-count').textContent = totalNew;
        document.getElementById('update-count').textContent = totalUpdate;

        // 生成预览列表
        const preview = document.getElementById('import-preview');
        preview.innerHTML = this.generateImportPreview(analysis);

        // 显示模态框
        document.getElementById('import-modal').style.display = 'flex';
    }

    // 分析导入数据
    analyzeImportData(data) {
        // 分析网站数据
        const existingSiteNames = new Set(this.sites.map(site => site.name.toLowerCase()));
        const newSites = [];
        const updateSites = [];

        data.sites.forEach(site => {
            if (existingSiteNames.has(site.name.toLowerCase())) {
                updateSites.push(site);
            } else {
                newSites.push(site);
            }
        });

        // 分析标签数据
        const newTags = [];
        const updateTags = [];

        if (data.tags && data.tags.length > 0) {
            const existingTagNames = new Set(this.tags.map(tag => tag.name.toLowerCase()));

            data.tags.forEach(tag => {
                if (existingTagNames.has(tag.name.toLowerCase())) {
                    updateTags.push(tag);
                } else {
                    newTags.push(tag);
                }
            });
        }

        return { newSites, updateSites, newTags, updateTags };
    }

    // 生成导入预览HTML
    generateImportPreview(analysis) {
        let html = '';

        // 新增标签
        if (analysis.newTags.length > 0) {
            html += `<div class="import-section">
                <div class="import-section-title">
                    <span class="import-badge new">新增</span>
                    <span>${analysis.newTags.length} 个标签</span>
                </div>`;

            analysis.newTags.forEach(tag => {
                html += this.generateTagPreviewItem(tag, 'new');
            });
            html += `</div>`;
        }

        // 覆盖标签
        if (analysis.updateTags.length > 0) {
            html += `<div class="import-section">
                <div class="import-section-title">
                    <span class="import-badge update">覆盖</span>
                    <span>${analysis.updateTags.length} 个标签</span>
                </div>`;

            analysis.updateTags.forEach(tag => {
                html += this.generateTagPreviewItem(tag, 'update');
            });
            html += `</div>`;
        }

        // 新增网站
        if (analysis.newSites.length > 0) {
            html += `<div class="import-section">
                <div class="import-section-title">
                    <span class="import-badge new">新增</span>
                    <span>${analysis.newSites.length} 个网站</span>
                </div>`;

            analysis.newSites.forEach(site => {
                html += this.generateSitePreviewItem(site, 'new');
            });
            html += `</div>`;
        }

        // 覆盖网站
        if (analysis.updateSites.length > 0) {
            html += `<div class="import-section">
                <div class="import-section-title">
                    <span class="import-badge update">覆盖</span>
                    <span>${analysis.updateSites.length} 个网站</span>
                </div>`;

            analysis.updateSites.forEach(site => {
                html += this.generateSitePreviewItem(site, 'update');
            });
            html += `</div>`;
        }

        return html;
    }

    // 生成单个标签预览项
    generateTagPreviewItem(tag, type) {
        return `
            <div class="import-preview-item tag-preview" data-type="${type}">
                <div class="import-preview-icon tag-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                        <line x1="7" y1="7" x2="7.01" y2="7"/>
                    </svg>
                </div>
                <div class="import-preview-info">
                    <div class="import-preview-name">${this.escapeHtml(tag.name)}</div>
                    <div class="import-preview-url">标签</div>
                </div>
                <div class="import-preview-action">
                    <label class="import-checkbox">
                        <input type="checkbox" checked data-tag-name="${this.escapeHtml(tag.name)}">
                        <span class="checkmark"></span>
                    </label>
                </div>
            </div>
        `;
    }

    // 生成单个网站预览项
    generateSitePreviewItem(site, type) {
        return `
            <div class="import-preview-item" data-type="${type}">
                <div class="import-preview-icon">
                    ${this.getIconText(site)}
                </div>
                <div class="import-preview-info">
                    <div class="import-preview-name">${this.escapeHtml(site.name)}</div>
                    <div class="import-preview-url">${this.escapeHtml(this.getDomain(site.url))}</div>
                </div>
                <div class="import-preview-action">
                    <label class="import-checkbox">
                        <input type="checkbox" checked data-site-name="${this.escapeHtml(site.name)}">
                        <span class="checkmark"></span>
                    </label>
                </div>
            </div>
        `;
    }

    // 确认导入
    async confirmImport() {
        try {
            if (!this.importData || !this.importData.sites) {
                this.showToast('导入数据无效', 'error');
                return;
            }

            // 获取用户选择的数据
            const selectedSites = this.getSelectedImportSites();
            const selectedTags = this.getSelectedImportTags();

            if (selectedSites.length === 0 && selectedTags.length === 0) {
                this.showToast('请至少选择一个项目进行导入', 'info');
                return;
            }

            // 执行导入
            const siteResult = this.executeImport(selectedSites);
            const tagResult = this.executeTagImport(selectedTags);

            // 保存到存储
            await this.saveSites();
            await this.saveTags();

            // 如果有主题设置，也导入主题
            if (this.importData.theme) {
                this.setTheme(this.importData.theme);
            }

            // 重新渲染
            this.renderSites();
            this.renderTags();

            // 关闭模态框
            this.closeImportModal();

            // 显示成功提示
            let message = '导入完成！';
            const parts = [];
            
            if (siteResult.imported > 0) {
                parts.push(`网站：新增 ${siteResult.added} 个，覆盖 ${siteResult.updated} 个`);
            }
            
            if (tagResult.imported > 0) {
                parts.push(`标签：新增 ${tagResult.added} 个，覆盖 ${tagResult.updated} 个`);
            }
            
            if (parts.length > 0) {
                message += ' ' + parts.join('；');
            }

            this.showToast(message, 'success');

            this.importData = null;
        } catch (error) {
            console.error('导入失败:', error);
            this.showToast('导入失败，请重试', 'error');
        }
    }

    // 获取用户选择的导入网站
    getSelectedImportSites() {
        const checkboxes = document.querySelectorAll('#import-preview input[type="checkbox"]:checked[data-site-name]');
        const selectedNames = Array.from(checkboxes).map(cb => cb.dataset.siteName);

        return this.importData.sites.filter(site =>
            selectedNames.includes(site.name)
        );
    }

    // 获取用户选择的导入标签
    getSelectedImportTags() {
        if (!this.importData.tags) return [];

        const checkboxes = document.querySelectorAll('#import-preview input[type="checkbox"]:checked[data-tag-name]');
        const selectedNames = Array.from(checkboxes).map(cb => cb.dataset.tagName);

        return this.importData.tags.filter(tag =>
            selectedNames.includes(tag.name)
        );
    }

    // 执行导入操作
    executeImport(selectedSites) {
        const existingNamesMap = new Map();
        this.sites.forEach((site, index) => {
            existingNamesMap.set(site.name.toLowerCase(), index);
        });

        let added = 0;
        let updated = 0;

        selectedSites.forEach(importSite => {
            const existingIndex = existingNamesMap.get(importSite.name.toLowerCase());

            if (existingIndex !== undefined) {
                // 覆盖现有网站
                this.sites[existingIndex] = {
                    ...importSite,
                    id: this.sites[existingIndex].id // 保持原有ID
                };
                updated++;
            } else {
                // 新增网站
                this.sites.push({
                    ...importSite,
                    id: this.generateId() // 生成新ID
                });
                added++;
            }
        });

        return {
            imported: selectedSites.length,
            added,
            updated
        };
    }

    // 执行标签导入操作
    executeTagImport(selectedTags) {
        if (!selectedTags || selectedTags.length === 0) {
            return { imported: 0, added: 0, updated: 0 };
        }

        const existingNamesMap = new Map();
        this.tags.forEach((tag, index) => {
            existingNamesMap.set(tag.name.toLowerCase(), index);
        });

        let added = 0;
        let updated = 0;

        selectedTags.forEach(importTag => {
            const existingIndex = existingNamesMap.get(importTag.name.toLowerCase());

            if (existingIndex !== undefined) {
                // 覆盖现有标签
                this.tags[existingIndex] = {
                    ...importTag,
                    id: this.tags[existingIndex].id // 保持原有ID
                };
                updated++;
            } else {
                // 新增标签
                this.tags.push({
                    ...importTag,
                    id: this.generateId() // 生成新ID
                });
                added++;
            }
        });

        return {
            imported: selectedTags.length,
            added,
            updated
        };
    }

    // 关闭导入模态框
    closeImportModal() {
        document.getElementById('import-modal').style.display = 'none';
        this.importData = null;
    }

    // 显示提示消息
    showToast(message, type = 'info') {
        // 创建提示元素
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        // 添加样式
        Object.assign(toast.style, {
            position: 'fixed',
            top: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            opacity: '0',
            transition: 'all 0.3s ease'
        });

        // 设置背景色
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6'
        };
        toast.style.backgroundColor = colors[type] || colors.info;

        // 添加到页面
        document.body.appendChild(toast);

        // 显示动画
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);

        // 自动移除
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-1rem)';
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // 检查并显示示例数据提示
    checkAndShowExampleNotice() {
        const isFirstTime = !localStorage.getItem('square-inch-sites');
        const noticeShown = localStorage.getItem('square-inch-notice-dismissed');

        if (isFirstTime && !noticeShown) {
            document.getElementById('example-notice').style.display = 'block';
        }
    }

    // 初始化示例数据提示事件
    initExampleNotice() {
        document.getElementById('dismiss-notice').addEventListener('click', () => {
            this.dismissExampleNotice();
        });
    }

    // 关闭示例数据提示
    dismissExampleNotice() {
        document.getElementById('example-notice').style.display = 'none';
        localStorage.setItem('square-inch-notice-dismissed', 'true');
    }

    // 检查是否为示例数据
    isExampleData() {
        return this.sites.some(site => site.url.includes('example')) ||
               this.tags.some(tag => tag.id.startsWith('example-'));
    }
}

// 初始化应用
const squareInch = new SquareInch();
