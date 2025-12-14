/**
 * 认证服务模块
 * 处理登录、注册、验证码、Token 等认证相关逻辑
 */

const { get, post, setToken, setRefreshToken, clearTokens } = require('./request')
const config = require('../config/index')

/**
 * 发送验证码
 * @param {string} phone 手机号
 * @param {string} purpose 用途 LOGIN | BIND_PHONE
 * @returns {Promise}
 */
const sendOtp = (phone, purpose = config.OTP_PURPOSE.LOGIN) => {
  return post('/api/auth/otp', { phone, purpose })
}

/**
 * 校验验证码
 * @param {string} phone 手机号
 * @param {string} code 验证码
 * @param {string} purpose 用途
 * @returns {Promise}
 */
const verifyOtp = (phone, code, purpose = config.OTP_PURPOSE.LOGIN) => {
  return post('/api/auth/otp/verify', { phone, code, purpose })
}

/**
 * 微信登录（使用 unionId）
 * @param {Object} params 登录参数
 * @param {string} params.unionId 微信 unionId
 * @param {string} params.phone 手机号（可选）
 * @param {string} params.avatar 头像（可选）
 * @param {string} params.nickname 昵称（可选）
 * @returns {Promise}
 */
const loginWithWechat = async (params) => {
  const res = await post('/api/auth/login', {
    unionId: params.unionId,
    phone: params.phone || '',
    avatar: params.avatar || '',
    nickname: params.nickname || ''
  })

  if (res.success && res.data) {
    // 保存 Token
    setToken(res.data.token)
    setRefreshToken(res.data.refreshToken)

    // 先保存登录接口返回的基本信息
    wx.setStorageSync(config.USER_INFO_KEY, {
      userId: res.data.userId,
      phone: res.data.phone || '',
      avatar: res.data.avatar || '',
      nickname: ''
    })

    // 登录成功后，调用 /api/me 获取完整用户信息（包含 nickname）
    try {
      const profileRes = await get('/api/me')
      if (profileRes.success && profileRes.data) {
        wx.setStorageSync(config.USER_INFO_KEY, {
          userId: profileRes.data.userId || res.data.userId,
          phone: profileRes.data.phone || res.data.phone || '',
          avatar: profileRes.data.avatar || res.data.avatar || '',
          nickname: profileRes.data.nickname || ''
        })
      }
    } catch (err) {
      console.error('获取用户详情失败:', err)
      // 获取失败不影响登录流程
    }
  }

  return res
}

/**
 * 刷新访问令牌
 * @returns {Promise}
 */
const refreshAccessToken = async () => {
  const refreshToken = wx.getStorageSync(config.REFRESH_TOKEN_KEY)

  if (!refreshToken) {
    return { success: false, message: '刷新令牌不存在' }
  }

  try {
    console.log('手动刷新 Token...')
    const res = await post('/api/auth/refresh', { refreshToken })

    if (res.success && res.data) {
      // 保存新 Token
      setToken(res.data.token)
      setRefreshToken(res.data.refreshToken)

      // 先保存刷新接口返回的基本信息
      const oldUserInfo = wx.getStorageSync(config.USER_INFO_KEY) || {}
      wx.setStorageSync(config.USER_INFO_KEY, {
        userId: res.data.userId,
        phone: res.data.phone || '',
        avatar: res.data.avatar || oldUserInfo.avatar || '',
        nickname: oldUserInfo.nickname || ''
      })

      // 获取完整用户信息
      try {
        const profileRes = await get('/api/me')
        if (profileRes.success && profileRes.data) {
          wx.setStorageSync(config.USER_INFO_KEY, {
            userId: profileRes.data.userId || res.data.userId,
            phone: profileRes.data.phone || res.data.phone || '',
            avatar: profileRes.data.avatar || res.data.avatar || '',
            nickname: profileRes.data.nickname || ''
          })
        }
      } catch (err) {
        console.error('刷新后获取用户详情失败:', err)
      }

      console.log('Token 刷新成功')
    }

    return res
  } catch (err) {
    console.error('Token 刷新失败:', err)
    return { success: false, message: err.message || '刷新令牌失败' }
  }
}

/**
 * 退出登录
 * @returns {Promise}
 */
const logout = async () => {
  try {
    await post('/api/auth/logout')
  } catch (e) {
    // 即使请求失败也清除本地数据
    console.log('退出登录请求失败，但仍清除本地数据')
  }
  
  // 清除本地存储
  clearTokens()
  
  return { success: true }
}

/**
 * 微信登录获取 code
 * @returns {Promise<string>} 返回 code
 */
const wxLogin = () => {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          resolve(res.code)
        } else {
          reject(new Error('获取微信登录 code 失败'))
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

/**
 * 小程序登录 - 通过 code 获取 session 信息（openId/unionId）
 * @param {string} code 微信登录 code（来自 wx.login）
 * @returns {Promise} 返回 { openId, unionId, sessionKey 等 }
 */
const getUnionIdByCode = (code) => {
  return post('/api/auth/mini-program/code2session', { code })
}

/**
 * 获取手机号（需要用户点击按钮授权）
 * 此方法需要配合 button 组件使用
 * <button open-type="getPhoneNumber" bindgetphonenumber="handleGetPhoneNumber">
 * @param {Object} e 事件对象
 * @returns {Promise}
 */
const getPhoneNumber = (e) => {
  return new Promise((resolve, reject) => {
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      // 获取加密数据，发送到后端解密
      resolve({
        encryptedData: e.detail.encryptedData,
        iv: e.detail.iv,
        code: e.detail.code // 新版本使用 code 换取手机号
      })
    } else {
      reject(new Error('用户拒绝授权手机号'))
    }
  })
}

/**
 * 通过加密数据获取手机号（需要后端解密）
 * @param {Object} params 参数
 * @param {string} params.code 手机号 code（新版本）
 * @param {string} params.encryptedData 加密数据（旧版本）
 * @param {string} params.iv 向量（旧版本）
 * @returns {Promise}
 */
const decryptPhoneNumber = (params) => {
  return post('/api/auth/wechat/phone', params)
}

/**
 * 检查登录状态
 * @returns {boolean}
 */
const isLoggedIn = () => {
  const token = wx.getStorageSync(config.TOKEN_KEY)
  return !!token
}

/**
 * 检查登录状态，未登录则跳转登录页
 * @returns {boolean} 是否已登录
 */
const checkLogin = () => {
  if (isLoggedIn()) {
    return true
  }
  wx.navigateTo({
    url: '/pages/login/login'
  })
  return false
}

/**
 * 获取当前用户信息
 * @returns {Object|null}
 */
const getCurrentUser = () => {
  return wx.getStorageSync(config.USER_INFO_KEY) || null
}

/**
 * 校验手机号格式
 * @param {string} phone 手机号
 * @returns {boolean}
 */
const validatePhone = (phone) => {
  const phoneReg = /^1[3-9]\d{9}$/
  return phoneReg.test(phone)
}

/**
 * 校验验证码格式
 * @param {string} code 验证码
 * @returns {boolean}
 */
const validateOtpCode = (code) => {
  const codeReg = /^\d{6}$/
  return codeReg.test(code)
}

module.exports = {
  sendOtp,
  verifyOtp,
  loginWithWechat,
  refreshAccessToken,
  logout,
  wxLogin,
  getUnionIdByCode,
  getPhoneNumber,
  decryptPhoneNumber,
  isLoggedIn,
  checkLogin,
  getCurrentUser,
  validatePhone,
  validateOtpCode
}

