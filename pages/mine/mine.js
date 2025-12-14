// pages/mine/mine.js
const myService = require('../../services/my')
const authService = require('../../services/auth')

Page({
  data: {
    profile: null,
    loading: false,
    displayNickname: '灵医用户',
    displayAvatar: '/images/icons/avatar-user.svg',
    displayPhone: '账户中心',
    membershipText: '未开通',
    messageBadge: '',
    showHealthForm: false,
    healthForm: {
      phone: '',
      fullName: '',
      age: '',
      gender: 1, // 0-女 1-男 (与API保持一致)
      heightCm: '',
      weightKg: '',
      extra: ''
    },
    healthSaving: false
  },

  onLoad(options) {},

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    this.fetchProfile()
  },

  /**
   * 点击会员卡/开通会员入口（需要登录）
   */
  onMembershipTap() {
    if (!authService.checkLogin()) return
    wx.navigateTo({
      url: '/pages/membership/membership'
    })
  },

  /**
   * 点击健康档案入口（需要登录）
   */
  async onHealthProfileTap() {
    if (!authService.checkLogin()) return
    await this.loadHealthProfile()
    this.setData({ showHealthForm: true })
  },

  /**
   * 读取健康档案
   */
  async loadHealthProfile() {
    try {
      const res = await myService.getHealthProfile()
      if (res && res.success) {
        const hp = res.data || {}
        this.setData({
          healthForm: {
            phone: hp.phone || '',
            fullName: hp.fullName || '',
            age: hp.age || '',
            gender: typeof hp.gender === 'number' ? hp.gender : 1,
            heightCm: hp.heightCm || '',
            weightKg: hp.weightKg || '',
            extra: hp.extra || ''
          }
        })
      }
    } catch (err) {
      console.error('获取健康档案失败', err)
      wx.showToast({ title: '获取健康档案失败', icon: 'none' })
    }
  },

  /**
   * 健康档案输入变化
   */
  onHealthInput(e) {
    const { field } = e.currentTarget.dataset
    const value = e.detail.value
    if (!field) return
    this.setData({
      [`healthForm.${field}`]: value
    })
  },

  /**
   * 性别选择
   */
  onGenderChange(e) {
    const gender = Number(e.detail.value) || 0
    this.setData({
      'healthForm.gender': gender
    })
  },

  /**
   * 保存健康档案
   */
  async onSaveHealthProfile() {
    if (this.data.healthSaving) return
    this.setData({ healthSaving: true })
    try {
      const payload = { ...this.data.healthForm }
      const res = await myService.saveHealthProfile(payload)
      if (res && res.success) {
        wx.showToast({ title: '保存成功', icon: 'success' })
        this.setData({ showHealthForm: false })
        // 重新拉取个人信息，保持一致
        this.fetchProfile()
      } else {
        throw new Error(res?.message || '保存失败')
      }
    } catch (err) {
      console.error('保存健康档案失败', err)
      wx.showToast({ title: err.message || '保存失败', icon: 'none' })
    } finally {
      this.setData({ healthSaving: false })
    }
  },

  /**
   * 取消编辑
   */
  onCancelHealthProfile() {
    this.setData({ showHealthForm: false })
  },

  /**
   * 功能开发中提示
   */
  onFeatureNotReady() {
    wx.showToast({
      title: '功能正在开发中，稍后上架',
      icon: 'none',
      duration: 2000
    })
  },

  /**
   * 获取用户信息
   */
  async fetchProfile() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const res = await myService.getProfile()
      if (res && res.success) {
          const profile = res.data || {}
          const nickname = profile.nickname && profile.nickname.trim() ? profile.nickname : '灵医用户'
          const avatar = profile.avatar && profile.avatar.trim()
            ? profile.avatar
            : '/images/icons/avatar-user.svg'
          const phoneLabel = profile.phone || '账户中心'
          const membership = profile.membership || {}
          const membershipText = membership.active
            ? (membership.levelName || '会员')
            : '未开通'

          // 消息角标：从 entries 中找 messages，或者用 stats.favoriteCount 兜底
          let messageBadge = ''
          if (Array.isArray(profile.entries)) {
            const msgEntry = profile.entries.find(item => item.code === 'messages')
            if (msgEntry && typeof msgEntry.badge === 'number' && msgEntry.badge > 0) {
              messageBadge = msgEntry.badge > 99 ? '99+' : `${msgEntry.badge}`
            }
          }

          this.setData({
            profile,
            displayNickname: nickname,
            displayAvatar: avatar,
            displayPhone: phoneLabel,
            membershipText,
            messageBadge
          })
      } else {
        throw new Error(res?.message || '获取用户信息失败')
      }
    } catch (err) {
      console.error('获取用户信息失败', err)
      wx.showToast({ title: err.message || '获取用户信息失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})
