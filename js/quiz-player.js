import { judgeAnswer } from './logic.js';
import { toast } from './router.js';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function mountQuizPlayer(el, { questions, startIndex = 0, mode, store, onIndex }) {
  let i = Math.min(startIndex, questions.length - 1);
  const answered = new Map(); // qid -> letter

  async function render() {
    const q = questions[i];
    window.__quizCurrent = q;   // 调试/e2e 钩子
    const fav = await store.isFavorite(q.id);
    const sel = answered.get(q.id);
    el.innerHTML = `
      <div class="quiz card">
        <div class="quiz-head">
          <span class="tag">${q.section} · ${q.tier}</span>
          <span class="quiz-pos">${i + 1} / ${questions.length}</span>
          <button class="star ${fav ? 'on' : ''}" id="qp-fav">${fav ? '★' : '☆'}</button>
        </div>
        <div class="stem">${q.source ? `<span class="tag">${q.source}</span>` : ''}${q.stem}</div>
        <div class="options">${q.options.map((o, n) => {
          const L = LETTERS[n];
          let cls = 'opt';
          if (sel) { if (L === q.answer) cls += ' right'; else if (L === sel) cls += ' wrong'; }
          return `<button class="${cls}" data-l="${L}" ${sel ? 'disabled' : ''}>
            <b>${L}</b><span>${o}</span></button>`;
        }).join('')}</div>
        <div class="explain" ${sel ? '' : 'hidden'}>
          <b>${sel === q.answer ? '回答正确' : `正确答案:${q.answer}`}</b>
          <p>${q.explanation || '(暂无解析,待解析册合入)'}</p>
        </div>
        <div class="quiz-nav">
          <button class="ghost" id="qp-prev" ${i === 0 ? 'disabled' : ''}>上一题</button>
          <button class="ghost" id="qp-next" ${i === questions.length - 1 ? 'disabled' : ''}>下一题</button>
        </div>
      </div>`;

    el.querySelectorAll('.opt').forEach(b => b.addEventListener('click', async () => {
      const letter = b.dataset.l;
      answered.set(q.id, letter);
      const { correct } = judgeAnswer(q, letter);
      if (!correct && mode === 'practice') {
        try { await store.markWrong(q, new Date().toISOString()); }
        catch (e) { toast('错题保存失败:' + e); }
      }
      render();
    }));
    el.querySelector('#qp-fav').addEventListener('click', async () => {
      const on = await store.toggleFavorite(q.id, new Date().toISOString());
      toast(on ? '已收藏' : '已取消收藏');
      render();
    });
    el.querySelector('#qp-prev').addEventListener('click', () => go(i - 1));
    el.querySelector('#qp-next').addEventListener('click', () => go(i + 1));
  }

  function go(n) {
    if (n < 0 || n >= questions.length) return;
    i = n; onIndex?.(i); render();
  }

  let sx = 0;
  el.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 60) go(dx < 0 ? i + 1 : i - 1);
  }, { passive: true });

  render();
}
