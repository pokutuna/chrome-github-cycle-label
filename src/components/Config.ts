interface ConfigData {
    hosts: { [index: string]: boolean };
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

    isHostEnabled(url: string): boolean {
        const match = /^(\w+:\/\/[^\/]+)/.exec(url);
        if (!match) return false;
        return this.data.hosts[match[1]] ? true : false;
    }

    setLabelSetting(labelSetting: any): void {
        if (Config.isLabelSettingValid(labelSetting)) {
            this.data.labelSetting = labelSetting;
            this.data.hosts = {};
            Object.keys(this.data.labelSetting).forEach((key: string) => {
                const match = /^(\w+:\/\/[^\/]+)/.exec(key);
                return this.data.hosts[match[1]] = true;
            });
        } else {
            throw new Error('Invalid labelSetting');
        }
    }

    // statics
    private static get DEFAULT_CONFIG(): ConfigData {
        return {
            hosts: { 'https://github.com': true },
            labelSetting: {
                'https://github.com': [ ["bug", "wontfix"] ]
            }
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
