// 弹窗功能
document.addEventListener('DOMContentLoaded', function() {
    // 打开导航页
    document.getElementById('open-newtab').addEventListener('click', function() {
        chrome.tabs.create({ url: chrome.runtime.getURL('newtab/newtab.html') });
        window.close();
    });
});
