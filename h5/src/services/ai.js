/**
 * AI 服务 - 对话相关 API
 */

import { get, post } from './request'
import { BASE_URL } from '@/utils/constants'
import { getToken } from '@/utils/storage'

/**
 * 初始化对话页面
 * @param {number} templateId - 模板 ID
 */
export const initDialogPage = (templateId) => {
  return post('/api/ai/dialog/init', { templateId })
}

/**
 * 获取对话历史
 * @param {Object} params - { dialogId, page, size }
 */
export const getDialogHistory = (params = {}) => {
  return get('/api/ai/dialog/history', {
    dialogId: params.dialogId,
    page: params.page || 1,
    size: params.size || 20
  })
}

/**
 * 发送消息 (流式响应)
 * @param {Object} data - { dialogId, content }
 * @param {Function} onMessage - 收到消息时的回调
 * @param {Function} onDone - 完成时的回调
 * @param {Function} onError - 错误时的回调
 */
export const sendMessage = async (data, { onMessage, onDone, onError }) => {
  const token = getToken()

  try {
    const response = await fetch(`${BASE_URL}/api/ai/dialog/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-token': token
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        if (onDone) onDone()
        break
      }

      buffer += decoder.decode(value, { stream: true })

      // 处理 SSE 格式数据
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            if (onDone) onDone()
            return
          }
          try {
            const json = JSON.parse(data)
            if (onMessage) onMessage(json)
          } catch (e) {
            // 普通文本
            if (onMessage) onMessage({ content: data })
          }
        }
      }
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    if (onError) onError(error)
  }
}

/**
 * 发送消息 (非流式)
 * @param {Object} data - { dialogId, content }
 */
export const sendMessageSync = (data) => {
  return post('/api/ai/dialog/send', data)
}

export default {
  initDialogPage,
  getDialogHistory,
  sendMessage,
  sendMessageSync
}
