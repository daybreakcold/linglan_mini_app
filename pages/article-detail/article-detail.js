// pages/article-detail/article-detail.js
const contentService = require('../../services/content')

Page({
  data: {
    // 文章ID
    articleId: null,
    // 文章详情
    article: {},
    // 评论列表
    comments: [],
    // 相关文章
    relatedArticles: [],
    // 是否正在加载
    isLoading: true,
    // 是否已点赞
    isLiked: false,
    // 是否已收藏
    isFavorited: false,
    // 评论内容
    commentContent: '',
    // 字体大小
    fontSize: 26,
    // 评论分页
    commentPage: 1,
    commentHasMore: true
  },

  onLoad(options) {
    const articleId = options.id || options.articleId
    if (articleId) {
      this.setData({ articleId: Number(articleId) })
      this.loadArticleDetail(articleId)
    } else {
      wx.showToast({ title: '文章不存在', icon: 'none' })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  onShow() {
    const { articleId } = this.data
    if (articleId) {
      // 上报浏览次数
      contentService.viewsIncrement(articleId).catch(err => {
        console.error('上报浏览次数失败:', err)
      })
    }
  },

  /**
   * 加载文章详情
   */
  async loadArticleDetail(articleId) {
    this.setData({ isLoading: true })

    try {
      const res = await contentService.getArticleDetail(articleId)

      if (res.success && res.data) {
        const article = res.data
        // 直接使用原始时间戳格式化为简洁格式
        article.publishTime = this.formatTimestamp(article.publishAt || article.timestamp)

        this.setData({
          article,
          isLoading: false
        })

        // 加载评论
        this.loadComments()
      } else {
        throw new Error(res.message || '加载失败')
      }
    } catch (err) {
      console.error('加载文章详情失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ isLoading: false })
    }
  },

  /**
   * 加载评论列表
   */
  async loadComments() {
    const { articleId, commentPage } = this.data

    try {
      const res = await contentService.getArticleComments(articleId, {
        page: commentPage,
        size: 20
      })

      if (res.success && res.data) {
        const rawComments = res.data.items || res.data || []
        // 格式化评论时间
        const comments = rawComments.map(item => ({
          ...item,
          createTime: this.formatCommentTime(item.createTime || item.createdAt)
        }))
        this.setData({
          comments: commentPage === 1 ? comments : [...this.data.comments, ...comments],
          commentHasMore: res.data.hasNext || false
        })
      }
    } catch (err) {
      console.error('加载评论失败:', err)
    }
  },

  /**
   * 格式化评论时间
   */
  formatCommentTime(timeStr) {
    if (!timeStr) return ''
    try {
      const date = new Date(timeStr)
      const now = new Date()
      const diff = now - date
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (minutes < 1) return '刚刚'
      if (minutes < 60) return `${minutes}分钟前`
      if (hours < 24) return `${hours}小时前`
      if (days < 7) return `${days}天前`

      const month = date.getMonth() + 1
      const day = date.getDate()
      return `${month}月${day}日`
    } catch {
      return timeStr
    }
  },

  /**
   * 格式化时间戳为简洁格式 (YYYY-MM-DD HH:mm)
   */
  formatTimestamp(timeStr) {
    if (!timeStr) return ''
    try {
      const date = new Date(timeStr)
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}`
    } catch {
      return timeStr
    }
  },

  /**
   * 返回上一页
   */
  onBack() {
    wx.navigateBack()
  },

  /**
   * 切换点赞状态
   */
  async onToggleLike() {
    const { articleId, isLiked, article } = this.data

    try {
      if (isLiked) {
        await contentService.unlikeArticle(articleId)
        this.setData({
          isLiked: false,
          'article.likeCount': Math.max(0, (article.likeCount || 1) - 1)
        })
      } else {
        await contentService.likeArticle(articleId)
        this.setData({
          isLiked: true,
          'article.likeCount': (article.likeCount || 0) + 1
        })
      }
    } catch (err) {
      console.error('点赞操作失败:', err)
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  /**
   * 切换收藏状态
   */
  async onToggleFavorite() {
    const { articleId, isFavorited } = this.data

    try {
      if (isFavorited) {
        await contentService.unfavoriteArticle(articleId)
        this.setData({ isFavorited: false })
        wx.showToast({ title: '已取消收藏', icon: 'none' })
      } else {
        await contentService.favoriteArticle(articleId)
        this.setData({ isFavorited: true })
        wx.showToast({ title: '已收藏', icon: 'none' })
      }
    } catch (err) {
      console.error('收藏操作失败:', err)
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  },

  /**
   * 分享
   */
  onShare() {
    // 触发微信分享
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    const { article } = this.data
    return {
      title: article.title || '健康科普',
      path: `/pages/article-detail/article-detail?id=${this.data.articleId}`,
      imageUrl: article.coverUrl
    }
  },

  /**
   * 增大字体
   */
  onFontSizeIncrease() {
    const { fontSize } = this.data
    if (fontSize < 36) {
      this.setData({ fontSize: fontSize + 2 })
    }
  },

  /**
   * 减小字体
   */
  onFontSizeDecrease() {
    const { fontSize } = this.data
    if (fontSize > 22) {
      this.setData({ fontSize: fontSize - 2 })
    }
  },

  /**
   * 评论输入
   */
  onCommentInput(e) {
    this.setData({ commentContent: e.detail.value })
  },

  /**
   * 提交评论
   */
  async onSubmitComment() {
    const { articleId, commentContent } = this.data

    if (!commentContent.trim()) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' })
      return
    }

    try {
      const res = await contentService.postArticleComment(articleId, {
        content: commentContent.trim()
      })

      if (res.success) {
        wx.showToast({ title: '评论成功', icon: 'success' })
        this.setData({
          commentContent: '',
          commentPage: 1
        })
        // 重新加载评论
        this.loadComments()
      } else {
        throw new Error(res.message || '评论失败')
      }
    } catch (err) {
      console.error('发表评论失败:', err)
      wx.showToast({ title: '评论失败', icon: 'none' })
    }
  },

  /**
   * 点击相关文章
   */
  onArticleTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/article-detail/article-detail?id=${id}`
    })
  }
})
