/**
 * 内容服务 - 文章相关 API
 */

import { get, post, del } from './request'

/**
 * 获取文章列表
 * @param {Object} params - { page, size, tag, keyword }
 */
export const getArticles = (params = {}) => {
  return get('/api/articles', {
    page: params.page || 1,
    size: params.size || 10,
    tag: params.tag || '',
    keyword: params.keyword || ''
  })
}

/**
 * 获取文章详情
 * @param {string|number} id - 文章 ID
 */
export const getArticleDetail = (id) => {
  return get(`/api/articles/${id}`)
}

/**
 * 获取文章评论列表
 * @param {string|number} articleId - 文章 ID
 * @param {Object} params - { page, size }
 */
export const getArticleComments = (articleId, params = {}) => {
  return get(`/api/articles/${articleId}/comments`, {
    page: params.page || 1,
    size: params.size || 10
  })
}

/**
 * 发表评论
 * @param {string|number} articleId - 文章 ID
 * @param {string} content - 评论内容
 */
export const postComment = (articleId, content) => {
  return post(`/api/articles/${articleId}/comments`, { content })
}

/**
 * 点赞文章
 * @param {string|number} articleId - 文章 ID
 */
export const likeArticle = (articleId) => {
  return post(`/api/articles/${articleId}/likes`)
}

/**
 * 取消点赞
 * @param {string|number} articleId - 文章 ID
 */
export const unlikeArticle = (articleId) => {
  return del(`/api/articles/${articleId}/likes`)
}

/**
 * 收藏文章
 * @param {string|number} articleId - 文章 ID
 */
export const favoriteArticle = (articleId) => {
  return post(`/api/articles/${articleId}/favorites`)
}

/**
 * 取消收藏
 * @param {string|number} articleId - 文章 ID
 */
export const unfavoriteArticle = (articleId) => {
  return del(`/api/articles/${articleId}/favorites`)
}

export default {
  getArticles,
  getArticleDetail,
  getArticleComments,
  postComment,
  likeArticle,
  unlikeArticle,
  favoriteArticle,
  unfavoriteArticle
}
