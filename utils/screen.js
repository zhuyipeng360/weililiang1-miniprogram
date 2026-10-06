function getScreenLevel(width) {
  const w = Number(width || wx.getSystemInfoSync().windowWidth || 375);
  return w < 600 ? 'phone' : w <= 1000 ? 'pad' : 'pc';
}
module.exports = { getScreenLevel };
