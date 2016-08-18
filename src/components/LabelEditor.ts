/// <reference path="../../typings/index.d.ts" />

import { IView, Presenter, View } from './Base';
import { Util } from './Util';

interface Label {
    title: string;
    isCyclable: boolean;
    isImitated: boolean;
}

interface LabelFormData {
    method: string;
    action: string;
    params: [string, string][];
}

interface LabelEditorArgs {
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

    formData: LabelFormData;
    lastSidebarContent: string;

    labels: Label[];

    constructor(view: LabelEditorView, args: LabelEditorArgs) {
        super(view);
        this.WIPudpateLabels(args.labelTitles);
        this.formData = args.formData;
        this.lastSidebarContent = null;
    }

    setup(): void {
        this.view.editorInitialized();
        this.view.updateLabels();
    }

    handleFormUpdate(labelTitles: string[], formData: LabelFormData): void {
        this.WIPudpateLabels(labelTitles);
        this.formData = formData;
        this.view.updateLabels();
    }

    cycleLabel(labelTitle: string): void {
        const nexts: { [index: string]: string } = {
            'duplicate': 'enhancement',
            'レビュー依頼': 'レビュー中',
            'レビュー中': 'レビュー済み',
            'レビュー済み': 'レビュー依頼',
        };
        const labelParams = this.currentLabelParams().map(
            (p: [string, string]): [string, string] => {
                return nexts[p[1]] ? [p[0], nexts[p[1]]] : p;
            }
        );
        this.requestUpdate(labelParams);
    }

    addLabel(labelTitle: string): void {
        const labelParams = this.currentLabelParams();
        labelParams.push(['issue[labels][]', labelTitle]);
        this.requestUpdate(labelParams);
    }

    private requestUpdate(labelParams: [string, string][]): void {
        const params = this.formData.params.concat(labelParams);
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

    private currentLabelParams(): [string, string][] {
        const params: [string, string][] = [['issue[labels][]', '']];
        this.labels.forEach((label: Label) => {
            if (!label.isImitated) params.push(['issue[labels][]', label.title]);
        });
        return params;
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

    private WIPudpateLabels(labelTitles: string[]): void {
        // https://github.com/pokutuna/chrome-github-cycle-label/issues/1
        const cyclables = ['duplicate', 'レビュー依頼', 'レビュー中', 'レビュー済み'];

        this.labels = labelTitles.map((title: string) => {
            return {
                title: title,
                isCyclable: cyclables.indexOf(title) != -1 ? true : false,
                isImitated: false,
            };
        });
        this.labels.push({
            title: 'テスト',
            isCyclable: false,
            isImitated: true,
        });
        this.labels.push({
            title: 'レビュー依頼',
            isCyclable: false,
            isImitated: true,
        });
    }

    requestLabelUpdate(): void {
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

    unregisterEvents(): void {
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
        const labelTitle = (<HTMLElement>event.target).title;
        this.presenter.cycleLabel(labelTitle);
    }

    private onClickImitationLabel(event: Event): void {
        event.preventDefault();
        console.log('onClickImitationLabel');
        const labelTitle = (<HTMLElement>event.target).title;
        this.presenter.addLabel(labelTitle);
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
                    elem.parentElement.insertBefore(
                        this.createCycleButton(label.title),
                        elem
                    );
                }
            } else if (elem === undefined) {
                this.labelForm.querySelector('.labels').appendChild(
                    this.createImitationLabel(label.title)
                );
            } else {
                console.error('Label unmatch!');
                // TODO abort extension
            }
        });
    }

    updateSidebarLabels(): void {
        // XXX should be more strict
        const isValid = this.presenter.lastSidebarContent.startsWith(
            '<div class="discussion-sidebar-item sidebar-labels'
        );

        if (isValid) this.sidebar.querySelector('.sidebar-labels').innerHTML = this.presenter.lastSidebarContent;
    }

    private createCycleButton(title: string): HTMLButtonElement {
        const button = document.createElement('button');
        button.classList.add('cycle-button');
        button.setAttribute('data-label-title', title);
        button.setAttribute('type', 'button');
        return button;
    }

    private createImitationLabel(title: string): HTMLAnchorElement {
        const a = document.createElement('a');
        a.classList.add('label', 'imitation-label');
        a.setAttribute('title', title);
        a.setAttribute('href', '#');
        a.innerText = title;
        return a;
    }
}

export { ILabelEditorView, LabelEditorPresenter, LabelEditorView };
