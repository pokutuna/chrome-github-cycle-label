/// <reference path="../../typings/index.d.ts" />

interface ConfigData {
    labelSetting: { [index: string]: string[][] };
}

class Config {
    private data: ConfigData;

    // use `Config.getConfig()` instead of constructor
    constructor(data: ConfigData) {
        this.data = data;
    }

    save(): void {
        Config.saveConfig(this.data);
    }

    get labelSetting(): { [index: string]: string[][] } {
        return this.data.labelSetting;
    }

    setLabelSetting(labelSetting: any): void {
        if (Config.isLabelSettingValid(labelSetting)) {
            this.data.labelSetting = labelSetting;
        } else {
            throw new Error('Invalid labelSetting');
        }
    }

    // https://developer.chrome.com/extensions/events#filtered
    get chromeUrlFilter(): chrome.webNavigation.WebNavigationEventFilter {
        const prefixes = Object.keys(this.labelSetting);
        const filters: chrome.events.UrlFilter[] = [];
        prefixes.forEach((p) => {
            filters.push({ urlPrefix: p, pathContains: '/issues/' });
            filters.push({ urlPrefix: p, pathContains: '/pull/'   });
        });
        return { url: filters };
    }

    // statics
    private static get DEFAULT_CONFIG(): ConfigData {
        return {
            labelSetting: { 'https://github.com': [ ["bug", "wontfix"] ] }
        }
    }

    static getConfig(): Promise<Config> {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get(null, (config: any) => {
                let data: ConfigData;
                try {
                    if (this.isConfigValid(config)) data = config;
                } catch(e) {
                    console.error(e.toString());
                }
                if (!data) data = this.DEFAULT_CONFIG;
                resolve(new Config(data));
            });
        });
    }

    private static saveConfig(data: ConfigData): void {
        chrome.storage.sync.set(data);
    }

    private static isConfigValid(config: any): boolean {
        if (!config || typeof config !== 'object') return false;
        return this.isLabelSettingValid(config.labelSetting);
    }

    // check structure
    // { key: [ [string, string, ...], ... ] }
    static isLabelSettingValid(labelSetting: any): boolean {
        if (!labelSetting || typeof labelSetting !== 'object') return false;
        return Object.keys(labelSetting).every((key: string) => {

            // key is must be an URL
            if (!/^https?:\/\/[^\/]+/.test(key)) return false;

            // value must be an Array
            if (!Array.isArray(labelSetting[key])) return false;

            // all items must be string[] in value
            return labelSetting[key].every((items: any) => {
                return Array.isArray(items) &&
                    items.every((i: any) => { return typeof i === 'string' });
            });
        });
    }
}

export { Config };
