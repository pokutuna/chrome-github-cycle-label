import { ConfigEditorView } from './components/ConfigEditor';

document.addEventListener('DOMContentLoaded', () => {
    new ConfigEditorView(document.getElementById('config'));
});
