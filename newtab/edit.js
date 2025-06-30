// 编辑页面主类
class EditMode {
    constructor() {
        this.sites = [];
        this.tags = [];
        this.originalSites = [];
        this.hasUnsavedChanges = false;
        this.init();
    }

    async init() {
        this.showLoading();
        this.loadData();
        this.setupEventListeners();
        this.setupTheme();
        this.renderEditGrid();
        this.hideLoading();
    }

    loadData() {
        this.sites = DataManager.getSites();
        this.tags = DataManager.getTags();
        this.originalSites = JSON.parse(JSON.stringify(this.sites));
    }

    setupTheme() {
        const theme = DataManager.getTheme();
        DataManager.setTheme(theme);
    }

    setupEventListeners() {
        document.getElementById('back-to-nav').addEventListener('click', () => {
            this.goBackToNav();
        });

        document.getElementById('save-changes').addEventListener('click', () => {
            this.saveChanges();
        });

        // 退出确认弹窗事件
        document.getElementById('cancel-exit').addEventListener('click', () => {
            this.hideExitConfirmModal();
        });

        document.getElementById('confirm-exit').addEventListener('click', () => {
            window.location.href = 'newtab.html';
        });

        // 保存确认弹窗事件
        document.getElementById('close-save-modal').addEventListener('click', () => {
            this.hideSaveConfirmModal();
        });

        document.getElementById('cancel-save').addEventListener('click', () => {
            this.cancelAllChanges();
        });

        document.getElementById('save-all').addEventListener('click', () => {
            this.confirmSaveChanges();
        });

        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    renderEditGrid() {
        const grid = document.getElementById('edit-grid');
        
        const cardsHtml = this.sites.map(site => {
            const selectedTags = site.tags || [];
            const selectedTagsHtml = selectedTags.map(tagId => {
                const tag = this.tags.find(t => t.id === tagId);
                return tag ? `
                    <span class="edit-selected-tag">
                        ${DataManager.escapeHtml(tag.name)}
                        <button type="button" class="edit-tag-remove" data-tag-id="${tagId}">×</button>
                    </span>
                ` : '';
            }).join('');

            const tagsOptionsHtml = this.tags.map(tag => `
                <div class="edit-tag-option ${selectedTags.includes(tag.id) ? 'selected' : ''}" data-tag-id="${tag.id}">
                    ${DataManager.escapeHtml(tag.name)}
                </div>
            `).join('');

            return `
                <div class="edit-card" data-site-id="${site.id}">
                    <div class="edit-form-group">
                        <label class="edit-form-label">网站名称</label>
                        <input type="text" class="edit-input name-input" value="${DataManager.escapeHtml(site.name)}" placeholder="请输入网站名称">
                    </div>
                    
                    <div class="edit-form-group">
                        <label class="edit-form-label">网站地址</label>
                        <input type="text" class="edit-input url-input" value="${DataManager.escapeHtml(site.url)}" placeholder="https://example.com">
                    </div>
                    
                    <div class="edit-form-group">
                        <label class="edit-form-label">图标网址 (可选)</label>
                        <input type="text" class="edit-input icon-input" value="${DataManager.escapeHtml(site.icon || '')}" placeholder="留空自动获取">
                    </div>
                    
                    <div class="edit-form-group">
                        <label class="edit-form-label">标签</label>
                        <div class="edit-tags-container">
                            <div class="edit-tags-display" data-site-id="${site.id}">
                                ${selectedTagsHtml || '<span class="edit-tags-placeholder">选择标签...</span>'}
                            </div>
                            <div class="edit-tags-options">
                                ${tagsOptionsHtml}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        grid.innerHTML = cardsHtml;
        this.bindInputEvents();
        this.bindTagEvents();
    }

    bindInputEvents() {
        const inputs = document.querySelectorAll('.edit-input');
        
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateSiteField(input);
            });
        });
    }

    bindTagEvents() {
        // 标签显示区域点击事件
        document.querySelectorAll('.edit-tags-display').forEach(display => {
            display.addEventListener('click', (e) => {
                // 如果点击的是移除按钮，处理移除
                if (e.target.classList.contains('edit-tag-remove')) {
                    this.removeTagFromSite(e.target.dataset.tagId, display.dataset.siteId);
                    return;
                }

                const container = display.closest('.edit-tags-container');
                const options = display.nextElementSibling;
                const isOpen = options.classList.contains('show');
                
                // 关闭所有其他选项
                this.closeAllTagOptions();
                
                if (!isOpen) {
                    options.classList.add('show');
                    display.classList.add('active');
                    container.classList.add('active');
                }
            });
        });

        // 标签选项点击事件
        document.querySelectorAll('.edit-tag-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const tagId = option.dataset.tagId;
                const container = option.closest('.edit-tags-container');
                const display = container.querySelector('.edit-tags-display');
                const siteId = display.dataset.siteId;
                
                this.toggleSiteTag(siteId, tagId);
            });
        });

        // 点击其他地方关闭标签选项
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.edit-tags-container')) {
                this.closeAllTagOptions();
            }
        });
    }

    closeAllTagOptions() {
        document.querySelectorAll('.edit-tags-options').forEach(opt => {
            opt.classList.remove('show');
        });
        document.querySelectorAll('.edit-tags-container').forEach(cont => {
            cont.classList.remove('active');
        });
        document.querySelectorAll('.edit-tags-display').forEach(display => {
            display.classList.remove('active');
        });
    }

    toggleSiteTag(siteId, tagId) {
        const site = this.sites.find(s => s.id === siteId);
        if (!site) return;

        if (!site.tags) site.tags = [];

        const tagIndex = site.tags.indexOf(tagId);
        if (tagIndex > -1) {
            site.tags.splice(tagIndex, 1);
        } else {
            site.tags.push(tagId);
        }

        this.hasUnsavedChanges = true;
        this.updateSiteTagsDisplay(siteId);
    }

    removeTagFromSite(tagId, siteId) {
        const site = this.sites.find(s => s.id === siteId);
        if (!site || !site.tags) return;

        const tagIndex = site.tags.indexOf(tagId);
        if (tagIndex > -1) {
            site.tags.splice(tagIndex, 1);
            this.hasUnsavedChanges = true;
            this.updateSiteTagsDisplay(siteId);
        }
    }

    updateSiteTagsDisplay(siteId) {
        const card = document.querySelector(`[data-site-id="${siteId}"]`);
        if (!card) return;

        const site = this.sites.find(s => s.id === siteId);
        if (!site) return;

        const tagsDisplay = card.querySelector('.edit-tags-display');
        const selectedTags = site.tags || [];
        
        const selectedTagsHtml = selectedTags.map(tagId => {
            const tag = this.tags.find(t => t.id === tagId);
            return tag ? `
                <span class="edit-selected-tag">
                    ${DataManager.escapeHtml(tag.name)}
                    <button type="button" class="edit-tag-remove" data-tag-id="${tagId}">×</button>
                </span>
            ` : '';
        }).join('');

        tagsDisplay.innerHTML = selectedTagsHtml || '<span class="edit-tags-placeholder">选择标签...</span>';

        // 更新选项的选中状态
        const options = card.querySelectorAll('.edit-tag-option');
        options.forEach(option => {
            if (selectedTags.includes(option.dataset.tagId)) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });

        // 重新绑定移除按钮事件
        tagsDisplay.querySelectorAll('.edit-tag-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeTagFromSite(btn.dataset.tagId, siteId);
            });
        });
    }

    updateSiteField(input) {
        const card = input.closest('.edit-card');
        const siteId = card.dataset.siteId;
        const site = this.sites.find(s => s.id === siteId);

        if (!site) return;

        let field = '';
        if (input.classList.contains('name-input')) field = 'name';
        else if (input.classList.contains('url-input')) field = 'url';
        else if (input.classList.contains('icon-input')) field = 'icon';

        const newValue = input.value.trim();
        const oldValue = site[field] || '';

        if (newValue !== oldValue) {
            site[field] = newValue;
            this.hasUnsavedChanges = true;
        }
    }

    goBackToNav() {
        if (this.hasUnsavedChanges) {
            this.showExitConfirmModal();
        } else {
            window.location.href = 'newtab.html';
        }
    }

    showExitConfirmModal() {
        document.getElementById('exit-confirm-modal').classList.add('show');
    }

    hideExitConfirmModal() {
        document.getElementById('exit-confirm-modal').classList.remove('show');
    }

    async saveChanges() {
        if (!this.hasUnsavedChanges) {
            this.showToast('没有检测到任何更改');
            return;
        }

        // 分析更改并显示差异比对弹窗
        this.showSaveConfirmModal();
    }

    async confirmSaveChanges() {
        this.hideSaveConfirmModal();
        this.showLoading();

        try {
            await DataManager.saveSites(this.sites);
            this.originalSites = JSON.parse(JSON.stringify(this.sites));
            this.hasUnsavedChanges = false;
            this.showToast('保存成功');
        } catch (error) {
            console.error('保存失败:', error);
            this.showToast('保存失败，请重试');
        } finally {
            this.hideLoading();
        }
    }

    showSaveConfirmModal() {
        const changes = this.analyzeChanges();
        this.renderChangesContent(changes);
        document.getElementById('save-confirm-modal').classList.add('show');
    }

    hideSaveConfirmModal() {
        document.getElementById('save-confirm-modal').classList.remove('show');
    }

    cancelAllChanges() {
        // 重置数据到原始状态
        this.sites = JSON.parse(JSON.stringify(this.originalSites));
        this.hasUnsavedChanges = false;
        
        // 重新渲染页面
        this.renderEditGrid();
        
        // 关闭弹窗
        this.hideSaveConfirmModal();
        
        // 显示提示
        this.showToast('已撤销所有更改');
    }

    analyzeChanges() {
        const changes = [];
        
        for (const currentSite of this.sites) {
            const originalSite = this.originalSites.find(s => s.id === currentSite.id);
            
            if (!originalSite) continue;
            
            const siteChanges = [];
            
            if (currentSite.name !== originalSite.name) {
                siteChanges.push({
                    field: '网站名称',
                    old: originalSite.name,
                    new: currentSite.name
                });
            }
            
            if (currentSite.url !== originalSite.url) {
                siteChanges.push({
                    field: '网站地址',
                    old: originalSite.url,
                    new: currentSite.url
                });
            }
            
            if ((currentSite.icon || '') !== (originalSite.icon || '')) {
                siteChanges.push({
                    field: '图标网址',
                    old: originalSite.icon || '(无)',
                    new: currentSite.icon || '(无)'
                });
            }
            
            // 比较标签
            const oldTags = originalSite.tags || [];
            const newTags = currentSite.tags || [];
            if (JSON.stringify(oldTags.sort()) !== JSON.stringify(newTags.sort())) {
                const oldTagNames = oldTags.map(tagId => {
                    const tag = this.tags.find(t => t.id === tagId);
                    return tag ? tag.name : '未知标签';
                });
                const newTagNames = newTags.map(tagId => {
                    const tag = this.tags.find(t => t.id === tagId);
                    return tag ? tag.name : '未知标签';
                });
                
                siteChanges.push({
                    field: '标签',
                    old: oldTagNames.length > 0 ? oldTagNames.join(', ') : '(无)',
                    new: newTagNames.length > 0 ? newTagNames.join(', ') : '(无)'
                });
            }
            
            if (siteChanges.length > 0) {
                changes.push({
                    siteName: currentSite.name || originalSite.name,
                    changes: siteChanges
                });
            }
        }
        
        return changes;
    }

    renderChangesContent(changes) {
        const changesContainer = document.getElementById('changes-list');
        
        if (changes.length === 0) {
            changesContainer.innerHTML = '<p style="color: var(--text-secondary);">没有检测到更改</p>';
            return;
        }
        
        const changesHtml = changes.map(change => `
            <div style="border: 1px solid var(--border-light); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                <h4 style="margin: 0 0 0.75rem 0; font-size: 0.9rem; color: var(--text-primary);">${DataManager.escapeHtml(change.siteName)}</h4>
                ${change.changes.map(item => `
                    <div style="margin-bottom: 0.5rem; font-size: 0.875rem;">
                        <div style="color: var(--text-secondary); margin-bottom: 0.25rem;">${item.field}:</div>
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <div style="flex: 1;">
                                <div style="color: var(--text-light); font-size: 0.8rem;">原值:</div>
                                <div style="background: #fee2e2; color: #991b1b; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; word-break: break-all;">${DataManager.escapeHtml(item.old)}</div>
                            </div>
                            <div style="color: var(--text-light);">→</div>
                            <div style="flex: 1;">
                                <div style="color: var(--text-light); font-size: 0.8rem;">新值:</div>
                                <div style="background: #dcfce7; color: #166534; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; word-break: break-all;">${DataManager.escapeHtml(item.new)}</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');
        
        changesContainer.innerHTML = changesHtml;
    }

    showLoading() {
        document.getElementById('loading-indicator').classList.add('show');
    }

    hideLoading() {
        document.getElementById('loading-indicator').classList.remove('show');
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 2rem; right: 2rem; padding: 1rem 1.5rem;
            background: #3b82f6; color: white; border-radius: 8px;
            font-size: 0.875rem; z-index: 10000; opacity: 0;
            transition: opacity 0.3s ease;
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        setTimeout(() => toast.style.opacity = '1', 100);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new EditMode();
}); 