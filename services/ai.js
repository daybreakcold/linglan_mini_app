/**
 * AI 对话服务模块
 * 处理 AI 问答相关 API
 */

const { get, post } = require('./request')

/**
 * 初始化 AI 问答页面
 * @param {number} templateId 模板 ID
 * @param {number} historySize 首屏加载的历史条数，默认 20，最大 50
 * @returns {Promise}
 */
const initDialogPage = (templateId, historySize = 20) => {
  return get('/api/ai/dialogs/initial', { templateId, historySize })
}

/**
 * 加载历史记录（向上滚动加载更多）
 * @param {Object} params 参数
 * @param {string} params.tag 场景标签
 * @param {number} params.cursor 上一次返回的 nextCursor
 * @param {number} params.size 每页条数，默认 20，最大 50
 * @returns {Promise}
 */
const loadHistory = (params = {}) => {
  const { tag, cursor, size = 20 } = params
  return get('/api/ai/dialogs/history', { tag, cursor, size })
}

/**
 * 发送 AI 问答消息
 * @param {Object} data 请求数据
 * @param {string} data.question 当前输入的问题
 * @param {Array} data.history 前端保留的上下文列表 [{role, content}]
 * @param {number} data.templateId 当前页面使用的模板 ID
 * @param {string} data.tag 当前场景标签
 * @param {number} data.temperature 模型随机度，默认 0.7
 * @returns {Promise}
 */
const sendMessage = (data) => {
  return post('/api/consult/ai/messages', data)
}

module.exports = {
  initDialogPage,
  loadHistory,
  sendMessage
}
