// pages/login/login.js
/**
 * 登录页 - 微信授权登录
 * 流程：
 * 1. 用户填写头像和昵称（可选）
 * 2. 用户点击微信登录按钮
 * 3. 调用 code2session 获取 openId/unionId
 * 4. 调用登录接口完成登录，同时传递头像和昵称
 */
const authService = require('../../services/auth')

// 默认头像
const DEFAULT_AVATAR = '/images/icons/avatar-user.svg'

Page({
  data: {
    isLoading: false,
    isAgreed: false,  // 是否同意协议
    avatarUrl: DEFAULT_AVATAR,  // 用户选择的头像
    nickname: ''  // 用户输入的昵称
  },

  onShow() {
    // 每次显示页面时检查登录状态，已登录则跳转首页
    if (authService.isLoggedIn()) {
      wx.switchTab({ url: '/pages/index/index' })
    }
  },

  /**
   * 切换协议同意状态
   */
  onToggleAgreement() {
    this.setData({ isAgreed: !this.data.isAgreed })
  },

  /**
   * 查看用户协议
   */
  onViewUserAgreement() {
    wx.navigateTo({ url: '/pages/agreement/agreement?type=user' })
  },

  /**
   * 查看隐私政策
   */
  onViewPrivacyPolicy() {
    wx.navigateTo({ url: '/pages/agreement/agreement?type=privacy' })
  },

  /**
   * 选择头像回调
   */
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    if (avatarUrl) {
      this.setData({ avatarUrl })
      console.log('用户选择头像:', avatarUrl)
    }
  },

  /**
   * 昵称输入回调
   */
  onInputNickname(e) {
    const nickname = e.detail.value
    this.setData({ nickname })
  },

  /**
   * 昵称输入框失焦
   */
  onNicknameBlur(e) {
    const nickname = e.detail.value
    this.setData({ nickname })
    console.log('用户输入昵称:', nickname)
  },

  /**
   * 微信授权登录
   * 流程：
   * 1. 获取微信 code，调用 code2session 获取 unionId
   * 2. 调用登录接口完成登录
   */
  async onWechatLogin() {
    // 检查是否同意协议
    if (!this.data.isAgreed) {
      wx.showToast({ title: '请先阅读并同意用户协议和隐私政策', icon: 'none' })
      return
    }

    if (this.data.isLoading) return
    
    this.setData({ isLoading: true })
    wx.showLoading({ title: '登录中...', mask: true })

    try {
      // 1. 获取微信 code
      console.log('开始获取微信 code...')
      const code = await authService.wxLogin()
      console.log('获取微信 code 成功:', code)

      // 2. 调用 code2session 获取 unionId
      console.log('调用 code2session...')
      const sessionRes = await authService.getUnionIdByCode(code)
      
      if (!sessionRes.success || !sessionRes.data) {
        throw new Error(sessionRes.message || '获取用户信息失败')
      }

      const { openId, unionId, sessionKey } = sessionRes.data

      console.log('获取用户标识成功:', { openId, unionId })
      
      // 保存 sessionKey 到本地
      if (sessionKey) {
        wx.setStorageSync('wechat_session_key', sessionKey)
      }

      // 3. 调用登录接口 POST /api/auth/login
      // 获取用户填写的头像和昵称
      const { avatarUrl, nickname } = this.data
      // 如果是默认头像则不传
      const avatar = avatarUrl === DEFAULT_AVATAR ? '' : avatarUrl

      console.log('开始登录:', { unionId, avatar, nickname })
      const loginRes = await authService.loginWithWechat({
        unionId,
        phone: '',
        avatar,
        nickname
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
  }
})
