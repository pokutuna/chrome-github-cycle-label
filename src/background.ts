/// <reference path="../typings/index.d.ts" />

chrome.tabs.onUpdated.addListener(function (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
   if (changeInfo.status === 'complete') {
       if (true) { // TODO
           chrome.tabs.executeScript(tabId, { file: 'js/content.js' });
           chrome.tabs.insertCSS(tabId, { file: 'css/content.css' });
       }
    }
});
