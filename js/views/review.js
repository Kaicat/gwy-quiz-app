import { mountQuizPlayer } from '../quiz-player.js';
import { toast } from '../router.js';

export function reviewView(el, ctx) {
  const [, , sub] = location.hash.split('/');
  if (sub === 'quiz' && ctx.session?.questions?.length) return quiz(el, ctx);
  home(el, ctx);
}

const fmt = iso => iso.slice(0, 10);

async function home(el, ctx) {
  const seg = ctx.reviewSeg || 'wrong';
  el.innerHTML = `<div class="page"><h1>错题 · 收藏</h1>
    <div class="segs">
      <button class="${seg === 'wrong' ? '' : 'ghost'}" id="seg-w">错题集</button>
      <button class="${seg === 'fav' ? '' : 'ghost'}" id="seg-f">收藏夹</button>
    </div>
    <div id="list"></div></div>`;
  el.querySelector('#seg-w').addEventListener('click', () => { ctx.reviewSeg = 'wrong'; home(el, ctx); });
  el.querySelector('#seg-f').addEventListener('click', () => { ctx.reviewSeg = 'fav'; home(el, ctx); });
  const box = el.querySelector('#list');
  if (seg === 'wrong') renderWrong(box, ctx); else renderFav(box, ctx);
}

async function renderWrong(box, ctx) {
  let entries = await ctx.store.listWrong();
  entries.sort((a, b) => b.times.at(-1).localeCompare(a.times.at(-1)));
  const chapters = [...new Set(entries.map(e => e.chapter))];
  const cur = ctx.wrongFilter && chapters.includes(ctx.wrongFilter) ? ctx.wrongFilter : '';
  if (cur) entries = entries.filter(e => e.chapter === cur);
  if (!entries.length && !cur) { box.innerHTML = '<div class="card">暂无错题,继续练习吧</div>'; return; }

  const qs = (await Promise.all(entries.map(e => ctx.store.getQuestion(e.questionId)))).filter(Boolean);
  box.innerHTML = `
    <div class="filter-row">
      <select id="wf"><option value="">全部章节</option>
        ${chapters.map(c => `<option ${c === cur ? 'selected' : ''}>${c}</option>`).join('')}</select>
      <button id="drill" ${qs.length ? '' : 'disabled'}>顺序刷 ${qs.length} 题</button>
    </div>
    ${entries.map((e, n) => `<div class="card wrong-item">
      <div class="w-stem" data-one="${n}">${qs[n]?.stem?.slice(0, 60) ?? '(题目缺失)'}…</div>
      <div class="w-meta"><span class="tag">${e.section}</span>
        <span class="tag">错 ${e.count} 次</span>
        <span class="tag">最近 ${fmt(e.times.at(-1))}</span>
        <button class="ghost small" data-rm="${e.questionId}">移除</button></div>
    </div>`).join('')}`;

  box.querySelectorAll('[data-one]').forEach(d => d.addEventListener('click', () => {
    const q = qs[+d.dataset.one];
    if (!q) return;
    ctx.session = { questions: [q], mode: 'wrong' };
    location.hash = '#/review/quiz';
  }));

  box.querySelector('#wf').addEventListener('change', ev => {
    ctx.wrongFilter = ev.target.value; renderWrong(box, ctx);
  });
  box.querySelector('#drill')?.addEventListener('click', () => {
    ctx.session = { questions: qs, mode: 'wrong' };
    location.hash = '#/review/quiz';
  });
  box.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', async () => {
    await ctx.store.removeWrong(b.dataset.rm);
    toast('已移出错题集'); renderWrong(box, ctx);
  }));
}

async function renderFav(box, ctx) {
  const favs = (await ctx.store.listFavorites())
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  if (!favs.length) { box.innerHTML = '<div class="card">还没有收藏题目</div>'; return; }
  const qs = (await Promise.all(favs.map(f => ctx.store.getQuestion(f.questionId)))).filter(Boolean);
  const singles = qs.filter(q => q.type === 'single');
  box.innerHTML = `
    <div class="filter-row"><button id="drill" ${singles.length ? '' : 'disabled'}>
      顺序刷 ${singles.length} 题</button></div>
    ${qs.map((q, n) => `<div class="card wrong-item">
      <div class="w-stem" data-one="${n}">${q.stem.slice(0, 60)}…</div>
      <div class="w-meta"><span class="tag">${q.section}</span><span class="tag">${q.tier}</span></div>
    </div>`).join('')}`;
  box.querySelector('#drill')?.addEventListener('click', () => {
    ctx.session = { questions: singles, mode: 'fav' };
    location.hash = '#/review/quiz';
  });
  box.querySelectorAll('[data-one]').forEach(d => d.addEventListener('click', () => {
    const q = qs[+d.dataset.one];
    if (!q) return;
    if (q.type === 'essay') { location.hash = '#/essay/' + encodeURIComponent(q.id); return; }
    ctx.session = { questions: [q], mode: 'fav' };
    location.hash = '#/review/quiz';
  }));
}

function quiz(el, ctx) {
  const { questions, mode } = ctx.session;
  el.innerHTML = `<div class="page"><a href="#/review" class="back">← 返回列表</a><div id="qp"></div></div>`;
  mountQuizPlayer(el.querySelector('#qp'), { questions, startIndex: 0, mode, store: ctx.store });
}
