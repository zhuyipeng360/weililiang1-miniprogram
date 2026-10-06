const BASE_URL = 'https://www.weililiang1.com';
function request({ url, method = 'GET', data, header = {}, ...options }) {
  const session = wx.getStorageSync('session');
  const headers = { 'content-type': 'application/json', ...header };
  if (session && session.token) headers.Authorization = `Bearer ${session.token}`;
  return new Promise((resolve, reject) => wx.request({ url: BASE_URL + url, method, data, header: headers, ...options,
    success(res) {
      if (res.statusCode === 401) { const app = getApp(); app && app.login && app.login().catch(() => {}); }
      if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data); else reject(new Error(`HTTP ${res.statusCode}`));
    }, fail: reject }));
}
module.exports = { BASE_URL, request };
