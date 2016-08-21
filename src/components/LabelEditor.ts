/// <reference path="../../typings/index.d.ts" />

import { IView, Presenter, View } from './Base';
import { Config } from './Config';
import { Util } from './Util';

interface Label {
    title: string;
    nextTitle?: string;
    isCyclable: boolean;
    isImitated: boolean;
}

interface LabelFormData {
    method: string;
    action: string;
    params: [string, string][];
}

interface LabelEditorArgs {
    location: string;
    labelTitles: string[];
    formData: LabelFormData;
}

interface ILabelEditorView extends IView {
    editorInitialized(): void;
    updateLabels(): void;
    updateSidebarLabels(): void;
}

class LabelEditorPresenter extends Presenter {
    view: LabelEditorView;

    location: string
    formData: LabelFormData;
    lastSidebarContent: string;

    labelSetting: string[][];
    labels: Label[];

    constructor(view: LabelEditorView, args: LabelEditorArgs) {
        super(view);
        this.location = args.location;
        this.formData = args.formData;
        this.lastSidebarContent = null;

        Config.getConfig().then((config: Config) => {
            this.labelSetting = config.getLabelSettingByUrl(this.location);
            this.parseLabels(args.labelTitles);
            this.view.updateLabels();
        });
    }

    setup(): void {
        this.view.editorInitialized();
    }

    handleFormUpdate(labelTitles: string[], formData: LabelFormData): void {
        this.parseLabels(labelTitles);
        this.formData = formData;
        this.view.updateLabels();
    }

    replaceLabelTitle(next: string, prev?: string): void {
        let titles = this.labels
            .filter((l: Label) => { return !l.isImitated })
            .map((l: Label) => { return l.title });

        if (prev) {
            titles = titles.map((t: string) => { return t === prev ? next : t })
        } else {
            titles.push(next);
        }

        this.requestUpdate(titles);
    }

    private requestUpdate(titles: string[]): void {
        console.log(titles);
        const params = this.formData.params.concat(
            [''].concat(titles).map((title: string): [string, string] => {
                return ['issue[labels][]', title]
            })
        );
        let encoded = params.map((kv: [string, string]) => {
            return `${encodeURIComponent(kv[0])}=${encodeURIComponent(kv[1])}`;
        }).join('&');

        this.resetError();
        this.postForm(encoded).then((res: Response) => {
            return res.text();
        }).then((text: string) => {
            this.lastSidebarContent = text;
            this.view.updateSidebarLabels();
        }).catch((error: Error) => {
            this.setError(error);
            this.view.updateError();
        });
    }

    private postForm(encodedParams: string): Promise<Response> {
        return fetch(this.formData.action, {
            method: this.formData.method,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: encodedParams,
            credentials: 'include',
            cache: 'no-cache',
        });
    }

    private parseLabels(labelTitles: string[]): void {
        const labelSetting = this.labelSetting;
        if (!labelSetting) return;

        // parse existing label
        const laneContainsIndex: { [index: number]: boolean } = {};
        this.labels = labelTitles.map((title: string) => {
            let nextTitle: string   = null;
            let isCyclable: boolean = false;
            labelSetting.forEach((lane: string[], laneIdx: number) => {
                const idx = lane.indexOf(title);
                if (idx !== -1) { // found in a setting lane
                    isCyclable = true;
                    nextTitle = (idx + 1 !== lane.length) ? lane[idx + 1] : lane[0];
                    laneContainsIndex[laneIdx] = true;
                }
            });
            return {
                title: title,
                nextTitle: nextTitle,
                isCyclable: isCyclable,
                isImitated: false,
            };
        });

        // add first item from not existing lane
        labelSetting.forEach((lane: string[], laneIdx: number) => {
            if (laneContainsIndex[laneIdx] && lane[0]) return;
            this.labels.push({
                title: lane[0],
                nextTitle: lane[0],
                isCyclable: false,
                isImitated: true,
            });
        });
    }
}

class LabelEditorView extends View implements ILabelEditorView {
    presenter: LabelEditorPresenter;

    sidebar: HTMLElement;
    labelForm: HTMLFormElement;

    sidebarObserver: MutationObserver;

    constructor(sidebar: Element) {
        super(sidebar);
    }

    initMembers(sidebar: Element): void {
        this.sidebar = <HTMLElement>sidebar;
        this.resetLabelForm();
    }

