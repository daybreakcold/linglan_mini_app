// pages/article-list/article-list.js
/**
 * 健康科普文章列表页
 * 支持标签筛选、关键字搜索、分页加载
 */
const contentService = require('../../services/content')

// 标签配置
const TAGS = [
  { key: '', name: '健康', active: false },
  { key: 'tag', name: '#标签', active: false },
  { key: 'vision', name: '视力', active: true },
  { key: 'baby', name: '母婴', active: false },
  { key: 'sleep', name: '睡眠', active: false }
]

Page({
  data: {
    // 标签列表
    tags: TAGS,
    // 当前选中的标签索引
    currentTagIndex: 2,
    // 文章列表
    articles: [],
    // 分页信息
    page: 1,
    size: 10,
    hasNext: true,
    total: 0,
    // 加载状态
    isLoading: false,
    isLoadingMore: false,
    // 搜索关键字
    keyword: ''
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
    // 非 tabBar 页面，无需设置 tabBar 选中状态
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
   */
  async loadArticles() {
    if (this.data.isLoading) return

    this.setData({ isLoading: true })

    try {
      const { tags, currentTagIndex, keyword } = this.data
      const currentTag = tags[currentTagIndex]

      const res = await contentService.getArticles({
        page: 1,
        size: this.data.size,
        tag: currentTag.key,
        keyword
      })

      if (res.success && res.data) {
        const { items, total, hasNext } = res.data
        this.setData({
          articles: items || [],
          page: 1,
          total,
          hasNext,
          isLoading: false
        })
      } else {
        throw new Error(res.message || '获取文章列表失败')
      }
    } catch (err) {
      console.error('加载文章列表失败:', err)
      this.setData({ isLoading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  /**
   * 加载更多文章
   */
  async loadMoreArticles() {
    if (this.data.isLoadingMore || !this.data.hasNext) return

    this.setData({ isLoadingMore: true })

    try {
      const { tags, currentTagIndex, keyword, page, size } = this.data
      const currentTag = tags[currentTagIndex]
      const nextPage = page + 1

      const res = await contentService.getArticles({
        page: nextPage,
        size,
        tag: currentTag.key,
        keyword
      })

      if (res.success && res.data) {
        const { items, hasNext } = res.data
        this.setData({
          articles: [...this.data.articles, ...(items || [])],
          page: nextPage,
          hasNext,
          isLoadingMore: false
        })
      } else {
        throw new Error(res.message || '加载更多失败')
      }
    } catch (err) {
      console.error('加载更多失败:', err)
      this.setData({ isLoadingMore: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
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

    // 更新标签选中状态
    const tags = this.data.tags.map((tag, i) => ({
      ...tag,
      active: i === index
    }))

    this.setData({
      tags,
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
   * 点击文章卡片
   */
  onArticleTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/article-detail/article-detail?id=${id}`
    })
  },

  /**
   * 点赞文章
   */
  async onLikeTap(e) {
    const { id, index } = e.currentTarget.dataset

    try {
      const res = await contentService.likeArticle(id)
      if (res.success) {
        // 更新本地点赞数
        const articles = [...this.data.articles]
        articles[index].likeCount = (articles[index].likeCount || 0) + 1
        this.setData({ articles })
      }
    } catch (err) {
      console.error('点赞失败:', err)
    }
  },

  /**
   * 收藏文章
   */
  async onFavoriteTap(e) {
    const { id, index } = e.currentTarget.dataset

    try {
      const res = await contentService.favoriteArticle(id)
      if (res.success) {
        wx.showToast({ title: '收藏成功', icon: 'success' })
      }
    } catch (err) {
      console.error('收藏失败:', err)
    }
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    return {
      title: '健康科普 - 灵壹健康',
      path: '/pages/article-list/article-list'
    }
  }
})
