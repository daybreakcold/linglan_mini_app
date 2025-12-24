// pages/course-detail/course-detail.js
const courseService = require('../../services/course')
const { navigateToH5 } = require('../../utils/h5Navigation')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 课程详情
    course: null,
    // 加载状态
    isLoading: true,
    // 报名状态
    enrollment: null,
    // 是否已报名
    isEnrolled: false,
    // 当前播放的视频
    currentVideo: null,
    // 是否显示视频播放器
    showVideo: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const { courseId, sectionId } = options

    if (courseId) {
      this.loadCourseDetail(courseId, sectionId)
    } else if (sectionId) {
      // 仅有 sectionId 时，通过章节ID获取课程
      this.loadCourseBySection(sectionId)
    } else {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      })
      this.setData({ isLoading: false })
    }
  },

  /**
   * 加载课程详情
   */
  async loadCourseDetail(courseId, targetSectionId) {
    this.setData({ isLoading: true })

    try {
      const res = await courseService.getCourseDetail(courseId)

      if (res.success && res.data) {
        const course = this.transformCourseData(res.data)

        this.setData({
          course,
          isLoading: false
        })

        // 设置页面标题
        wx.setNavigationBarTitle({
          title: '灵壹健康好课'
        })

        // 加载报名状态
        this.loadEnrollmentStatus(courseId)
      } else {
        throw new Error(res.message || '加载失败')
      }
    } catch (err) {
      console.error('加载课程详情失败:', err)
      this.setData({ isLoading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  /**
   * 通过章节ID加载课程详情
   */
  async loadCourseBySection(sectionId) {
    this.setData({ isLoading: true })

    try {
      const res = await courseService.getCourseBySection(sectionId)

      if (res.success && res.data) {
        const course = this.transformCourseData(res.data)

        this.setData({
          course,
          isLoading: false
        })

        // 设置页面标题
        wx.setNavigationBarTitle({
          title: '灵壹健康好课'
        })

        // 加载报名状态
        if (course.id) {
          this.loadEnrollmentStatus(course.id)
        }
      } else {
        throw new Error(res.message || '加载失败')
      }
    } catch (err) {
      console.error('通过章节ID加载课程失败:', err)
      this.setData({ isLoading: false })
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  /**
   * 转换课程数据，映射API字段到页面展示
   */
  transformCourseData(data) {
    const course = { ...data }

    // 转换总时长：分钟 -> 小时（保留1位小数，去掉末尾0）
    if (course.totalDuration) {
      const hours = course.totalDuration / 60
      course.totalDurationText = hours >= 1
        ? (hours % 1 === 0 ? hours.toString() : hours.toFixed(1).replace(/\.0$/, ''))
        : (course.totalDuration + '分钟')
    } else {
      course.totalDurationText = '20+'
    }

    // 统计视频和文章数量
    let videoCount = 0
    let articleCount = 0

    // 处理章节数据
    if (course.sections) {
      course.sections = course.sections.map((section, index) => {
        // 获取时长（优先使用视频秒数，其次使用 duration 分钟）
        let durationText = ''

        if (section.contentType === 'VIDEO') {
          videoCount++
          if (section.video && section.video.durationSeconds) {
            durationText = this.formatDuration(section.video.durationSeconds)
          } else if (section.duration) {
            durationText = this.formatDuration(section.duration * 60)
          }
        } else if (section.contentType === 'ARTICLE') {
          articleCount++
          // 文章类型使用 duration 字段（分钟）
          if (section.duration) {
            durationText = section.duration + '分钟'
          }
        } else if (section.duration) {
          durationText = this.formatDuration(section.duration * 60)
        }

        return {
          ...section,
          // 可用状态：preview 为 true 表示可预览/可用
          available: section.preview === true,
          // 序号
          seq: section.seq || index + 1,
          // 格式化后的时长文本
          durationText: durationText,
          // 内容类型标识
          isVideo: section.contentType === 'VIDEO',
          isArticle: section.contentType === 'ARTICLE'
        }
      })
    }

    // 添加统计信息
    course.videoCount = videoCount
    course.articleCount = articleCount
    course.sectionCount = (course.sections || []).length

    // 判断第一个可用章节是否为视频类型（用于控制封面播放按钮显示）
    const firstAvailableSection = (course.sections || []).find(s => s.available)
    course.firstSectionIsVideo = firstAvailableSection ? firstAvailableSection.isVideo : false

    return course
  },

  /**
   * 格式化时长（秒 -> 分'秒"）
   */
  formatDuration(seconds) {
    if (!seconds || seconds <= 0) return ''
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (secs === 0) {
      return `${mins}'00"`
    }
    return `${mins}'${secs.toString().padStart(2, '0')}"`
  },

  /**
   * 加载报名状态
   */
  async loadEnrollmentStatus(courseId) {
    try {
      const res = await courseService.getEnrollmentStatus(courseId)
      if (res.success && res.data) {
        this.setData({
          enrollment: res.data,
          isEnrolled: res.data.enrolled
        })
      }
    } catch (err) {
      console.error('加载报名状态失败:', err)
    }
  },

  /**
   * 播放视频
   */
  onPlayVideo() {
    const { course } = this.data
    if (course && course.sections && course.sections.length > 0) {
      const firstSection = course.sections[0]
      if (firstSection.available) {
        this.playSection(firstSection)
      } else {
        wx.showToast({
          title: '课程开发中，敬请期待',
          icon: 'none'
        })
      }
    }
  },

  /**
   * 点击章节
   */
  onSectionTap(e) {
    const { section } = e.currentTarget.dataset

    if (!section.available) {
      wx.showToast({
        title: '课程开发中，敬请期待',
        icon: 'none'
      })
      return
    }

    this.playSection(section)
  },

  /**
   * 播放章节
   */
  playSection(section) {
    if (section.contentType === 'VIDEO' && section.video && section.video.videoUrl) {
      // 播放视频
      this.setData({
        currentVideo: section.video,
        showVideo: true
      })
    } else if (section.contentType === 'ARTICLE' && section.article) {
      // 跳转到文章详情
      navigateToH5('article-detail', { id: section.article.id })
    }
  },

  /**
   * 视频播放结束
   */
  onVideoEnded() {
    // 可以在这里处理视频播放结束逻辑
  },

  /**
   * 视频播放错误
   */
  onVideoError(e) {
    console.error('视频播放错误:', e.detail)
    wx.showToast({
      title: '视频播放失败',
      icon: 'none'
    })
  },

  /**
   * 报名课程
   */
  async onEnroll() {
    const { course, isEnrolled } = this.data

    if (isEnrolled) {
      wx.showToast({
        title: '已报名',
        icon: 'success'
      })
      return
    }

    try {
      const res = await courseService.enrollCourse(course.id)
      if (res.success) {
        this.setData({
          enrollment: res.data,
          isEnrolled: true
        })
        wx.showToast({
          title: '报名成功',
          icon: 'success'
        })
      } else {
        throw new Error(res.message || '报名失败')
      }
    } catch (err) {
      console.error('报名失败:', err)
      wx.showToast({
        title: err.message || '报名失败',
        icon: 'none'
      })
    }
  },

  /**
   * 分享
   */
  onShareAppMessage() {
    const { course } = this.data
    return {
      title: course ? course.title : '灵壹健康课程',
      path: `/pages/course-detail/course-detail?courseId=${course ? course.id : ''}`
    }
  }
})
