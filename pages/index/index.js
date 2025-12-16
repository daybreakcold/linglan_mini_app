// pages/index/index.js
const app = getApp()
const homeService = require('../../services/home')
const authService = require('../../services/auth')

// 标签名称中英文映射
const TAG_NAME_MAP = {
  'PHYSIQUE': '体质调理',
  'SPINE': '脊柱护理',
  'COUGH': '咳嗽调理',
  'DIET': '饮食调养',
  'SLEEP': '睡眠改善',
  'EMOTION': '情志调节',
  'EXERCISE': '运动养生',
  'CHILD': '小儿健康',
  'ELDERLY': '老年养生',
  'WOMAN': '女性调理',
  'SEASON': '节气养生'
}

/**
 * 转换标签名称为中文
 */
const convertTagName = (tagName) => {
  if (!tagName) return '健康咨询'
  return TAG_NAME_MAP[tagName.toUpperCase()] || tagName
}

/**
 * 标准化消息角色（处理大小写不一致问题）
 */
const normalizeRole = (role) => {
  if (!role) return ''
  return role.toUpperCase()
}

/**
 * 处理场景对话数据
 */
const processDialogScenarios = (scenarios) => {
  if (!scenarios || !Array.isArray(scenarios)) return []
  
  return scenarios.map(scenario => ({
    ...scenario,
    displayTag: convertTagName(scenario.tag),
    doctor: scenario.doctor || {
      name: '灵医生',
      avatar: '/images/icons/avatar-doctor.svg'
    },
    messages: (scenario.messages || []).map(msg => ({
      ...msg,
      role: normalizeRole(msg.role)
    }))
  }))
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 品牌名称
    brandName: '灵壹健康',
    // 高亮卡片数据
    highlights: [],
    // 课程标签数据（热门标签）
    courseTags: [],
    // 所有课程列表（扁平化）
    allCourses: [],
    // 当前选中的课程标签索引
    currentTagIndex: 0,
    // 场景对话数据
    dialogScenarios: [],
    // 当前选中的场景对话
    currentScenario: null,
    // 加载状态
    isLoading: true,
    // 当前课程轮播索引
    currentCourseIndex: 0,
    // 企业微信获客助手
    leadAssistant: {
      enabled: false,
      url: ''
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('首页加载')
    this.loadHomeData()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 设置 tabBar 选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  /**
   * 加载首页数据
   */
  async loadHomeData() {
    this.setData({ isLoading: true })

    try {
      // 并行请求首页数据、获客助手配置和品牌名称
      const [homeData, leadAssistantRes, brandNameRes] = await Promise.all([
        homeService.getHomeData(),
        homeService.getLeadAssistant().catch(err => ({ success: false, data: null })),
        homeService.getBrandName().catch(err => ({ success: false, data: null }))
      ])

      const { highlights, courseTags, dialogScenarios } = homeData

      // 处理获客助手数据
      const leadAssistant = {
        enabled: leadAssistantRes.success && leadAssistantRes.data?.enabled && leadAssistantRes.data?.url,
        url: leadAssistantRes.data?.url || ''
      }

      // 处理品牌名称数据
      const brandName = brandNameRes.success && brandNameRes.data?.brandName 
        ? brandNameRes.data.brandName 
        : '灵壹健康'

      // 处理课程标签数据：转换标签名称为中文
      const processedCourseTags = courseTags.map(tag => ({
        ...tag,
        displayName: convertTagName(tag.tagName)
      }))

      // 获取所有课程（扁平化）
      const allCourses = []
      processedCourseTags.forEach(tag => {
        if (tag.courses && tag.courses.length > 0) {
          tag.courses.forEach(course => {
            allCourses.push({
              ...course,
              tagName: tag.displayName
            })
          })
        }
      })

      // 处理场景对话数据
      const processedScenarios = processDialogScenarios(dialogScenarios)

      this.setData({
        brandName,
        highlights,
        courseTags: processedCourseTags,
        allCourses,
        currentTagIndex: 0,
        dialogScenarios: processedScenarios,
        currentScenario: processedScenarios.length > 0 ? processedScenarios[0] : null,
        isLoading: false,
        leadAssistant
      })

      console.log('首页数据加载成功:', { highlights, processedCourseTags, processedScenarios })
    } catch (err) {
      console.error('加载首页数据失败:', err)
      this.setData({ isLoading: false })
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      })
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadHomeData().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '灵壹健康 - 您的专属健康管家',
      path: '/pages/index/index'
    }
  },

  /**
   * 搜索按钮点击
   */
  onSearch() {
    wx.showToast({
      title: '搜索功能开发中',
      icon: 'none'
    })
  },

  /**
   * 消息按钮点击
   */
  onMessage() {
    wx.showToast({
      title: '消息功能开发中',
      icon: 'none'
    })
  },

  /**
   * 健康咨询点击 - 跳转到问询聊天页面（需要登录）
   */
  onHealthConsult() {
    if (!authService.checkLogin()) return
    wx.navigateTo({
      url: '/pages/inquiry-chat/inquiry-chat'
    })
  },

  /**
   * 养身课堂点击 - 跳转到课程TAB
   */
  onHealthClass() {
    wx.switchTab({
      url: '/pages/lesson/lesson'
    })
  },

  /**
   * 高亮卡片点击
   */
  onHighlightTap(e) {
    const { index } = e.currentTarget.dataset
    const highlight = this.data.highlights[index]

    // 处理默认数据情况（无API数据时）
    if (!highlight) {
      if (index === 0) {
        // 养身第一课 -> 跳转课程详情（不需要登录）
        this.navigateToFirstCourse()
      } else if (index === 1) {
        // 正在学习 -> 跳转课程列表页
        wx.navigateTo({
          url: '/pages/course/course'
        })
      } else if (index === 2) {
        // 正在提问 -> 跳转AI问询（需要登录）
        if (!authService.checkLogin()) return
        wx.navigateTo({
          url: '/pages/inquiry-chat/inquiry-chat'
        })
      }
      return
    }

    // 处理API数据情况
    if (highlight.type === '课程' && highlight.courseSectionId) {
      // 跳转到课程详情（courseSectionId 实际是课程ID）
      wx.navigateTo({
        url: `/pages/course-detail/course-detail?courseId=${highlight.courseSectionId}`
      })
    } else if (highlight.type === 'AI' || highlight.type === '提问') {
      // 跳转到问询页面（需要登录）
      if (!authService.checkLogin()) return
      wx.navigateTo({
        url: '/pages/inquiry-chat/inquiry-chat'
      })
    } else if (highlight.type === '学习' || highlight.type === '文章') {
      // 跳转到课程列表页
      wx.navigateTo({
        url: '/pages/course/course'
      })
    } else {
      wx.showToast({
        title: highlight.name,
        icon: 'none'
      })
    }
  },

  /**
   * 跳转到第一个课程
   */
  navigateToFirstCourse() {
    const { courseTags } = this.data
    if (courseTags.length > 0 && courseTags[0].courses && courseTags[0].courses.length > 0) {
      const course = courseTags[0].courses[0]
      wx.navigateTo({
        url: `/pages/course-detail/course-detail?courseId=${course.courseId}&sectionId=${course.firstSectionId || ''}`
      })
    } else {
      // 无课程数据时跳转到课堂页
      wx.switchTab({
        url: '/pages/course/course'
      })
    }
  },

  /**
   * 添加企业微信
   */
  onAddWechat() {
    const { leadAssistant } = this.data
    if (leadAssistant.enabled && leadAssistant.url) {
      wx.navigateTo({
        // 接口返回的是企业微信二维码图片地址，传给 webview 页面展示
        url: '/pages/webview/webview?wecom=1&cardImage=' + encodeURIComponent(leadAssistant.url) + '&title=' + encodeURIComponent('添加专属微信群')
      })
    }
  },

  /**
   * 课程标签点击 - 切换显示该标签下的课程
   */
  onCourseTagTap(e) {
    const { index } = e.currentTarget.dataset
    this.setData({
      currentTagIndex: index,
      currentCourseIndex: 0 // 重置轮播索引
    })
  },

  /**
   * 课程轮播切换
   */
  onCourseSwipeChange(e) {
    const { current } = e.detail
    this.setData({ currentCourseIndex: current })
  },

  /**
   * 课程卡片点击 - 跳转课程详情
   */
  onCourseTap(e) {
    const { course } = e.currentTarget.dataset
    if (course && course.courseId) {
      // 有 courseId 即可跳转，sectionId 可选
      const url = course.firstSectionId
        ? `/pages/course-detail/course-detail?courseId=${course.courseId}&sectionId=${course.firstSectionId}`
        : `/pages/course-detail/course-detail?courseId=${course.courseId}`
      wx.navigateTo({ url })
    } else if (course) {
      wx.showToast({
        title: course.title || '课程信息不完整',
        icon: 'none'
      })
    }
  },

  /**
   * 场景对话标签点击
   */
  onScenarioTagTap(e) {
    const { index } = e.currentTarget.dataset
    const scenario = this.data.dialogScenarios[index]
    
    if (scenario) {
      this.setData({ currentScenario: scenario })
    }
  },

  /**
   * 场景对话卡片点击 - 进入对话（需要登录）
   */
  onScenarioTap() {
    if (!authService.checkLogin()) return
    const { currentScenario } = this.data
    if (currentScenario && currentScenario.templateId) {
      // 跳转到问询聊天页，带上模板ID
      wx.navigateTo({
        url: `/pages/inquiry-chat/inquiry-chat?templateId=${currentScenario.templateId}&title=${encodeURIComponent(currentScenario.title || '')}`
      })
    } else {
      // 无模板ID时直接跳转到默认问询页
      wx.navigateTo({
        url: '/pages/inquiry-chat/inquiry-chat'
      })
    }
  },

  /**
   * 小课堂详情
   */
  onLessonDetail() {
    const { courseTags } = this.data
    if (courseTags.length > 0 && courseTags[0].courses && courseTags[0].courses.length > 0) {
      const course = courseTags[0].courses[0]
      wx.navigateTo({
        url: `/pages/course-detail/course-detail?courseId=${course.courseId}`
      })
    } else {
      wx.showToast({
        title: '课程详情开发中',
        icon: 'none'
      })
    }
  }
})
