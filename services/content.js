/**
 * 内容服务模块
 * 处理文章、健康科普等内容相关 API
 */

const { get, post } = require('./request')

/**
 * 获取文章列表
 * @param {Object} params 查询参数
 * @param {number} params.page 页码，从 1 开始
 * @param {number} params.size 每页数量，最大 50
 * @param {string} params.tag 标签过滤
 * @param {string} params.keyword 关键字搜索
 * @returns {Promise}
 */
const getArticles = (params = {}) => {
  const { page = 1, size = 10, tag = '', keyword = '' } = params
  return get('/api/articles', { page, size, tag, keyword })
}

/**
 * 获取文章详情
 * @param {number} articleId 文章 ID
 * @returns {Promise}
 */
const getArticleDetail = (articleId) => {
  return get(`/api/articles/${articleId}`)
}

/**
 * 获取文章评论列表
 * @param {number} articleId 文章 ID
 * @param {Object} params 分页参数
 * @returns {Promise}
 */
const getArticleComments = (articleId, params = {}) => {
  const { page = 1, size = 20 } = params
  return get(`/api/articles/${articleId}/comments`, { page, size })
}

/**
 * 发布文章评论
 * @param {number} articleId 文章 ID
 * @param {Object} data 评论内容
 * @param {string} data.content 评论内容
 * @param {number} data.parentId 父评论 ID（回复时使用）
 * @returns {Promise}
 */
const postArticleComment = (articleId, data) => {
  return post(`/api/articles/${articleId}/comments`, data)
}

/**
 * 点赞文章
 * @param {number} articleId 文章 ID
 * @returns {Promise}
 */
const likeArticle = (articleId) => {
  return post(`/api/articles/${articleId}/likes`)
}

/**
 * 取消点赞文章
 * @param {number} articleId 文章 ID
 * @returns {Promise}
 */
const unlikeArticle = (articleId) => {
  return post(`/api/articles/${articleId}/likes/delete`)
}

/**
 * 收藏文章
 * @param {number} articleId 文章 ID
 * @returns {Promise}
 */
const favoriteArticle = (articleId) => {
  return post(`/api/articles/${articleId}/favorites`)
}

/**
 * 取消收藏文章
 * @param {number} articleId 文章 ID
 * @returns {Promise}
 */
const unfavoriteArticle = (articleId) => {
  return post(`/api/articles/${articleId}/favorites/delete`)
}

/**
 * 上报浏览 仅做 PV 统计，无需登录 文章的模块用户点击需要上报下  观看次数 
 * @param {number} articleId 文章 ID
 * @returns {Promise}
 */
const viewsIncrement = (articleId) => {
  return post(`/api/articles/${articleId}/views/increment`)
}

module.exports = {
  getArticles,
  getArticleDetail,
  getArticleComments,
  postArticleComment,
  likeArticle,
  unlikeArticle,
  favoriteArticle,
  unfavoriteArticle,
  viewsIncrement
}
