import { toast } from '../router.js';

export function settingsView(el, ctx) {
  el.innerHTML = `<div class="page"><a href="#/practice" class="back">← 返回</a>
    <h1>设置</h1>
    <div class="card"><b>题库版本</b><p class="draft-hint" id="s-ver">…</p></div>
    <div class="card"><b>离线材料图</b>
      <p class="draft-hint">资料分析的图表材料需下载后才能离线看(约 32MB,建议 WiFi)</p>
      <p><button class="ghost" id="s-imgs">下载全部材料图</button></p>
    </div>
    <div class="card"><b>危险操作</b>
      <p><button class="ghost" id="s-wipe-wrong">清空错题集</button></p>
      <p><button class="ghost" id="s-wipe-all" style="color:var(--wrong)">重置全部数据</button></p>
    </div></div>`;
  ctx.store.kv.get('meta', 'bankVersion').then(v => {
    el.querySelector('#s-ver').textContent = v || '(未加载)';
  });
  el.querySelector('#s-imgs').addEventListener('click', async () => {
    const qs = await ctx.store.allQuestions();
    const imgs = [...new Set(qs.flatMap(q => q.images || []))];
    const key = (await caches.keys()).find(k => k.startsWith('gwy-quiz-'));
    const c = await caches.open(key);
    let done = 0;
    for (const src of imgs) {
      if (!(await c.match(src))) { try { await c.add(src); } catch (e) {} }
      if (++done % 25 === 0) toast(`材料图 ${done}/${imgs.length}`);
    }
    toast(`材料图已全部离线(${imgs.length} 张)`);
  });
  el.querySelector('#s-wipe-wrong').addEventListener('click', async () => {
    if (!confirm('确定清空错题集?')) return;
    await ctx.store.kv.clear('wrongBook'); toast('已清空');
  });
  el.querySelector('#s-wipe-all').addEventListener('click', async () => {
    if (!confirm('重置将删除错题/收藏/进度/草稿,确定?')) return;
    for (const s of ['wrongBook', 'favorites', 'progress', 'essayDrafts', 'meta']) await ctx.store.kv.clear(s);
    toast('已重置,即将刷新'); setTimeout(() => location.reload(), 800);
  });
}
