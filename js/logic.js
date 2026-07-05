export function judgeAnswer(q, letter) {
  return { correct: q.answer === letter, answer: q.answer };
}

export function recordWrong(existing, q, nowIso) {
  if (!existing) return { questionId: q.id, module: q.module, chapter: q.chapter,
    section: q.section, count: 1, times: [nowIso] };
  return { ...existing, count: existing.count + 1, times: [...existing.times, nowIso] };
}

export function parseBiliLink(input) {
  const s = String(input || '').trim();
  if (/b23\.tv/i.test(s)) return { error: 'short' };
  const m = s.match(/(BV[0-9A-Za-z]{10})/);
  if (!m) return { error: 'invalid' };
  const pm = s.match(/[?&]p=(\d+)/);
  return { bvid: m[1], page: pm ? parseInt(pm[1], 10) : 1 };
}

export function embedUrl(bvid, page = 1) {
  return `https://player.bilibili.com/player.html?bvid=${bvid}&p=${page}&autoplay=0&high_quality=1`;
}

export function scopeKey(s = {}) {
  return [s.module || '*', s.chapter || '*', s.section || '*', s.tier || '*'].join('|');
}

export function filterQuestions(all, s = {}) {
  return all.filter(q => q.type === 'single'
    && (!s.module || q.module === s.module)
    && (!s.chapter || q.chapter === s.chapter)
    && (!s.section || q.section === s.section)
    && (!s.tier || q.tier === s.tier));
}

const MODULE_ORDER = ['政治理论与常识判断', '判断推理', '数量关系', '言语理解', '资料分析'];

export function groupTree(all) {
  const singles = all.filter(q => q.type === 'single');
  const modules = [];
  for (const q of singles) {
    let m = modules.find(x => x.module === q.module);
    if (!m) modules.push(m = { module: q.module, count: 0, chapters: [] });
    m.count++;
    let c = m.chapters.find(x => x.chapter === q.chapter);
    if (!c) m.chapters.push(c = { chapter: q.chapter, count: 0, sections: [] });
    c.count++;
    let s = c.sections.find(x => x.section === q.section);
    if (!s) c.sections.push(s = { section: q.section, count: 0, tiers: [] });
    s.count++;
    let t = s.tiers.find(x => x.tier === q.tier);
    if (!t) s.tiers.push(t = { tier: q.tier, count: 0 });
    t.count++;
  }
  modules.sort((a, b) => {
    const ia = MODULE_ORDER.indexOf(a.module), ib = MODULE_ORDER.indexOf(b.module);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return modules;
}
