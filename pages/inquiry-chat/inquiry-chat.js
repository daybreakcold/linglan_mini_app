// pages/inquiry-chat/inquiry-chat.js
const aiService = require('../../services/ai')
const authService = require('../../services/auth')
const { parseMarkdown } = require('../../utils/markdown')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 消息列表
    messages: [],
    // 输入框内容
    inputValue: '',
    // 是否正在发送
    isSending: false,
    // 是否正在加载历史
    isLoadingHistory: false,
    // 滚动到底部的id
    scrollToView: '',
    // 医生信息
    doctor: {
      name: '灵医生',
      avatar: '/images/icons/avatar-doctor.svg'
    },
    // 快捷问题
    quickQuestions: [
      '孩子最近咳嗽怎么办？',
      '如何调理脾胃虚弱？',
      '秋冬季节如何养生？',
      '失眠多梦怎么调理？'
    ],
    // 场景模板ID
    templateId: null,
    // 场景标签
    tag: '',
    // 场景标题
    scenarioTitle: '',
    // 场景描述
    description: '',
    // 预设消息
    presetMessages: [],
    // 历史记录是否还有更多
    historyHasMore: false,
    // 历史记录游标
    nextCursor: null,
    // 页面是否已初始化
    initialized: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 检查登录状态，未登录则跳转登录页
    if (!authService.isLoggedIn()) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }

    const { templateId, title } = options

    if (templateId) {
      this.setData({
        templateId: Number(templateId),
        scenarioTitle: title ? decodeURIComponent(title) : ''
      })

      // 设置导航栏标题
      if (title) {
        wx.setNavigationBarTitle({
          title: decodeURIComponent(title)
        })
      }

      // 调用 API 初始化页面
      this.initDialogPage(Number(templateId))
    } else {
      // 无模板ID时显示默认欢迎消息
      this.addMessage({
        role: 'ASSISTANT',
        content: '您好！我是灵壹健康的AI健康助手，很高兴为您提供健康咨询服务。请问您有什么健康问题需要咨询？'
      })
      this.setData({ initialized: true })
    }
  },

  /**
   * 初始化 AI 问答页面
   */
  async initDialogPage(templateId) {
    wx.showLoading({ title: '加载中...' })

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
              avatar: data.doctor.avatar || '/images/icons/avatar-doctor.svg'
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

        // 处理历史消息
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

        // 如果没有预设消息和历史，添加欢迎消息
        if (messages.length === 0) {
          const welcomeContent = `您好！我是${data.doctor?.name || '灵医生'}。${data.description || '请问有什么可以帮助您的？'}`
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
          description: data.description || '',
          presetMessages: data.presetMessages || [],
          historyHasMore: data.historyHasMore || false,
          nextCursor: data.nextCursor || null,
          initialized: true,
          scrollToView: messages.length > 0 ? messages[messages.length - 1].id : ''
        })
      } else {
        throw new Error(res.message || '初始化失败')
      }
    } catch (err) {
      console.error('初始化 AI 对话页面失败:', err)
      // 降级处理：显示默认欢迎消息
      this.addMessage({
        role: 'ASSISTANT',
        content: '您好！我是灵壹健康的AI健康助手，很高兴为您提供健康咨询服务。请问您有什么健康问题需要咨询？'
      })
      this.setData({ initialized: true })
    } finally {
      wx.hideLoading()
    }
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
          // 历史消息插入到列表前面
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
   * 生命周期函数--监听页面显示
   */
  onShow() {

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
      htmlContent: parseMarkdown(msg.content)
    }
    messages.push(newMsg)

    this.setData({
      messages,
      scrollToView: newMsg.id
    })
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
   * 点击快捷问题
   */
  onQuickQuestion(e) {
    const { question } = e.currentTarget.dataset
    this.setData({ inputValue: question })
    this.onSend()
  },

  /**
   * 滚动到顶部时加载更多历史
   */
  onScrollToUpper() {
    this.loadMoreHistory()
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
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    const { templateId, scenarioTitle } = this.data
    return {
      title: scenarioTitle || '灵壹健康 - AI健康咨询',
      path: templateId
        ? `/pages/inquiry-chat/inquiry-chat?templateId=${templateId}&title=${encodeURIComponent(scenarioTitle)}`
        : '/pages/inquiry-chat/inquiry-chat'
    }
  }
})
