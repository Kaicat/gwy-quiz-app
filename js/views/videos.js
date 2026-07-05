import { parseBiliLink, embedUrl } from '../logic.js';
import { toast } from '../router.js';

export function videosView(el, ctx) { render(el, ctx); }

async function render(el, ctx, playingId) {
  const vids = (await ctx.store.listVideos())
    .sort((a, b) => a.bvid.localeCompare(b.bvid) || a.page - b.page);
  const playing = vids.find(v => v.id === playingId);
  el.innerHTML = `<div class="page"><h1>视频课程</h1>
    ${playing ? playerHtml(playing) : ''}
    <div class="card">
      <div class="filter-row">
        <input id="v-link" placeholder="粘贴 B 站链接或 BV 号">
      </div>
      <div class="filter-row">
        <input id="v-title" placeholder="标题(可选)">
        <button id="v-add">添加</button>
      </div>
      <p class="draft-hint">b23.tv 短链请先在浏览器打开,复制地址栏的完整链接</p>
    </div>
    ${vids.length ? '' : '<div class="card">清单为空,粘贴 B 站链接添加课程</div>'}
    ${vids.map(v => `<div class="card wrong-item">
      <div class="w-stem">${v.title || v.bvid}${v.page > 1 ? ` · P${v.page}` : ''}</div>
      <div class="w-meta">
        <button class="small" data-play="${v.id}">播放</button>
        <button class="ghost small" data-rm="${v.id}">删除</button></div>
    </div>`).join('')}</div>`;

  el.querySelector('#v-add').addEventListener('click', async () => {
    const input = el.querySelector('#v-link').value;
    const r = parseBiliLink(input);
    if (r.error === 'short') return toast('短链无法解析,请粘贴完整 bilibili.com 链接');
    if (r.error) return toast('无法识别 BV 号');
    const title = el.querySelector('#v-title').value.trim();
    await ctx.store.addVideo({ bvid: r.bvid, page: r.page, title });
    toast('已添加'); render(el, ctx);
  });
  el.querySelectorAll('[data-play]').forEach(b => b.addEventListener('click', () =>
    render(el, ctx, b.dataset.play)));
  el.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', async () => {
    await ctx.store.removeVideo(b.dataset.rm); render(el, ctx);
  }));
}

function playerHtml(v) {
  if (!navigator.onLine) return `<div class="card">当前离线,连网后可播放《${v.title || v.bvid}》</div>`;
  return `<div class="card player-card">
    <iframe src="${embedUrl(v.bvid, v.page)}" allowfullscreen
      sandbox="allow-scripts allow-same-origin allow-popups"></iframe>
    <div class="draft-hint">${v.title || v.bvid}</div></div>`;
}
