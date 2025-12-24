/**
 * 小程序 -> H5 认证桥接
 * 从 URL 参数中读取小程序传递的 token 并存储到 localStorage
 */

import { setToken, setRefreshToken, getToken } from './storage'

/**
 * 初始化认证状态
 * 从 URL 中读取小程序传递的 token 并保存
 * 应在应用启动时调用（main.jsx）
 */
export function initAuthFromUrl() {
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('_token')
  const refreshToken = urlParams.get('_refreshToken')

  // 如果 URL 中有 token，保存到 localStorage
  if (token) {
    console.log('[authBridge] 从小程序接收到 token')
    setToken(token)

    if (refreshToken) {
      setRefreshToken(refreshToken)
    }

    // 清理 URL 中的 token 参数（安全考虑，避免泄露）
    cleanAuthParams()
  }
}

/**
 * 清理 URL 中的认证参数
 * 使用 replaceState 避免浏览器历史记录中包含 token
 */
function cleanAuthParams() {
  const url = new URL(window.location.href)
  url.searchParams.delete('_token')
  url.searchParams.delete('_refreshToken')

  // 使用 replaceState 更新 URL，不产生新的历史记录
  window.history.replaceState({}, '', url.toString())
}

/**
 * 检查是否已登录
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!getToken()
}

export default {
  initAuthFromUrl,
  isAuthenticated
}
