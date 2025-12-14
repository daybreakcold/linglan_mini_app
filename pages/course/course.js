// pages/course/course.js
/**
 * 健康科普文章列表页（原课堂页）
 * 接口：GET /api/articles
 * 响应字段：id, title, summary, coverUrl, tag, publishAt, viewCount, likeCount
 */
const contentService = require('../../services/content')

// 标签配置
const TAGS = [
  { key: '', name: '健康' },
  { key: 'tag', name: '#标签' },
  { key: 'vision', name: '视力' },
  { key: 'baby', name: '母婴' },
  { key: 'sleep', name: '睡眠' }
]

Page({
  data: {
    // 标签列表
    tags: TAGS,
    // 当前选中的标签索引
    currentTagIndex: 0, // 默认选中第一个标签"健康"
    // 文章列表
    articles: [],
    // 分页信息
    page: 1,
    size: 10,
    hasNext: true,
    total: 0,
    // 加载状态
    isLoading: false,
    isLoadingMore: false
  },

  onLoad(options) {
    // 如果从其他页面传入标签参数
    if (options.tag) {
      const tagIndex = TAGS.findIndex(t => t.key === options.tag)
      if (tagIndex !== -1) {
        this.setData({ currentTagIndex: tagIndex })
      }
    }
    this.loadArticles()
  },

  onShow() {
    // 二级页面，无需设置 tabBar
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({ page: 1, hasNext: true })
    this.loadArticles().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 上拉加载更多
   */
  onReachBottom() {
    if (this.data.hasNext && !this.data.isLoadingMore) {
      this.loadMoreArticles()
    }
  },

  /**
   * 加载文章列表
   * 接口响应：{ items, total, page, size, hasNext }
   * item 字段：id, title, summary, coverUrl, tag, publishAt, viewCount, likeCount
   */
  async loadArticles() {
    if (this.data.isLoading) return

    this.setData({ isLoading: true })

    try {
      const { tags, currentTagIndex } = this.data
      const currentTag = tags[currentTagIndex]

      console.log('加载文章列表，标签:', currentTag.key || '全部')

      const res = await contentService.getArticles({
        page: 1,
        size: this.data.size,
        tag: currentTag.key
      })

      console.log('文章列表响应:', res)

      if (res.success && res.data) {
        const { items, total, hasNext } = res.data

        // 处理文章数据
        const articles = (items || []).map(item => ({
          id: item.id,
          title: item.title || '',
          summary: item.summary || '',
          coverUrl: item.coverUrl || '',
          tag: item.tag || '',
          publishAt: item.publishAt || '',
          viewCount: item.viewCount || 0,
          likeCount: item.likeCount || 0,
          // 作者头像（接口暂无此字段，使用默认值）
          authorAvatar: item.authorAvatar || ''
        }))

        this.setData({
          articles,
          page: 1,
          total: total || 0,
          hasNext: hasNext !== false,
          isLoading: false
        })

        console.log('加载成功，文章数量:', articles.length)
      } else {
        throw new Error(res.message || '获取文章列表失败')
      }
    } catch (err) {
      console.error('加载文章列表失败:', err)
      this.setData({ isLoading: false, articles: [] })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  },

  /**
   * 加载更多文章
   */
  async loadMoreArticles() {
    if (this.data.isLoadingMore || !this.data.hasNext) return

    this.setData({ isLoadingMore: true })

    try {
      const { tags, currentTagIndex, page, size } = this.data
      const currentTag = tags[currentTagIndex]
      const nextPage = page + 1

      console.log('加载更多，页码:', nextPage)

      const res = await contentService.getArticles({
        page: nextPage,
        size,
        tag: currentTag.key
      })

      if (res.success && res.data) {
        const { items, hasNext } = res.data

        // 处理新文章数据
        const newArticles = (items || []).map(item => ({
          id: item.id,
          title: item.title || '',
          summary: item.summary || '',
          coverUrl: item.coverUrl || '',
          tag: item.tag || '',
          publishAt: item.publishAt || '',
          viewCount: item.viewCount || 0,
          likeCount: item.likeCount || 0,
          authorAvatar: item.authorAvatar || ''
        }))

        this.setData({
          articles: [...this.data.articles, ...newArticles],
          page: nextPage,
          hasNext: hasNext !== false,
          isLoadingMore: false
        })

        console.log('加载更多成功，新增:', newArticles.length)
      } else {
        throw new Error(res.message || '加载更多失败')
      }
    } catch (err) {
      console.error('加载更多失败:', err)
      this.setData({ isLoadingMore: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  },

  /**
   * 返回上一页
   */
  onBack() {
    wx.navigateBack()
  },

  /**
   * 搜索
   */
  onSearch() {
    wx.showToast({ title: '搜索功能开发中', icon: 'none' })
  },

  /**
   * 更多操作
   */
  onMore() {
    wx.showActionSheet({
      itemList: ['分享', '收藏全部'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.showToast({ title: '分享功能开发中', icon: 'none' })
        } else if (res.tapIndex === 1) {
          wx.showToast({ title: '收藏功能开发中', icon: 'none' })
        }
      }
    })
  },

  /**
   * 切换标签
   */
  onTagTap(e) {
    const { index } = e.currentTarget.dataset
    if (index === this.data.currentTagIndex) return

    this.setData({
      currentTagIndex: index,
      page: 1,
      hasNext: true,
      articles: []
    })

    this.loadArticles()
  },

  /**
   * 展开更多标签
   */
  onExpandTags() {
    wx.showToast({ title: '更多标签开发中', icon: 'none' })
  },

  /**
   * 点击文章卡片 - 跳转详情页
   * 详情接口：GET /api/articles/{articleId}
   */
  onArticleTap(e) {
    const { id } = e.currentTarget.dataset
    console.log('点击文章:', id)
    wx.navigateTo({
      url: `/pages/article-detail/article-detail?id=${id}`
    })
  },

  /**
   * 点赞文章
   * 接口：POST /api/articles/{articleId}/likes
   */
  async onLikeTap(e) {
    const { id, index } = e.currentTarget.dataset
    console.log('点赞文章:', id)

    try {
      const res = await contentService.likeArticle(id)
      if (res.success) {
        // 更新本地点赞数
        const articles = [...this.data.articles]
        articles[index].likeCount = (articles[index].likeCount || 0) + 1
        this.setData({ articles })
        wx.showToast({ title: '点赞成功', icon: 'success' })
      }
    } catch (err) {
      console.error('点赞失败:', err)
      wx.showToast({ title: '点赞失败', icon: 'none' })
    }
  },

  /**
   * 收藏文章
   * 接口：POST /api/articles/{articleId}/favorites
   */
  async onFavoriteTap(e) {
    const { id } = e.currentTarget.dataset
    console.log('收藏文章:', id)

    try {
      const res = await contentService.favoriteArticle(id)
      if (res.success) {
        wx.showToast({ title: '收藏成功', icon: 'success' })
      }
    } catch (err) {
      console.error('收藏失败:', err)
      wx.showToast({ title: '收藏失败', icon: 'none' })
    }
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return {
      title: '健康科普 - 灵壹健康',
      path: '/pages/course/course'
    }
  }
})
