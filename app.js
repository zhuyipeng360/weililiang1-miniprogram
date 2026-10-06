const { getScreenLevel } = require('./utils/screen');
const { login } = require('./utils/auth');

App({
  globalData: { screenLevel: 'phone', user: null },
  onLaunch() {
    this.globalData.screenLevel = getScreenLevel();
    const cached = wx.getStorageSync('session');
    if (cached && cached.expiresAt > Date.now()) this.globalData.user = cached.user || null;
  },
  onShow() {
    this.globalData.screenLevel = getScreenLevel();
  },
  login,
});
