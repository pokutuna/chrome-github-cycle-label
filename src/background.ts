/// <reference path="../typings/index.d.ts" />

import { Config } from './components/Config';

const inject = function(detail: chrome.webNavigation.WebNavigationCallbackDetails) {
    chrome.tabs.executeScript(detail.tabId, { file: 'js/content.js' });
    chrome.tabs.insertCSS(detail.tabId, { file: 'css/content.css' });
}

const reset = () => {
    chrome.webNavigation.onDOMContentLoaded.removeListener(inject);
    chrome.webNavigation.onHistoryStateUpdated.removeListener(inject);

    Config.getConfig().then((config: Config) => {
        chrome.webNavigation.onDOMContentLoaded.addListener(inject, config.chromeUrlFilter);
        chrome.webNavigation.onHistoryStateUpdated.addListener(inject, config.chromeUrlFilter);
    });
}

reset();
chrome.storage.onChanged.addListener(reset);
