// 后台脚本 - 处理右键菜单
chrome.runtime.onInstalled.addListener(() => {
    // 创建右键菜单项
    chrome.contextMenus.create({
        id: "open-navigation",
        title: "打开方寸导航",
        contexts: ["page"]
    });
    
    chrome.contextMenus.create({
        id: "add-to-navigation",
        title: "添加到方寸导航",
        contexts: ["page"]
    });
});

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "open-navigation") {
        // 打开导航页面
        chrome.tabs.create({
            url: chrome.runtime.getURL('newtab/newtab.html')
        });
    } else if (info.menuItemId === "add-to-navigation") {
        // 跳转到导航页面并传递域名信息
        const url = new URL(tab.url);
        const domain = url.hostname;
        
        chrome.tabs.create({
            url: chrome.runtime.getURL(`newtab/newtab.html?action=add&domain=${encodeURIComponent(domain)}`)
        });
    }
});
