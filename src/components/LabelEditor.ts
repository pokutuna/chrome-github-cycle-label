import * as $ from 'jquery';
import { IView, Presenter, View } from './Base';
import { Util } from './Util';

interface Label {
    title: string;
    isCyclable: boolean;
    isImitated: boolean;
}

interface LabelEditorArgs {
    labelTitles: string[];
}

interface ILabelEditorView extends IView {
    updateLabels(): void
}

class LabelEditorPresenter extends Presenter {
    view: LabelEditorView;

    labels: Label[];

    constructor(view: LabelEditorView, args: LabelEditorArgs) {
        super(view);
        this.WIPudpateLabels(args.labelTitles);
    }

    setup(): void {
        this.view.updateLabels();
    }

    handleLabelUpdate(labelTitles: string[]): void {
        this.WIPudpateLabels(labelTitles);
        this.view.updateLabels();
    }

    WIPudpateLabels(labelTitles: string[]): void {
        // https://github.com/pokutuna/chrome-github-cycle-label/issues/1
        this.labels = labelTitles.map((title: string) => {
            return {
                title: title,
                isCyclable: title === 'duplicate' ? true : false,
                isImitated: false,
            };
        });
        this.labels.push({
            title: 'テスト',
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
        this.labelForm = <HTMLFormElement>this.sidebar.querySelector('.sidebar-labels form');
    }

    registerEvents(): void {
        this.sidebarObserver = new MutationObserver(this.onMutateSidebar.bind(this));
        this.sidebarObserver.observe(this.sidebar, {
            childList: true,
            subtree:   true,
        });

        document.addEventListener('click', Util.delegate(
            '.cycle-button', this.onClickCycleButton.bind(this)
        ));
        document.addEventListener('click', Util.delegate(
            '.imitation-label', this.onClickImitationLabel.bind(this)
        ));
    }

    unregisterEvents(): void {
    }

    private onMutateSidebar(mutations: MutationRecord[], observer: MutationObserver): void {
        if (this.isLabelFormMutated(mutations)) {
            console.log('Sidebar Updated');
            this.labelForm = <HTMLFormElement>this.sidebar.querySelector('.sidebar-labels form');
            this.presenter.handleLabelUpdate(this.collectLabelTitles());
        }
    }

    private isLabelFormMutated(mutations: MutationRecord[]): boolean {
        return mutations.some((mutation) => {
            const nodes = Array.prototype.slice.call(mutation.removedNodes);
            return nodes.some((node: Node) => {
                if (node.nodeType != Node.ELEMENT_NODE) return false;
                return (<Element>node).matches('#partial-discussion-sidebar') ? true : false;
            });
        });
    }

    private onClickCycleButton(event: Event): void {
        event.preventDefault();
        console.log('onClickCycleButton');
    }

    private onClickImitationLabel(event: Event): void {
        event.preventDefault();
        console.log('onClickImitationLabel');
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
            labelTitles: this.collectLabelTitles()
        });
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
