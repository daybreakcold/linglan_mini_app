// pages/phone-login/phone-login.js
/**
 * 手机号授权页 - 微信手机号一键登录
 * 流程：
 * 1. 从登录页接收 unionId
 * 2. 用户点击按钮授权手机号
 * 3. 调用后端解密手机号
 * 4. 调用登录接口完成登录
 */
const authService = require('../../services/auth')

Page({
  data: {
    isLoading: false,
    // 从上一页传递的微信信息
    unionId: ''
  },

  onLoad(options) {
    console.log('手机号授权页加载, 参数:', options)
    
    // 获取从登录页传递的 unionId
    if (options.unionId) {
      this.setData({
        unionId: decodeURIComponent(options.unionId)
      })
      console.log('获取到 unionId:', this.data.unionId)
    } else {
      // 没有 unionId，返回登录页重新授权
      wx.showToast({ title: '请重新登录', icon: 'none' })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  /**
   * 微信手机号授权登录
   * 流程：获取手机号 code → 解密手机号 → 调用登录接口
   */
  async handleGetPhoneNumber(e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      wx.showToast({ title: '需要授权手机号才能登录', icon: 'none' })
      return
    }

    if (this.data.isLoading) return
    
    this.setData({ isLoading: true })
    wx.showLoading({ title: '登录中...', mask: true })

    try {
      const phoneCode = e.detail.code
      const { unionId } = this.data

      // 检查 unionId
      if (!unionId) {
        throw new Error('用户标识不存在，请重新登录')
      }

      // 1. 解密手机号
      console.log('开始解密手机号...')
      const phoneRes = await authService.decryptPhoneNumber({ code: phoneCode })
      
      if (!phoneRes.success || !phoneRes.data || !phoneRes.data.phone) {
        throw new Error(phoneRes.message || '获取手机号失败')
      }
      
      const phone = phoneRes.data.phone
      console.log('手机号解密成功:', phone)

      // 2. 调用登录接口 POST /api/auth/login
      console.log('开始登录:', { unionId, phone })
      const loginRes = await authService.loginWithWechat({
        unionId: unionId,
        phone: phone,
        avatar: '',
        nickname: ''
      })

      wx.hideLoading()
      this.setData({ isLoading: false })

      if (loginRes.success) {
        console.log('登录成功:', loginRes.data)
        wx.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => {
          wx.switchTab({ url: '/pages/index/index' })
        }, 1500)
      } else {
        throw new Error(loginRes.message || '登录失败')
      }

    } catch (err) {
      wx.hideLoading()
      this.setData({ isLoading: false })
      console.error('登录失败:', err)
      wx.showToast({ title: err.message || '登录失败，请重试', icon: 'none' })
    }
  },

  /**
   * 返回登录页
   */
  goBack() {
    wx.navigateBack()
  }
})