    registerEvents(): void {
        this.sidebarObserver = new MutationObserver(this.onMutate.bind(this));
        this.sidebarObserver.observe(this.sidebar, {
            childList: true,
            subtree:   true,
        });

        this.sidebar.addEventListener('click', Util.delegate(
            '.cycle-button', this.onClickCycleButton.bind(this)
        ));
        this.sidebar.addEventListener('click', Util.delegate(
            '.imitation-label', this.onClickImitationLabel.bind(this)
        ));
    }

    private resetLabelForm(): void {
        // labelForm will be updated by pjax
        this.labelForm = <HTMLFormElement>this.sidebar.querySelector(
            '.sidebar-labels form'
        );
    }

    private onMutate(mutations: MutationRecord[], observer: MutationObserver): void {
        if (this.isLabelFormMutated(mutations)) {
            console.log('Sidebar Updated');
            this.resetLabelForm();
            this.presenter.handleFormUpdate(
                this.collectLabelTitles(),
                this.collectLabelFormData()
            );
        }
    }

    private isLabelFormMutated(mutations: MutationRecord[]): boolean {
        return mutations.some((mutation) => {
            const nodes = Array.prototype.slice.call(mutation.removedNodes);
            return nodes.some((node: Node) => {
                if (node.nodeType != Node.ELEMENT_NODE) return false;
                return (<Element>node).matches('#partial-discussion-sidebar');
            });
        });
    }

    private onClickCycleButton(event: Event): void {
        event.preventDefault();
        console.log('onClickCycleButton');
        const elem = <HTMLElement>event.target;
        this.presenter.replaceLabelTitle(
            elem.getAttribute('data-next-title'),
            elem.getAttribute('data-prev-title')
        );
    }

    private onClickImitationLabel(event: Event): void {
        event.preventDefault();
        console.log('onClickImitationLabel');
        const elem = <HTMLElement>event.target;
        this.presenter.replaceLabelTitle(
            elem.getAttribute('data-next-title'),
            null
        );
    }

    private collectLabelFormData(): LabelFormData {
        return {
            method: this.labelForm.method,
            action: this.labelForm.action,
            params: Util.serializeArray(this.labelForm),
        };
    }

    private collectLabelTitles(): string[] {
        const labels = this.labelForm.querySelectorAll('a.label');
        const titles = Array.prototype.slice.call(labels).map(
            (element: Element) => { return element.getAttribute('title') }
        );
        return titles;
    }

    createPresenter(): LabelEditorPresenter {
        return new LabelEditorPresenter(this, {
            location: window.location.href,
            labelTitles: this.collectLabelTitles(),
            formData: this.collectLabelFormData(),
        });
    }

    editorInitialized(): void {
        this.sidebar.setAttribute('data-cycle-label-initialized', 'true');
    }

    updateLabels(): void {
        const labelElements = this.labelForm.querySelectorAll('a.label');
        this.presenter.labels.forEach((label, index) => {
            const elem = labelElements[index];
            if (elem && label.title === elem.getAttribute('title')) {
                if (label.isCyclable) {
                    elem.classList.toggle('cycle-label', true);
                    elem.parentElement.insertBefore(this.createCycleButton(label), elem);
                }
            } else if (elem === undefined) {
                this.labelForm.querySelector('.labels').appendChild(
                    this.createImitationLabel(label)
                );
            } else {
                console.error('Label unmatch!');
                // TODO abort extension
            }
        });
    }

    updateSidebarLabels(): void {
        const temp = document.createElement('DIV');
        temp.innerHTML = this.presenter.lastSidebarContent;
        const labels = temp.querySelector('.sidebar-labels');
        if (labels) {
            const oldLabels = this.sidebar.querySelector('.sidebar-labels');
            oldLabels.parentNode.replaceChild(labels, oldLabels);
        }
    }

    private createCycleButton(label: Label): HTMLButtonElement {
        const button = document.createElement('button');
        button.classList.add('cycle-button');
        button.setAttribute('data-prev-title', label.title);
        button.setAttribute('data-next-title', label.nextTitle);
        button.setAttribute('type', 'button');
        return button;
    }

    private createImitationLabel(label: Label): HTMLAnchorElement {
        const a = document.createElement('a');
        a.classList.add('label', 'imitation-label');
        a.setAttribute('data-next-title', label.nextTitle);
        a.setAttribute('href', '#');
        a.innerText = label.title;
        return a;
    }
}

export { ILabelEditorView, LabelEditorPresenter, LabelEditorView };
