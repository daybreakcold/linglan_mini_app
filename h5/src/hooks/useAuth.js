/**
 * 认证相关 Hook
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@/store/authStore'

/**
 * 检查登录状态，未登录则跳转
 * @param {string} redirectUrl - 跳转地址，默认 /login
 */
export const useRequireAuth = (redirectUrl = '/login') => {
  const navigate = useNavigate()
  const { isLoggedIn, updateAuth } = useAuthStore()

  useEffect(() => {
    updateAuth()
    if (!isLoggedIn) {
      navigate(redirectUrl, { replace: true })
    }
  }, [isLoggedIn, navigate, redirectUrl, updateAuth])

  return isLoggedIn
}

/**
 * 获取当前用户信息
 */
export const useCurrentUser = () => {
  const { userInfo, isLoggedIn, updateAuth } = useAuthStore()

  useEffect(() => {
    updateAuth()
  }, [updateAuth])

  return { userInfo, isLoggedIn }
}

export default useRequireAuth
