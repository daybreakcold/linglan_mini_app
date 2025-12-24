/**
 * H5 页面跳转工具
 * 将小程序页面跳转改为通过 webview 加载 H5 页面
 * 自动传递登录状态（token）到 H5
 */

const config = require('../config/index')

// H5 基础地址配置（开发环境使用本地地址）
const H5_BASE_URL = 'http://localhost:3001'

// 页面映射配置
const PAGE_MAPPING = {
  'article-detail': (params) => `/articles/${params.id || params.articleId}`,
  'course-detail': (params) => `/courses/${params.courseId}`,
  'course': () => '/courses',
  'inquiry-chat': (params) => params.templateId ? `/chat/${params.templateId}` : '/chat',
  'agreement': (params) => `/agreement/${params.type || 'user'}`
}

/**
 * 获取小程序登录凭证
 * @returns {object} - { token, refreshToken }
 */
function getAuthTokens() {
  const token = wx.getStorageSync(config.TOKEN_KEY) || ''
  const refreshToken = wx.getStorageSync(config.REFRESH_TOKEN_KEY) || ''
  return { token, refreshToken }
}

/**
 * 构建带认证参数的 H5 URL
 * @param {string} baseUrl - H5 页面基础 URL
 * @returns {string} - 带 token 参数的 URL
 */
function buildAuthUrl(baseUrl) {
  const { token, refreshToken } = getAuthTokens()

  // 如果没有 token，直接返回原 URL
  if (!token) {
    return baseUrl
  }

  // 小程序环境没有 URL API，使用字符串拼接
  const separator = baseUrl.includes('?') ? '&' : '?'
  let url = `${baseUrl}${separator}_token=${encodeURIComponent(token)}`

  if (refreshToken) {
    url += `&_refreshToken=${encodeURIComponent(refreshToken)}`
  }

  return url
}

/**
 * 跳转到 H5 页面
 * @param {string} pageName - 页面名称（如 'article-detail', 'course-detail' 等）
 * @param {object} params - 页面参数
 * @param {string} title - 页面标题（可选）
 * @returns {boolean} - 是否成功跳转
 */
function navigateToH5(pageName, params = {}, title = '') {
  const pathBuilder = PAGE_MAPPING[pageName]
  if (!pathBuilder) {
    console.warn(`[h5Navigation] No H5 mapping for page: ${pageName}`)
    return false
  }

  const h5Path = pathBuilder(params)
  const baseUrl = `${H5_BASE_URL}${h5Path}`

  // 构建带认证参数的 URL
  const url = buildAuthUrl(baseUrl)

  let webviewUrl = `/pages/webview/webview?url=${encodeURIComponent(url)}`
  if (title) {
    webviewUrl += `&title=${encodeURIComponent(title)}`
  }

  wx.navigateTo({ url: webviewUrl })
  return true
}

/**
 * 获取 H5 页面完整 URL
 * @param {string} pageName - 页面名称
 * @param {object} params - 页面参数
 * @returns {string|null} - H5 页面 URL 或 null
 */
function getH5Url(pageName, params = {}) {
  const pathBuilder = PAGE_MAPPING[pageName]
  if (!pathBuilder) {
    return null
  }
  return `${H5_BASE_URL}${pathBuilder(params)}`
}

module.exports = {
  navigateToH5,
  getH5Url,
  H5_BASE_URL
}
