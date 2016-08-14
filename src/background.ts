/// <reference path="../typings/index.d.ts" />

chrome.webNavigation.onDOMContentLoaded.addListener((details: chrome.webNavigation.WebNavigationFramedCallbackDetails) => {
    if (true) { // TODO check config
        chrome.tabs.executeScript(details.tabId, { file: 'js/content.js' });
        chrome.tabs.insertCSS(details.tabId, { file: 'css/content.css' });
    }
});
