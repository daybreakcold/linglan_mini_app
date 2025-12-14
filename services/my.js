// services/my.js
const { get, post } = require('./request')

/**
 * 获取当前用户信息
 * GET /api/me
 */
const getProfile = () => get('/api/me')

/**
 * 获取健康档案
 * GET /api/me/health-profile
 */
const getHealthProfile = () => get('/api/me/health-profile')

/**
 * 保存健康档案
 * POST /api/me/health-profile
 * @param {Object} data 档案数据
 */
const saveHealthProfile = (data = {}) => post('/api/me/health-profile', data)

/**
 * 获取会员权益状态
 * GET /api/membership/status
 */
const getMembershipStatus = () => get('/api/membership/status')

module.exports = {
  getProfile,
  getHealthProfile,
  saveHealthProfile,
  getMembershipStatus
}
