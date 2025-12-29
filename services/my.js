// services/my.js
const { get, post } = require('./request')

/**
 * 获取当前用户信息
 * 返回用户基础资料、会员状态以及常用入口的角标数
 * GET /api/me
 * @returns {Promise} 包含 userId, nickname, avatar, phone, gender, stats, membership, entries
 */
const getProfile = () => get('/api/me')

/**
 * 获取我的权益页面数据
 * 返回头像/昵称/会员到期时间，以及固定三档商品卡片（产品ID：1=月卡、2=年卡、3=季卡）
 * GET /api/me/benefits
 * @returns {Promise} 包含 profile, membership, products
 */
const getBenefits = () => get('/api/me/benefits')

/**
 * 获取健康档案
 * 返回健康档案页所需字段（姓名/年龄/性别/身高/体重/其他）
 * GET /api/me/health-profile
 * @returns {Promise} 包含 phone, fullName, age, gender, heightCm, weightKg, extra
 */
const getHealthProfile = () => get('/api/me/health-profile')

/**
 * 保存/编辑健康档案
 * 覆盖 UI 中"姓名/年龄/性别/身高/体重/其他"字段
 * POST /api/me/health-profile
 * @param {Object} data 档案数据
 * @param {string} data.phone 手机号
 * @param {string} data.fullName 姓名
 * @param {number} data.age 年龄
 * @param {number} data.gender 性别 (0=女, 1=男)
 * @param {number} data.heightCm 身高(厘米)
 * @param {number} data.weightKg 体重(千克)
 * @param {string} data.extra 其他备注
 * @returns {Promise} 返回更新后的健康档案
 */
const saveHealthProfile = (data = {}) => post('/api/me/health-profile', data)

/**
 * 获取会员权益状态
 * GET /api/membership/status
 * @returns {Promise} 会员状态详情
 */
const getMembershipStatus = () => get('/api/membership/status')

module.exports = {
  getProfile,
  getBenefits,
  getHealthProfile,
  saveHealthProfile,
  getMembershipStatus
}
