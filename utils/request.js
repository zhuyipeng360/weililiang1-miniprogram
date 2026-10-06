const BASE_URL = 'https://www.weililiang1.com';
function request({ url, method = 'GET', data, header = {}, ...options }) {
  const session = wx.getStorageSync('session');
  const headers = { 'content-type': 'application/json', ...header };
  if (session && session.token) headers.Authorization = `Bearer ${session.token}`;
  const body = method === 'GET' || method === 'HEAD' || data === undefined ? data : JSON.stringify(data);
  return new Promise((resolve, reject) => wx.request({ url: BASE_URL + url, method, data: body, header: headers, ...options,
    success(res) {
      if (res.statusCode === 401) { const app = getApp(); app && app.login && app.login().catch(() => {}); }
      if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data); else {
        const detail = res.data && res.data.error;
        const message = detail && detail.message ? detail.message : `HTTP ${res.statusCode}`;
        console.error('[request]', res.statusCode, res.data);
        const error = new Error(message); error.statusCode = res.statusCode; error.body = res.data; reject(error);
      }
    }, fail: reject }));
}
module.exports = { BASE_URL, request };
