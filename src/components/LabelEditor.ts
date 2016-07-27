import * as $ from 'jquery';
import { IView, Presenter, View } from './Base';

interface ILabelEditorView extends IView {
}

class LabelEditorPresenter extends Presenter {
    view: LabelEditorView;

    constructor(view: LabelEditorView) {
        super(view);
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
    }

    private onMutateSidebar(mutations: MutationRecord[], observer: MutationObserver): void {
        if (this.isLabelFormMutated(mutations)) {
            console.log('Labels Edited');
        }
    }

    private isLabelFormMutated(mutations: MutationRecord[]): boolean {
        return mutations.some((mutation) => {
            const nodes = Array.prototype.slice.call(mutation.removedNodes);
            return nodes.some((node: Node) => {
                if (node.nodeType != Node.ELEMENT_NODE) return false;
                return (<Element>node).matches('.sidebar-labels') ? true : false;
            });
        });
    }

    createPresenter(): LabelEditorPresenter {
        return new LabelEditorPresenter(this);
    }

    deregisterEvents(): void {
    }
}

export { ILabelEditorView, LabelEditorPresenter, LabelEditorView };
