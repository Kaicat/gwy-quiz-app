import { groupTree, filterQuestions, scopeKey } from '../logic.js';
import { mountQuizPlayer } from '../quiz-player.js';

export function practiceView(el, ctx) {
  const [, , sub] = location.hash.split('/'); // #/practice/quiz
  if (sub === 'quiz' && ctx.session?.questions?.length) return quiz(el, ctx);
  home(el, ctx);
}

async function home(el, ctx) {
  const all = await ctx.store.allQuestions();
  const tree = groupTree(all);
  const total = all.filter(q => q.type === 'single').length;
  el.innerHTML = `<div class="page"><h1>练习 <small class="tag">${total} 题</small>
    <a class="gear" href="#/settings">⚙︎</a></h1>
    <div id="tree"></div></div>`;
  const box = el.querySelector('#tree');
  box.innerHTML = tree.map((c, ci) => `
    <div class="card">
      <div class="chap" data-ci="${ci}"><b>${c.chapter}</b><span class="tag">${c.count}</span></div>
      <div class="secs" hidden>${c.sections.map(s => `
        <div class="sec-row">
          <span class="sec-name">${s.section}</span>
          ${s.tiers.map(t => `<button class="ghost small" data-scope='${JSON.stringify(
            { chapter: c.chapter, section: s.section, tier: t.tier }).replace(/'/g, '&#39;')}'>
            ${t.tier} ${t.count}</button>`).join('')}
        </div>`).join('')}</div>
    </div>`).join('');

  box.querySelectorAll('.chap').forEach(h => h.addEventListener('click', () => {
    const secs = h.nextElementSibling; secs.hidden = !secs.hidden;
  }));
  box.querySelectorAll('[data-scope]').forEach(b => b.addEventListener('click', async () => {
    const scope = JSON.parse(b.dataset.scope);
    const questions = filterQuestions(all, scope);
    const key = scopeKey(scope);
    const startIndex = await ctx.store.getProgress(key);
    ctx.session = { questions, key, startIndex };
    location.hash = '#/practice/quiz';
  }));
}

function quiz(el, ctx) {
  const { questions, key, startIndex } = ctx.session;
  el.innerHTML = `<div class="page"><a href="#/practice" class="back">← 返回分类</a><div id="qp"></div></div>`;
  mountQuizPlayer(el.querySelector('#qp'), {
    questions, startIndex, mode: 'practice', store: ctx.store,
    onIndex: i => ctx.store.setProgress(key, i),
  });
}
