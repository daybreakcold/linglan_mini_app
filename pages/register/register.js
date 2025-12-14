// pages/register/register.js
const app = getApp()

Page({
  data: {
    username: '',
    password: '',
    isAgreed: false,
    isLoading: false
  },

  onLoad(options) {
    console.log('注册页加载')
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value })
  },

  toggleAgreement() {
    this.setData({ isAgreed: !this.data.isAgreed })
  },

  showAgreement() {
    wx.showModal({
      title: '平台协议',
      content: '欢迎使用灵壹健康平台，请仔细阅读以下协议内容...',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  goToLogin() {
    wx.navigateBack()
  },

  goToPhoneRegister() {
    wx.showToast({ title: '手机注册开发中', icon: 'none' })
  },

  onRegister() {
    const { username, password, isAgreed, isLoading } = this.data
    if (isLoading) return

    if (!username.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' })
      return
    }
    if (!password.trim()) {
      wx.showToast({ title: '请输入密码', icon: 'none' })
      return
    }
    if (password.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' })
      return
    }
    if (!isAgreed) {
      wx.showToast({ title: '请先同意平台协议', icon: 'none' })
      return
    }

    this.setData({ isLoading: true })

    setTimeout(() => {
      this.setData({ isLoading: false })
      wx.setStorageSync('userInfo', { username, isLoggedIn: true })
      wx.showToast({ title: '注册成功', icon: 'success' })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 1500)
    }, 1000)
  }
})

