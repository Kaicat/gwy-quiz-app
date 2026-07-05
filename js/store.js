import { recordWrong } from './logic.js';

export class Store {
  constructor(kv) { this.kv = kv; this._cache = null; }

  async loadBank(bank) {
    const cur = await this.kv.get('meta', 'bankVersion');
    if (cur === bank.version) {
      const count = (await this.allQuestions()).length;
      return { loaded: false, count };
    }
    await this.kv.clear('questions');
    await this.kv.bulkPut('questions', bank.questions.map(q => [q.id, q]));
    await this.kv.put('meta', 'bankVersion', bank.version);
    this._cache = null;
    return { loaded: true, count: bank.questions.length };
  }

  async allQuestions() {
    if (!this._cache) this._cache = await this.kv.getAll('questions');
    return this._cache;
  }
  async getQuestion(id) { return this.kv.get('questions', id); }

  async markWrong(q, nowIso) {
    const cur = await this.kv.get('wrongBook', q.id);
    await this.kv.put('wrongBook', q.id, recordWrong(cur, q, nowIso));
  }
  async removeWrong(id) { await this.kv.del('wrongBook', id); }
  async listWrong() { return this.kv.getAll('wrongBook'); }

  async toggleFavorite(id, nowIso) {
    const cur = await this.kv.get('favorites', id);
    if (cur) { await this.kv.del('favorites', id); return false; }
    await this.kv.put('favorites', id, { questionId: id, addedAt: nowIso });
    return true;
  }
  async isFavorite(id) { return !!(await this.kv.get('favorites', id)); }
  async listFavorites() { return this.kv.getAll('favorites'); }

  async getProgress(key) { return (await this.kv.get('progress', key)) ?? 0; }
  async setProgress(key, index) { await this.kv.put('progress', key, index); }

  async getEssayDraft(id) { return this.kv.get('essayDrafts', id); }
  async saveEssayDraft(id, text, nowIso) {
    await this.kv.put('essayDrafts', id, { questionId: id, text, updatedAt: nowIso });
  }

  async listVideos() { return this.kv.getAll('videos'); }
  async addVideo(v) { await this.kv.put('videos', `${v.bvid}-${v.page}`, { id: `${v.bvid}-${v.page}`, ...v }); }
  async removeVideo(id) { await this.kv.del('videos', id); }
}
