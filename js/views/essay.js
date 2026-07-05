import { toast } from '../router.js';

export function essayView(el, ctx) {
  const [, , id] = location.hash.split('/');
  if (id) return detail(el, ctx, decodeURIComponent(id));
  list(el, ctx);
}

async function list(el, ctx) {
  const essays = (await ctx.store.allQuestions()).filter(q => q.type === 'essay');
  el.innerHTML = `<div class="page"><h1>申论 <small class="tag">${essays.length} 题</small></h1>
    ${essays.length ? '' : '<div class="card">暂无申论题(题源 PDF 待导入)</div>'}
    ${essays.map(q => `<a class="card essay-item" href="#/essay/${encodeURIComponent(q.id)}">
      <b>${q.section}</b><p>${q.stem.slice(0, 80)}…</p></a>`).join('')}</div>`;
}

async function detail(el, ctx, id) {
  const q = await ctx.store.getQuestion(id);
  if (!q) { el.innerHTML = '<div class="page"><p>题目不存在</p></div>'; return; }
  const draft = await ctx.store.getEssayDraft(id);
  const fav = await ctx.store.isFavorite(id);
  el.innerHTML = `<div class="page"><a href="#/essay" class="back">← 返回列表</a>
    <div class="card">
      <div class="quiz-head"><span class="tag">${q.section}</span>
        <button class="star ${fav ? 'on' : ''}" id="es-fav">${fav ? '★' : '☆'}</button></div>
      <details class="materials" open><summary>给定材料</summary><p>${q.materials || '(无)'}</p></details>
      <div class="stem">${q.stem}</div>
      <textarea id="es-draft" rows="10" placeholder="在此作答,自动保存草稿…">${draft?.text || ''}</textarea>
      <div class="draft-hint" id="es-hint">${draft ? `草稿已保存 ${draft.updatedAt.slice(0, 16).replace('T', ' ')}` : ''}</div>
      <button id="es-reveal" class="ghost">查看参考答案</button>
      <div class="explain" id="es-answer" hidden><b>参考答案</b><p>${q.answer || '(待补)'}</p></div>
    </div></div>`;

  const ta = el.querySelector('#es-draft');
  let timer;
  ta.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const now = new Date().toISOString();
      await ctx.store.saveEssayDraft(id, ta.value, now);
      el.querySelector('#es-hint').textContent = `草稿已保存 ${now.slice(0, 16).replace('T', ' ')}`;
    }, 500);
  });
  el.querySelector('#es-reveal').addEventListener('click', () => {
    el.querySelector('#es-answer').hidden = false;
  });
  el.querySelector('#es-fav').addEventListener('click', async () => {
    const on = await ctx.store.toggleFavorite(id, new Date().toISOString());
    toast(on ? '已收藏' : '已取消收藏'); detail(el, ctx, id);
  });
}
