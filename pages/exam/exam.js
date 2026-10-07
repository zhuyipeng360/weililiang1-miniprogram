const { request } = require('../../utils/request');
const { getScreenLevel } = require('../../utils/screen');

Page({
  data: { bankId: '', requestPath: '', screenLevel: 'phone', questions: [], parts: [], current: 0, answers: {}, loading: true, error: '', debugLogs: [], debugOpen: false },
  onLoad(options) { this.setData({ bankId: decodeURIComponent(options.bankId || '') }); this.load(); },
  onResize(e) { this.setData({ screenLevel: getScreenLevel(e.size.windowWidth) }); },
  async list(path) { const body = await request({ url: '/api/v1/bank/files', method: 'POST', data: { path } }); return (body.data && body.data.files) || []; },
  normalize(doc, requestPath) {
    const raw = doc.questions || [];
    const questions = raw.filter(q => q && q.display && ['choice', 'writing', 'short_text', 'transformation'].includes(q.display.interaction_type)).map(q => {
      const imgPath = q.stimulus_image && q.stimulus_image.path;
      return { ...q, options: Object.entries(q.options).map(([key, text]) => ({ key, text: String(text) })).slice(0, 4), audioUrl: q.audio && q.audio.path ? 'https://www.weililiang1.com/api/v1/bank/content?path=' + encodeURIComponent(requestPath.slice(0, requestPath.lastIndexOf('/')) + '/' + q.audio.path) : '', stimulusUrl: imgPath ? 'https://www.weililiang1.com/api/v1/bank/content?path=' + encodeURIComponent(requestPath.slice(0, requestPath.lastIndexOf('/')) + '/' + imgPath) : '' };
    });
    this.setData({ debugLogs: ['拉到 ' + raw.length + ' 题', '过滤后 ' + questions.length + ' 道选择题', questions[0] && questions[0].stimulusUrl ? '题图URL：' + questions[0].stimulusUrl : '第一题无题图'] });
    const parts = [...new Set(questions.map(q => q.part))].map(part => ({ part, material: (doc.resources || []).find(r => r.part === part && r.learner_material)?.learner_material || '', questions: questions.filter(q => q.part === part) }));
    return { questions, parts };
  },
  async load() {
    try {
      let path = this.data.bankId;
      if (!/\.json$/i.test(path)) {
        let entries = await this.list(path);
        for (let depth = 0; depth < 4 && !entries.some(item => item.type === 'FILE' && /\.json$/i.test(item.name)); depth += 1) { const next = entries.find(item => item.type === 'FOLDER'); if (!next) break; path = `${next.path}/${next.name}`; entries = await this.list(path); }
        const file = entries.find(item => item.type === 'FILE' && /\.json$/i.test(item.name));
        if (!file) throw new Error('未找到题库 JSON 文件（path：' + path + '）');
        path = `${file.path}/${file.name}`;
      }
      this.setData({ requestPath: path }); console.log('[bank-content] path:', path);
      const body = await request({ url: '/api/v1/bank/content?path=' + encodeURIComponent(path) });
      const result = this.normalize(body.data || body, path);
      this.setData({ ...result, loading: false });
    } catch (e) { const status = e.statusCode ? 'HTTP ' + e.statusCode : '网络错误'; const detail = e.body && e.body.error ? JSON.stringify(e.body.error) : (e.message || '未知错误'); this.setData({ error: status + '：' + detail + '；path：' + (this.data.requestPath || this.data.bankId), loading: false }); console.error('[bank-content] failed', { status: e.statusCode, body: e.body, path: this.data.requestPath || this.data.bankId }); }
  },
  onStimulusError(e) { console.error('[stimulus] image load failed:', e); this.setData({ debugLogs: [...(this.data.debugLogs || []), '题图加载失败：请检查上方 URL'] }); },
  toggleDebug() { this.setData({ debugOpen: !this.data.debugOpen }); },
  selectQuestion(e) { this.setData({ current: Number(e.currentTarget.dataset.index) }); },
  onAnswerInput(e) { const id = e.currentTarget.dataset.question; const answers = { ...this.data.answers, [id]: e.detail.value }; this.setData({ answers }); wx.setStorageSync('examAnswers:' + this.data.bankId, answers); }, playAudio(e) { const url = e.currentTarget.dataset.url; if (!url) return; if (this.audio) this.audio.destroy(); this.audio = wx.createInnerAudioContext(); this.audio.src = url; this.audio.play(); }, choose(e) { const question = this.data.questions.find(q => q.id === e.currentTarget.dataset.question) || this.data.questions[this.data.current]; if (!getApp().globalData.user && !wx.getStorageSync('session')) { getApp().login().catch(() => {}); return; } const answers = { ...this.data.answers, [question.id || this.data.current]: e.currentTarget.dataset.key }; this.setData({ answers }); wx.setStorageSync('examAnswers:' + this.data.bankId, answers); }
});
