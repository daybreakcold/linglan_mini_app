// pages/lesson/lesson.js
/**
 * 课程页面
 */
const courseService = require('../../services/course')
const contentService = require('../../services/content')
const { navigateToH5 } = require('../../utils/h5Navigation')

Page({
  data: {
    // 课程标签数据
    courseTags: [],
    // 当前选中的标签索引
    selectedTagIndex: 0,
    // 当前选中的二级标签索引（-1表示未选中）
    selectedSecondaryTagIndex: -1,
    // 二级标签展开/收起状态
    secondaryTagsExpanded: true,
    // 课程列表数据（热门课程）
    courseList: [],
    // 文章列表
    articleList: [],
    // 加载状态
    isLoading: true,
    // 默认封面图
    defaultCoverUrl: 'https://ide.code.fun/api/image?token=693067d49520a30011f76066&name=ea10a3bb3527a5c1cbbaad2f29e4b9ef.png'
  },

  onLoad(options) {
    this.loadCourseTags()
    this.loadCourseList()
    this.loadArticleList()
  },

  onShow() {
    // 设置 tabBar 选中状态（课程是第3个tab，索引为2）
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    Promise.all([
      this.loadCourseTags(),
      this.loadCourseList(),
      this.loadArticleList()
    ]).finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 搜索
   */
  onSearch() {
    wx.showToast({ title: '搜索功能开发中', icon: 'none' })
  },

  /**
   * 加载课程标签
   */
  async loadCourseTags() {
    this.setData({ isLoading: true })

    try {
      const res = await courseService.getCourseTags()

      if (res.success && res.data) {
        console.log('课程标签原始数据:', res.data)

        // 处理标签数据，过滤掉无效数据
        const processedTags = this.processCourseTags(res.data)
        console.log('课程标签处理后:', processedTags)

        this.setData({
          courseTags: processedTags,
          isLoading: false
        })
      } else {
        throw new Error(res.message || '加载失败')
      }
    } catch (err) {
      console.error('加载课程标签失败:', err)
      this.setData({ isLoading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  /**
   * 处理课程标签数据
   */
  processCourseTags(tags) {
    if (!tags || !Array.isArray(tags)) return []

    return tags
      .filter(tag => tag.primaryTag && tag.primaryName)
      .map(tag => {
        const validSecondaryTags = (tag.secondaryTags || [])
          .filter(subTag => subTag.code && subTag.name)
          .map(subTag => ({
            code: subTag.code,
            name: subTag.name,
            order: subTag.order || 0
          }))
          .sort((a, b) => a.order - b.order)

        return {
          primaryTag: tag.primaryTag,
          primaryName: tag.primaryName,
          primaryOrder: tag.primaryOrder || 0,
          secondaryTags: validSecondaryTags
        }
      })
      .sort((a, b) => a.primaryOrder - b.primaryOrder)
  },

  /**
   * 一级标签点击事件
   */
  onTagClick(e) {
    const { index } = e.currentTarget.dataset
    this.setData({
      selectedTagIndex: index,
      selectedSecondaryTagIndex: -1  // 切换一级标签时重置二级标签选中
    })
    this.loadCourseList()
  },

  /**
   * 二级标签点击事件
   */
  onSecondaryTagClick(e) {
    const { index } = e.currentTarget.dataset
    // 点击已选中的标签则取消选中
    const newIndex = this.data.selectedSecondaryTagIndex === index ? -1 : index
    this.setData({ selectedSecondaryTagIndex: newIndex })
    this.loadCourseList()
  },

  /**
   * 切换二级标签展开/收起
   */
  toggleSecondaryTags() {
    this.setData({
      secondaryTagsExpanded: !this.data.secondaryTagsExpanded
    })
  },

  /**
   * 加载课程列表（热门课程）
   */
  async loadCourseList() {
    try {
      const { courseTags, selectedTagIndex, selectedSecondaryTagIndex } = this.data
      const currentTag = courseTags[selectedTagIndex]
      const params = {}

      if (currentTag) {
        params.primaryTag = currentTag.primaryTag
        // 如果选中了二级标签，添加二级标签筛选
        if (selectedSecondaryTagIndex >= 0 && currentTag.secondaryTags[selectedSecondaryTagIndex]) {
          params.secondaryTag = currentTag.secondaryTags[selectedSecondaryTagIndex].code
        }
      }

      const res = await courseService.getCourseList(params)

      if (res.success && res.data) {
        console.log('课程列表数据:', res.data)
        this.setData({ courseList: res.data })
      } else {
        throw new Error(res.message || '加载失败')
      }
    } catch (err) {
      console.error('加载课程列表失败:', err)
      wx.showToast({
        title: '课程加载失败',
        icon: 'none'
      })
    }
  },

  /**
   * 加载文章列表
   */
  async loadArticleList() {
    try {
      const res = await contentService.getArticles({
        page: 1,
        size: 6
      })

      if (res.success && res.data) {
        console.log('文章列表数据:', res.data)
        const articles = (res.data.items || []).map(item => ({
          id: item.id,
          title: item.title || '',
          coverUrl: item.coverUrl || '',
          tag: item.tag || '',
          viewCount: item.viewCount || 0
        }))
        this.setData({ articleList: articles })
      } else {
        throw new Error(res.message || '加载失败')
      }
    } catch (err) {
      console.error('加载文章列表失败:', err)
    }
  },

  /**
   * 课程卡片点击事件
   */
  onCourseTap(e) {
    const { course } = e.currentTarget.dataset
    navigateToH5('course-detail', { courseId: course.id })
  },

  /**
   * 文章卡片点击事件
   */
  onArticleTap(e) {
    const { id } = e.currentTarget.dataset
    navigateToH5('article-detail', { id })
  },

  /**
   * 点击更多文章
   */
  onMoreArticles() {
    navigateToH5('course', {})
  }
})
