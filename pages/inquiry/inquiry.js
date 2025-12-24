// pages/inquiry/inquiry.js
const aiService = require('../../services/ai')
const authService = require('../../services/auth')
const { parseMarkdown } = require('../../utils/markdown')
const { navigateToH5 } = require('../../utils/h5Navigation')

// 默认模板ID（问询页面使用的默认场景）
const DEFAULT_TEMPLATE_ID = 1

Page({
  data: {
    // 医生信息
    doctor: {
      name: '灵医生',
      avatar: '/images/icons/avatar-doctor.svg'
    },
    // 用户信息（从健康档案或登录信息获取）
    user: {
      name: '张玉',
      avatar: 'https://ide.code.fun/api/image?token=693067d49520a30011f76066&name=92a02a6bdc78a62cbf6194f6130c66ef.png'
    },
    // 健康档案（字段参考 GET /api/me/health-profile）
    healthProfile: {
      phone: '',
      fullName: '',
      age: null,
      gender: null,  // 0=女、1=男
      heightCm: null,
      weightKg: null,
      extra: ''
    },
    // 对话模板信息
    dialogTitle: '',
    dialogDescription: '',
    dialogTags: [],
    // 消息列表
    messages: [],
    // 输入框内容
    inputValue: '',
    // 是否正在发送
    isSending: false,
    // 是否正在加载
    isLoading: true,
    // 是否正在加载历史
    isLoadingHistory: false,
    // 场景标签
    tag: '',
    // 模板ID
    templateId: null,
    // 历史是否还有更多
    historyHasMore: false,
    // 历史游标
    nextCursor: '',
    // 页面是否已初始化
    initialized: false,
    // 是否已尝试加载历史（用于 TAB 点击兜底调用）
    historyLoaded: false,
    // 是否正在初始化，避免重复触发
    initInProgress: false,
    // 滚动区域高度（动态计算）
    scrollAreaHeight: 0,
    // 滚动到底部的id（新增，用于自动滚动）
    scrollToView: '',
    // 快捷问题（新增）
    quickQuestions: [
      '孩子最近咳嗽怎么办？',
      '如何调理脾胃虚弱？',
      '秋冬季节如何养生？',
      '失眠多梦怎么调理？'
    ]
  },

  onLoad(options) {
    // 可以从 options 获取 templateId，否则使用默认值
    const templateId = options.templateId ? Number(options.templateId) : DEFAULT_TEMPLATE_ID
    this.setData({ templateId })
    this.initDialogAndHistory(templateId)
  },

  onReady() {
    // 页面渲染完成后延迟计算滚动区域高度，确保 fixed 元素已渲染
    setTimeout(() => {
      this.calculateScrollAreaHeight()
    }, 100)
  },

  /**
   * 动态计算滚动区域高度
   * 滚动区域 = 标题下方 到 输入框上方
   */
  calculateScrollAreaHeight() {
    // 获取顶部固定区域和输入框区域的位置
    const query = wx.createSelectorQuery()
    query.select('.header-fixed').boundingClientRect()
    query.select('.input-area').boundingClientRect()
    query.exec((res) => {
      const headerRect = res[0]
      const inputRect = res[1]

      // 如果元素还没渲染好，使用备用计算方式
      if (!headerRect || !inputRect) {
        console.log('元素未渲染，使用备用计算')
        this.calculateScrollAreaHeightFallback()
        return
      }

      // 标题底部位置（距离视口顶部）
      const headerBottom = headerRect.bottom
      // 输入框顶部位置（距离视口顶部）
      const inputTop = inputRect.top

      // 滚动区域高度 = 输入框顶部 - 标题底部
      const scrollHeight = inputTop - headerBottom

      console.log('计算滚动高度:', {
        headerBottom,
        inputTop,
        scrollHeight
      })

      this.setData({
        scrollAreaHeight: scrollHeight > 0 ? scrollHeight : 300
      })
    })
  },

  /**
   * 备用计算方式：使用系统信息计算
   */
  calculateScrollAreaHeightFallback() {
    const systemInfo = wx.getSystemInfoSync()
    const windowHeight = systemInfo.windowHeight
    const safeAreaTop = systemInfo.safeArea ? systemInfo.safeArea.top : 44
    const safeAreaBottom = systemInfo.safeArea ? (systemInfo.screenHeight - systemInfo.safeArea.bottom) : 34

    // rpx 转 px 比例
    const pixelRatio = systemInfo.windowWidth / 750

    // 标题区域高度估算：状态栏 + mt-48(48rpx) + 标题文字(48rpx行高)
    const headerHeight = safeAreaTop + (48 + 50) * pixelRatio

    // 输入框区域高度：padding(32rpx) + input(72rpx) + padding(约20rpx)
    const inputAreaHeight = 120 * pixelRatio

    // tabBar 高度
    const tabBarHeight = 100 * pixelRatio

    // 滚动区域高度 = 窗口高度 - 标题高度 - 输入框高度 - tabBar高度 - 安全区底部
    const scrollHeight = windowHeight - headerHeight - inputAreaHeight - tabBarHeight - safeAreaBottom - 200

    console.log('备用计算滚动高度:', {
      windowHeight,
      headerHeight,
      inputAreaHeight,
      tabBarHeight,
      safeAreaBottom,
      scrollHeight
    })

    this.setData({
      scrollAreaHeight: scrollHeight > 0 ? scrollHeight : 300
    })
  },

  /**
   * 初始化对话页面并加载历史记录
   */
  async initDialogAndHistory(templateId) {
    // 防止重复初始化
    if (this.data.initInProgress) return
    this.setData({ initInProgress: true })
    try {
      await this.initDialogPage(templateId)
      // 初始化完成后，强制调用一次历史接口
      if (this.data.tag) {
        await this.loadHistoryOnInit()
      }
    } finally {
      this.setData({ initInProgress: false })
    }
  },

  /**
   * 初始化时加载历史记录（强制调用，不检查 historyHasMore）
   */
  async loadHistoryOnInit() {
    const { tag, nextCursor, isLoadingHistory } = this.data

    if (!tag || isLoadingHistory) return

    this.setData({ isLoadingHistory: true })

    try {
      const res = await aiService.loadHistory({
        tag,
        cursor: nextCursor,
        size: 20
      })

      if (res.success && res.data) {
        const { messages: historyMessages, hasMore, nextCursor: newCursor } = res.data

        if (historyMessages && historyMessages.length > 0) {
          const newMessages = historyMessages.map(msg => {
            const content = msg.content
            return {
              id: `history_${msg.messageId}`,
              messageId: msg.messageId,
              sessionId: msg.sessionId,
              role: this.normalizeRole(msg.role),
              content,
              htmlContent: parseMarkdown(content),
              timestamp: this.formatTime(msg.createdTime)
            }
          })

          // 加载更早的历史记录，插入到当前消息列表前面
          this.setData({
            messages: [...newMessages, ...this.data.messages],
            historyHasMore: hasMore || false,
            nextCursor: newCursor || ''
          })
        } else {
          // 没有历史消息，更新状态
          this.setData({
            historyHasMore: hasMore || false,
            nextCursor: newCursor || ''
          })
        }
      }
    } catch (err) {
      console.error('初始化加载历史记录失败:', err)
    } finally {
      this.setData({
        isLoadingHistory: false,
        historyLoaded: true
      })

      // 历史加载完成后滚动到底部
      this.scrollToBottom()
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }

    // 检查登录状态，未登录则跳转登录页
    if (!authService.isLoggedIn()) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }

    // 每次点击 TAB 都重新调初始化 + 历史接口
    if (!this.data.initInProgress) {
      this.resetDialogState()
      this.initDialogAndHistory(this.data.templateId || DEFAULT_TEMPLATE_ID)
    }

    // 每次显示页面时重新计算滚动区域高度
    setTimeout(() => {
      this.calculateScrollAreaHeight()
    }, 100)
  },

  /**
   * 初始化 AI 问答页面
   */
  async initDialogPage(templateId) {
    this.setData({ isLoading: true })

    try {
      const res = await aiService.initDialogPage(templateId)

      if (res.success && res.data) {
        const data = res.data
        const messages = []

        // 设置医生信息
        if (data.doctor) {
          this.setData({
            doctor: {
              name: data.doctor.name || '灵医生',
              avatar: data.doctor.avatar || this.data.doctor.avatar
            }
          })
        }

        // 处理预设消息
        if (data.presetMessages && data.presetMessages.length > 0) {
          data.presetMessages.forEach(msg => {
            const content = msg.content
            messages.push({
              id: `preset_${Date.now()}_${Math.random()}`,
              role: this.normalizeRole(msg.role),
              content,
              htmlContent: parseMarkdown(content),
              timestamp: ''
            })
          })
        }

        // 处理历史消息（API返回的是正序，从旧到新）
        if (data.history && data.history.length > 0) {
          data.history.forEach(msg => {
            const content = msg.content
            messages.push({
              id: `history_${msg.messageId}`,
              messageId: msg.messageId,
              sessionId: msg.sessionId,
              role: this.normalizeRole(msg.role),
              content,
              htmlContent: parseMarkdown(content),
              timestamp: this.formatTime(msg.createdTime)
            })
          })
        }

        // 如果没有消息，添加欢迎消息
        if (messages.length === 0) {
          const welcomeContent = data.description || '请问您有什么需要咨询的问题？'
          messages.push({
            id: `welcome_${Date.now()}`,
            role: 'ASSISTANT',
            content: welcomeContent,
            htmlContent: parseMarkdown(welcomeContent),
            timestamp: this.getCurrentTime()
          })
        }

        this.setData({
          messages,
          tag: data.tag || '',
          dialogTitle: data.title || '',
          dialogDescription: data.description || '',
          dialogTags: data.tags || [],
          historyHasMore: data.historyHasMore || false,
          nextCursor: data.nextCursor || '',
          initialized: true,
          isLoading: false,
          historyLoaded: false
        })

        // 初始化完成后滚动到底部
        this.scrollToBottom()
      } else {
        throw new Error(res.message || '初始化失败')
      }
    } catch (err) {
      console.error('初始化问询页面失败:', err)
      // 降级处理：显示默认消息
      const defaultContent = '请问您有什么需要咨询的健康问题？'
      this.setData({
        messages: [{
          id: `welcome_${Date.now()}`,
          role: 'ASSISTANT',
          content: defaultContent,
          htmlContent: parseMarkdown(defaultContent),
          timestamp: this.getCurrentTime()
        }],
        initialized: true,
        isLoading: false,
        historyLoaded: true
      })

      // 降级后也滚动到底部
      this.scrollToBottom()
    }
  },

  /**
   * 重置对话状态，保证每次 TAB 点击都会重新请求
   */
  resetDialogState() {
    this.setData({
      messages: [],
      inputValue: '',
      isSending: false,
      isLoading: true,
      isLoadingHistory: false,
      tag: '',
      dialogTitle: '',
      dialogDescription: '',
      dialogTags: [],
      healthProfile: {
        phone: '',
        fullName: '',
        age: null,
        gender: null,
        heightCm: null,
        weightKg: null,
        extra: ''
      },
      historyHasMore: false,
      nextCursor: '',
      initialized: false,
      historyLoaded: false
    })
  },

  /**
   * 加载更多历史记录
   */
  async loadMoreHistory() {
    const { tag, nextCursor, isLoadingHistory, historyHasMore } = this.data

    if (isLoadingHistory || !historyHasMore || !tag) return

    this.setData({ isLoadingHistory: true })

    try {
      const res = await aiService.loadHistory({
        tag,
        cursor: nextCursor,
        size: 20
      })

      if (res.success && res.data) {
        const { messages: historyMessages, hasMore, nextCursor: newCursor } = res.data

        if (historyMessages && historyMessages.length > 0) {
          const newMessages = historyMessages.map(msg => {
            const content = msg.content
            return {
              id: `history_${msg.messageId}`,
              messageId: msg.messageId,
              sessionId: msg.sessionId,
              role: this.normalizeRole(msg.role),
              content,
              htmlContent: parseMarkdown(content),
              timestamp: this.formatTime(msg.createdTime)
            }
          })

          // 加载更早的历史记录，插入到当前消息列表前面
          this.setData({
            messages: [...newMessages, ...this.data.messages],
            historyHasMore: hasMore,
            nextCursor: newCursor
          })
        }
      }
    } catch (err) {
      console.error('加载历史记录失败:', err)
      wx.showToast({ title: '加载历史失败', icon: 'none' })
    } finally {
      this.setData({ isLoadingHistory: false })
    }
  },

  /**
   * 添加消息
   */
  addMessage(msg) {
    const messages = this.data.messages
    const newMsg = {
      ...msg,
      id: `msg_${Date.now()}`,
      timestamp: msg.timestamp || this.getCurrentTime(),
      // 解析 markdown 内容
      htmlContent: parseMarkdown(msg.content)
    }
    messages.push(newMsg)
    // 自动滚动到最新消息
    this.setData({
      messages,
      scrollToView: newMsg.id
    })
  },

  /**
   * 滚动到底部（显示最新消息）
   */
  scrollToBottom() {
    // 先清空再设置，确保触发滚动
    this.setData({ scrollToView: '' }, () => {
      setTimeout(() => {
        this.setData({ scrollToView: 'scroll-bottom' })
      }, 150)
    })
  },

  /**
   * 滚动到顶部时加载更多历史
   */
  onScrollToUpper() {
    this.loadMoreHistory()
  },

  /**
   * 点击快捷问题
   */
  onQuickQuestion(e) {
    const { question } = e.currentTarget.dataset
    this.setData({ inputValue: question })
    this.onSend()
  },

  /**
   * 输入框内容变化
   */
  onInputChange(e) {
    this.setData({
      inputValue: e.detail.value
    })
  },

  /**
   * 发送消息
   */
  async onSend() {
    const { inputValue, isSending, templateId, tag, messages } = this.data

    if (!inputValue.trim() || isSending) return

    const question = inputValue.trim()

    // 添加用户消息
    this.addMessage({
      role: 'USER',
      content: question
    })

    // 清空输入框并设置发送状态
    this.setData({
      inputValue: '',
      isSending: true
    })

    try {
      // 构建历史上下文（最近10条对话）
      const history = messages
        .filter(m => m.role === 'USER' || m.role === 'ASSISTANT')
        .slice(-10)
        .map(m => ({
          role: m.role === 'USER' ? 'user' : 'ai',
          content: m.content
        }))

      // 调用 AI 接口
      const res = await aiService.sendMessage({
        question,
        history,
        templateId: templateId || undefined,
        tag: tag || undefined
      })

      if (res.success && res.data) {
        this.addMessage({
          role: 'ASSISTANT',
          content: res.data.reply,
          sessionId: res.data.sessionId
        })
      } else {
        throw new Error(res.message || 'AI 回复失败')
      }
    } catch (err) {
      console.error('发送消息失败:', err)
      this.addMessage({
        role: 'ASSISTANT',
        content: '抱歉，网络出现问题，请稍后再试。'
      })
    } finally {
      this.setData({ isSending: false })
    }
  },

  /**
   * 点击 AI 问询卡片
   */
  onAIInquiryTap() {
    navigateToH5('inquiry-chat', {})
  },

  /**
   * 点击健康助理卡片
   */
  onHealthAssistantTap() {
    wx.showToast({ title: 'VIP功能开发中', icon: 'none' })
  },

  /**
   * 点击健康档案
   */
  onHealthProfileTap() {
    wx.showToast({ title: '健康档案功能开发中', icon: 'none' })
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadMoreHistory().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 标准化消息角色
   */
  normalizeRole(role) {
    if (!role) return 'ASSISTANT'
    const upperRole = role.toUpperCase()
    if (upperRole === 'USER') return 'USER'
    if (upperRole === 'AI' || upperRole === 'ASSISTANT') return 'ASSISTANT'
    if (upperRole === 'SYSTEM') return 'ASSISTANT'
    return 'ASSISTANT'
  },

  /**
   * 格式化时间
   */
  formatTime(timeStr) {
    if (!timeStr) return ''
    try {
      const date = new Date(timeStr)
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  },

  /**
   * 获取当前时间
   */
  getCurrentTime() {
    return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
})
