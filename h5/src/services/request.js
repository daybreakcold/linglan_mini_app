/**
 * HTTP 请求封装 (Axios)
 * 统一处理请求、响应、错误、Token 刷新等
 */

import axios from 'axios'
import { getToken, setToken, getRefreshToken, setRefreshToken, clearTokens, setUserInfo } from '@/utils/storage'
import { BASE_URL } from '@/utils/constants'

// 创建 axios 实例
const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 是否正在刷新 token
let isRefreshing = false
// 等待刷新的请求队列
let refreshSubscribers = []

// 添加到队列
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback)
}

// 执行队列中的请求
const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers['x-token'] = token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    const { data } = response

    // 业务成功
    if (data.success) {
      return data
    }

    // 业务错误，显示提示
    if (data.message) {
      showToast(data.message)
    }
    return Promise.reject(data)
  },
  async (error) => {
    const originalRequest = error.config

    // 401 Token 过期处理
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 正在刷新，加入队列等待
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers['x-token'] = token
            resolve(instance(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = getRefreshToken()
      if (!refreshToken) {
        clearTokens()
        redirectToLogin()
        return Promise.reject({ success: false, message: '请重新登录' })
      }

      try {
        // 刷新 token
        const refreshRes = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken })

        if (refreshRes.data.success && refreshRes.data.data?.token) {
          const { token, refreshToken: newRefreshToken, userId, phone, avatar } = refreshRes.data.data

          // 保存新 token
          setToken(token)
          setRefreshToken(newRefreshToken)
          setUserInfo({ userId, phone: phone || '', avatar: avatar || '' })

          // 执行队列中的请求
          onTokenRefreshed(token)

          // 重试原请求
          originalRequest.headers['x-token'] = token
          return instance(originalRequest)
        } else {
          throw new Error('刷新失败')
        }
      } catch (err) {
        clearTokens()
        redirectToLogin()
        return Promise.reject({ success: false, message: '登录已过期，请重新登录' })
      } finally {
        isRefreshing = false
      }
    }

    // 其他错误
    const message = error.response?.data?.message || error.message || '网络请求失败'
    showToast(message)
    return Promise.reject({
      success: false,
      message,
      data: null
    })
  }
)

// 显示提示
const showToast = (message) => {
  // 简单的 toast 实现，后续可替换为组件库
  const toast = document.createElement('div')
  toast.className = 'toast-message'
  toast.textContent = message
  toast.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 9999;
  `
  document.body.appendChild(toast)
  setTimeout(() => {
    document.body.removeChild(toast)
  }, 2000)
}

// 跳转登录页
const redirectToLogin = () => {
  showToast('请重新登录')
  setTimeout(() => {
    window.location.href = '/login'
  }, 1500)
}

// 导出请求方法
export const get = (url, params = {}, config = {}) => {
  return instance.get(url, { params, ...config })
}

export const post = (url, data = {}, config = {}) => {
  return instance.post(url, data, config)
}

export const put = (url, data = {}, config = {}) => {
  return instance.put(url, data, config)
}

export const del = (url, data = {}, config = {}) => {
  return instance.delete(url, { data, ...config })
}

export default instance
