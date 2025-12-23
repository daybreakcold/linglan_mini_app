/**
 * 认证状态管理 (Zustand)
 */

import { create } from 'zustand'
import { getToken, getUserInfo, clearTokens } from '@/utils/storage'

const useAuthStore = create((set, get) => ({
  // 状态
  token: getToken(),
  userInfo: getUserInfo(),
  isLoggedIn: !!getToken(),

  // 更新登录状态
  updateAuth: () => {
    const token = getToken()
    const userInfo = getUserInfo()
    set({
      token,
      userInfo,
      isLoggedIn: !!token
    })
  },

  // 登出
  logout: () => {
    clearTokens()
    set({
      token: '',
      userInfo: null,
      isLoggedIn: false
    })
  },

  // 检查是否登录
  checkLogin: () => {
    return !!getToken()
  }
}))

export default useAuthStore
