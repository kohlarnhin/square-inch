// 后台脚本 - 处理右键菜单
chrome.runtime.onInstalled.addListener(() => {
    // 创建右键菜单项
    chrome.contextMenus.create({
        id: "open-navigation",
        title: "方寸",
        contexts: ["page", "selection", "link", "image"]
    });
});

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "open-navigation") {
        // 打开导航页面
        chrome.tabs.create({
            url: chrome.runtime.getURL('newtab/newtab.html')
        });
    }
});
