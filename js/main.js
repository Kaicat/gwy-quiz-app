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
    if (!(await store.listVideos()).length) {
      const seed = await fetch('data/videos.json').then(r => r.json()).catch(() => ({ videos: [] }));
      for (const v of seed.videos) await store.addVideo(v);
    }
    initRouter({ practice: practiceView, review: reviewView,
      essay: essayView, videos: videosView, settings: settingsView }, { store });
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
  } catch (e) {
    document.getElementById('view').innerHTML =
      `<div class="page"><h1>启动失败</h1><p>${e}</p></div>`;
  }
})();
