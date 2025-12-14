/**
 * 首页模块服务
 * 处理首页相关的 API 调用
 */

const { get } = require('./request')

/**
 * 获取首页高亮卡片数据
 * 渲染首页顶部"养生课/正在学习/正在提问"等高亮卡片
 * @returns {Promise<{success: boolean, data: Array<{name: string, type: string, courseSectionId: number|null}>}>}
 */
const getHighlights = () => {
  return get('/api/home/highlights')
}

/**
 * 获取首页课程标签数据
 * 在首页"热门课程"区块展示若干一级标签及其代表课程
 * @returns {Promise<{success: boolean, data: Array<{tagName: string, courses: Array}>}>}
 */
const getCourseTags = () => {
  return get('/api/home/course-tags')
}

/**
 * 获取首页场景对话数据
 * 为首页"场景对话"组件提供推荐标签、虚拟医生以及预设问答
 * @returns {Promise<{success: boolean, data: Array<{tag: string, templateId: number, title: string, description: string, doctor: Object, messages: Array}>}>}
 */
const getDialogScenarios = () => {
  return get('/api/home/dialog-scenarios')
}

/**
 * 获取企业微信获客助手配置
 * @returns {Promise<{success: boolean, data: {enabled: boolean, url: string}}>}
 */
const getLeadAssistant = () => {
  return get('/api/home/lead-assistant')
}

/**
 * 获取首页所有数据（并行请求）
 * @returns {Promise<{highlights: Array, courseTags: Array, dialogScenarios: Array}>}
 */
const getHomeData = async () => {
  try {
    const [highlightsRes, courseTagsRes, dialogScenariosRes] = await Promise.all([
      getHighlights().catch(err => ({ success: false, data: [] })),
      getCourseTags().catch(err => ({ success: false, data: [] })),
      getDialogScenarios().catch(err => ({ success: false, data: [] }))
    ])

    return {
      highlights: highlightsRes.success ? highlightsRes.data : [],
      courseTags: courseTagsRes.success ? courseTagsRes.data : [],
      dialogScenarios: dialogScenariosRes.success ? dialogScenariosRes.data : []
    }
  } catch (err) {
    console.error('获取首页数据失败:', err)
    return {
      highlights: [],
      courseTags: [],
      dialogScenarios: []
    }
  }
}

module.exports = {
  getHighlights,
  getCourseTags,
  getDialogScenarios,
  getLeadAssistant,
  getHomeData
}

