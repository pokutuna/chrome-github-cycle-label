import { LabelEditorView } from './components/LabelEditor'

console.log('content.ts');

const isEditable = document.querySelector('.label-select-menu') ? true : false;
const sidebarInner = document.querySelector('#partial-discussion-sidebar');
if (isEditable && sidebarInner) {
    const sidebar = sidebarInner.parentElement;
    if (sidebar.getAttribute('data-cycle-label-initialized') !== 'true')
        new LabelEditorView(sidebar);
}
