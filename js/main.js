import { initRouter, toast } from './router.js';
import { openKV } from './db.js';
import { Store } from './store.js';
import { practiceView } from './views/practice.js';
import { reviewView } from './views/review.js';
import { essayView } from './views/essay.js';
import { videosView } from './views/videos.js';
import { settingsView } from './views/settings.js';

(async () => {
  try {
    const store = new Store(await openKV());
    const bank = await fetch('data/questions.json').then(r => r.json());
    const { loaded, count } = await store.loadBank(bank);
    if (loaded) toast(`题库已更新:${count} 题`);
    const seed = await fetch('data/videos.json').then(r => r.json()).catch(() => null);
    if (seed && (await store.kv.get('meta', 'videoSeedVersion')) !== seed.seedVersion) {
      for (const v of seed.videos) await store.addVideo(v);   // 同 id 覆盖(更新标题),用户自加的不受影响
      await store.kv.put('meta', 'videoSeedVersion', seed.seedVersion);
    }
    initRouter({ practice: practiceView, review: reviewView,
      essay: essayView, videos: videosView, settings: settingsView }, { store });
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
  } catch (e) {
    document.getElementById('view').innerHTML =
      `<div class="page"><h1>启动失败</h1><p>${e}</p></div>`;
  }
})();
