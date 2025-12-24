// pages/membership/membership.js
const myService = require('../../services/my')
const { navigateToH5 } = require('../../utils/h5Navigation')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 用户信息
    userInfo: {
      avatar: '',
      nickname: ''
    },
    // 会员信息
    membership: {
      active: false,
      level: 1,
      levelName: '会员',
      expireDate: '',
      cardNo: '1278 3987 2979 0789',
      growthValue: 0,
      nextLevelValue: 1000,
      progressPercent: 0
    },
    // 套餐信息
    plans: {
      monthly: {
        price: 9.9,
        originalPrice: 12,
        renewPrice: 12
      },
      yearly: {
        price: 98,
        originalPrice: 238,
        renewPrice: 12
      },
      quarterly: {
        price: 28.8,
        originalPrice: 36,
        renewPrice: 12
      }
    },
    // 选中的套餐
    selectedPlan: 'monthly',
    // 课程列表
    courses: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadMembershipInfo()
    this.loadCourses()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次显示页面时更新用户信息
    this.loadUserInfo()
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const userInfo = wx.getStorageSync('user_info')
    if (userInfo) {
      this.setData({
        userInfo: {
          avatar: userInfo.avatar || '',
          nickname: userInfo.nickname || userInfo.name || '会员昵称'
        }
      })
    }
  },

  /**
   * 加载会员信息
   */
  async loadMembershipInfo() {
    try {
      const res = await myService.getMembershipStatus()
      if (res.success && res.data) {
        const data = res.data

        if (data.active) {
          // 有效会员，映射字段
          const levelMap = {
            'MONTHLY': 1,
            'QUARTERLY': 2,
            'ANNUAL': 3
          }
          const level = levelMap[data.levelCode] || 1

          // 格式化到期时间 (ISO-8601 -> YYYY-MM-DD)
          let expireDate = ''
          if (data.endAt) {
            expireDate = data.endAt.split('T')[0]
          }

          this.setData({
            membership: {
              ...this.data.membership,
              active: true,
              level: level,
              levelName: data.levelName || '会员',
              expireDate: expireDate,
              remainingDays: data.remainingDays || 0
            }
          })
        } else {
          // 未开通会员
          this.setData({
            membership: {
              ...this.data.membership,
              active: false,
              level: 0,
              levelName: '未开通',
              expireDate: '',
              remainingDays: 0
            }
          })
        }
      }
    } catch (err) {
      console.error('加载会员信息失败:', err)
    }
  },

  /**
   * 加载课程列表
   */
  async loadCourses() {
    // TODO: 对接课程列表API
    // 使用示例数据
    this.setData({
      courses: [
        { id: 1, title: '健康养生基础课程', tag: 'VIP', videoCount: 10 },
        { id: 2, title: '经络穴位入门', tag: 'HOT', videoCount: 8 },
        { id: 3, title: '四季养生调理', tag: 'VIP', videoCount: 12 }
      ]
    })
  },

  /**
   * 返回上一页
   */
  onBack() {
    wx.navigateBack()
  },

  /**
   * 立即续费
   */
  onRenew() {
    // 跳转到支付流程
    this.onSubscribe()
  },

  /**
   * 选择套餐
   */
  onSelectPlan(e) {
    const { plan } = e.currentTarget.dataset
    this.setData({ selectedPlan: plan })
  },

  /**
   * 立即开通/订阅
   */
  onSubscribe() {
    const { selectedPlan, plans } = this.data
    const plan = plans[selectedPlan]
    const planNames = {
      monthly: '连续包月',
      yearly: '连续包年',
      quarterly: '连续包季'
    }

    wx.showModal({
      title: '确认订阅',
      content: `您选择了${planNames[selectedPlan]}套餐，首月/首年/首季优惠价￥${plan.price}`,
      confirmText: '确认支付',
      success: (res) => {
        if (res.confirm) {
          // TODO: 对接支付API
          wx.showToast({
            title: '功能开发中',
            icon: 'none'
          })
        }
      }
    })
  },

  /**
   * 查看更多课程
   */
  onViewMoreCourses() {
    navigateToH5('course', {})
  },

  /**
   * 点击课程
   */
  onCourseTap(e) {
    const { id } = e.currentTarget.dataset
    navigateToH5('course-detail', { courseId: id })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '开通灵壹健康VIP会员，畅享健康好课',
      path: '/pages/membership/membership'
    }
  }
})
