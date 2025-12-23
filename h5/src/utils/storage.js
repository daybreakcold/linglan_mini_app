// localStorage 封装

const TOKEN_KEY = import.meta.env.VITE_TOKEN_KEY || 'x_token'
const REFRESH_TOKEN_KEY = import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refresh_token'
const USER_INFO_KEY = import.meta.env.VITE_USER_INFO_KEY || 'user_info'

export const getToken = () => localStorage.getItem(TOKEN_KEY) || ''

export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY) || ''

export const setRefreshToken = (token) => localStorage.setItem(REFRESH_TOKEN_KEY, token)

export const getUserInfo = () => {
  const info = localStorage.getItem(USER_INFO_KEY)
  return info ? JSON.parse(info) : null
}

export const setUserInfo = (info) => {
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
}

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_INFO_KEY)
}

export default {
  getToken,
  setToken,
  getRefreshToken,
  setRefreshToken,
  getUserInfo,
  setUserInfo,
  clearTokens
}
