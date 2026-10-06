const { request } = require('./request');
let pending;
function login(profile) {
  if (pending) return pending;
  pending = new Promise((resolve, reject) => wx.login({
    success: ({ code }) => request({ url: '/api/v1/auth/wechat/miniprogram', method: 'POST', data: { code } })
      .then(body => {
        const data = body.data || body;
        const token = data.token || data.session || data.session_token;
        const user = data.user || data.account || null;
        if (!token) throw new Error('登录接口未返回 session');
        wx.setStorageSync('session', { token, user, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 });
        const app = getApp(); if (app) app.globalData.user = user;
        resolve(user);
      }).catch(reject), fail: reject
  }));
  pending.finally(() => { pending = null; });
  return pending;
}
module.exports = { login };
