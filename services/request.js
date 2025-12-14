/**
 * HTTP 请求封装
 * 统一处理请求、响应、错误、Token 刷新等
 */

const config = require('../config/index')

/**
 * 获取存储的 Token
 */
const getToken = () => {
  return wx.getStorageSync(config.TOKEN_KEY) || ''
}

/**
 * 设置 Token
 */
const setToken = (token) => {
  wx.setStorageSync(config.TOKEN_KEY, token)
}

/**
 * 获取刷新 Token
 */
const getRefreshToken = () => {
  return wx.getStorageSync(config.REFRESH_TOKEN_KEY) || ''
}

/**
 * 设置刷新 Token
 */
const setRefreshToken = (refreshToken) => {
  wx.setStorageSync(config.REFRESH_TOKEN_KEY, refreshToken)
}

/**
 * 清除所有 Token
 */
const clearTokens = () => {
  wx.removeStorageSync(config.TOKEN_KEY)
  wx.removeStorageSync(config.REFRESH_TOKEN_KEY)
  wx.removeStorageSync(config.USER_INFO_KEY)
}

/**
 * 基础请求方法
 * @param {Object} options 请求配置
 * @returns {Promise}
 */
const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = getToken()
    
    // 默认 headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.header
    }
    
    // 如果有 token，添加到 header
    if (token) {
      headers['x-token'] = token
    }
    
    wx.request({
      url: options.url.startsWith('http') ? options.url : `${config.baseUrl}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header: headers,
      timeout: options.timeout || 30000,
      success: (res) => {
        const { statusCode, data } = res
        
        // HTTP 状态码处理
        if (statusCode >= 200 && statusCode < 300) {
          // 业务响应处理
          if (data.success) {
            resolve(data)
          } else {
            // 业务错误
            handleBusinessError(data, reject)
          }
        } else if (statusCode === 401) {
          // Token 过期，尝试刷新
          handleTokenExpired(options, resolve, reject)
        } else {
          reject({
            success: false,
            message: `请求失败: ${statusCode}`,
            data: null
          })
        }
      },
      fail: (err) => {
        console.error('请求失败:', err)
        reject({
          success: false,
          message: '网络请求失败，请检查网络连接',
          data: null
        })
      }
    })
  })
}

/**
 * 处理业务错误
 */
const handleBusinessError = (data, reject) => {
  // 显示错误提示
  if (data.message) {
    wx.showToast({
      title: data.message,
      icon: 'none',
      duration: 2000
    })
  }
  reject(data)
}

/**
 * 处理 Token 过期
 * 使用 refreshToken 刷新访问令牌
 */
const handleTokenExpired = async (originalOptions, resolve, reject) => {
  const refreshToken = getRefreshToken()
  
  if (!refreshToken) {
    // 没有刷新 token，跳转登录
    redirectToLogin()
    reject({ success: false, message: '请重新登录' })
    return
  }
  
  try {
    // 尝试刷新 token
    console.log('Token 过期，尝试刷新...')
    const refreshRes = await refreshTokenRequest(refreshToken)
    
    if (refreshRes.success && refreshRes.data && refreshRes.data.token && refreshRes.data.refreshToken) {
      console.log('Token 刷新成功')
      
      // 保存新 token
      setToken(refreshRes.data.token)
      setRefreshToken(refreshRes.data.refreshToken)
      
      // 同步更新用户信息（处理 null 值）
      wx.setStorageSync(config.USER_INFO_KEY, {
        userId: refreshRes.data.userId,
        phone: refreshRes.data.phone || '',
        avatar: refreshRes.data.avatar || '',
        nickname: wx.getStorageSync(config.USER_INFO_KEY)?.nickname || ''
      })
      
      // 重新发起原请求
      const retryRes = await request(originalOptions)
      resolve(retryRes)
    } else {
      // 刷新失败，跳转登录
      console.log('Token 刷新失败')
      clearTokens()
      redirectToLogin()
      reject({ success: false, message: '登录已过期，请重新登录' })
    }
  } catch (err) {
    console.error('Token 刷新异常:', err)
    clearTokens()
    redirectToLogin()
    reject({ success: false, message: '登录已过期，请重新登录' })
  }
}

/**
 * 刷新 Token 请求
 */
const refreshTokenRequest = (refreshToken) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${config.baseUrl}/api/auth/refresh`,
      method: 'POST',
      data: { refreshToken },
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          resolve(res.data)
        } else {
          reject(res.data)
        }
      },
      fail: reject
    })
  })
}

/**
 * 跳转到登录页
 */
const redirectToLogin = () => {
  wx.showToast({
    title: '请重新登录',
    icon: 'none'
  })
  setTimeout(() => {
    wx.reLaunch({
      url: '/pages/login/login'
    })
  }, 1500)
}

/**
 * GET 请求
 */
const get = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'GET',
    data,
    ...options
  })
}

/**
 * POST 请求
 */
const post = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  })
}

/**
 * PUT 请求
 */
const put = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'PUT',
    data,
    ...options
  })
}

/**
 * DELETE 请求
 */
const del = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'DELETE',
    data,
    ...options
  })
}

module.exports = {
  request,
  get,
  post,
  put,
  del,
  getToken,
  setToken,
  getRefreshToken,
  setRefreshToken,
  clearTokens
}

