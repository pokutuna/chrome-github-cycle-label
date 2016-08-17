import { IView, Presenter, View } from './Base';
import { Config } from './Config';

interface IConfigEditorView extends IView {
    restoreLabelSettingJson(): void;
    updateSaveButton(): void;
}

class ConfigEditorPresenter extends Presenter {
    view: IConfigEditorView;

    config: Config;

    hasDiff:             boolean;
    hasSaved:            boolean;
    isLabelSettingValid: boolean;

    constructor(view: IConfigEditorView) {
        super(view);

        this.hasDiff  = false;
        this.hasSaved = false;
    }

    setup(): void {
        this.resetError();
        Config.getConfig().then((config: Config) => {
            this.config = config;
            this.view.restoreLabelSettingJson();
            this.view.updateSaveButton();
        }).catch(() => {
            this.setError(new Error('Cannot load config'));
            this.view.updateError();
        });
    }

    get saveButtonText(): string {
        return !this.hasDiff && this.hasSaved ? 'Saved!' : 'Save';
    }

    get isSaveButtonEnable(): boolean {
        return this.hasDiff && this.isLabelSettingValid ? true : false;
    }

    get labelSettingJson(): string {
        return JSON.stringify(this.config.labelSetting, null, 2);
    }

    handleLabelSettingInput(input: string): void {
        this.hasDiff = true;
        try {
            const obj = JSON.parse(input);
            this.config.setLabelSetting(obj); // throws Error if obj is invalid
            this.isLabelSettingValid = true;
        } catch(e) {
            console.log(e);
            this.isLabelSettingValid = false;
        }
        this.view.updateSaveButton();
    }

    handleSaveButtonClick(): void {
        this.config.save();
        this.hasSaved = true;
        this.hasDiff = false;
        this.view.updateSaveButton();
    }
}

class ConfigEditorView extends View implements IConfigEditorView {
    presenter: ConfigEditorPresenter;

    container:  HTMLElement;
    textarea:   HTMLTextAreaElement;
    saveButton: HTMLButtonElement;

    constructor(container: Element) {
        super(container);
    }

    initMembers(container: HTMLElement): void {
        this.textarea   = <HTMLTextAreaElement>container.querySelector('textarea');
        this.saveButton = <HTMLButtonElement>container.querySelector('button');

        this.textarea.disabled = true; // wait to restore setting
    }

    createPresenter(): ConfigEditorPresenter {
        return new ConfigEditorPresenter(this);
    }

    registerEvents(): void {
        this.textarea.addEventListener('input', (e: Event) => {
            this.presenter.handleLabelSettingInput(this.textarea.value);
        });
        this.saveButton.addEventListener('click', (e: Event) => {
            this.presenter.handleSaveButtonClick();
        });
    }

    restoreLabelSettingJson(): void {
        this.textarea.value    = this.presenter.labelSettingJson;
        this.textarea.disabled = false;
    }

    updateSaveButton(): void {
        this.saveButton.textContent =  this.presenter.saveButtonText;
        this.saveButton.disabled    = !this.presenter.isSaveButtonEnable;
    }

    updateError(): void {
        const error = this.presenter.lastError;
        if (error) window.alert(error);
    }
}

export { IConfigEditorView, ConfigEditorPresenter, ConfigEditorView };
