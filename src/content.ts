import { LabelEditorView } from './components/LabelEditor'

console.log('content.ts');

let sidebar = document.querySelector('#partial-discussion-sidebar');
if (sidebar) new LabelEditorView(sidebar.parentElement);

// const form = <HTMLFormElement>document.querySelector('.js-issue-sidebar-form');
// let inputs = Array.prototype.slice.call(form.querySelectorAll('input'));
// let params = inputs.map((i: HTMLInputElement) => {
//     return [i.name, i.value];
// });
// params.push(['issue[labels][]', '']);
// params.push(['issue[labels][]', 'テスト']);
// let urlencoded = params.map((ary: [string, string]) => {
//     return `${encodeURIComponent(ary[0])}=${encodeURIComponent(ary[1])}`
// }).join('&')

// var req = new XMLHttpRequest();
// req.open(form.method, form.action, true);
// req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
// req.onload = function() {
//     console.log('onload', req.status);
// }
// req.send(urlencoded);
