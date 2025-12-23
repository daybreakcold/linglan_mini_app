/**
 * 聊天状态管理 (Zustand)
 */

import { create } from 'zustand'

const useChatStore = create((set, get) => ({
  // 状态
  dialogId: null,
  messages: [],
  isLoading: false,
  isSending: false,
  hasMore: true,

  // 设置对话 ID
  setDialogId: (dialogId) => set({ dialogId }),

  // 设置消息列表
  setMessages: (messages) => set({ messages }),

  // 添加消息
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),

  // 更新最后一条消息 (用于流式响应)
  updateLastMessage: (content) => set((state) => {
    const messages = [...state.messages]
    if (messages.length > 0) {
      const lastIndex = messages.length - 1
      messages[lastIndex] = {
        ...messages[lastIndex],
        content: messages[lastIndex].content + content
      }
    }
    return { messages }
  }),

  // 在列表前面添加历史消息
  prependMessages: (historyMessages) => set((state) => ({
    messages: [...historyMessages, ...state.messages]
  })),

  // 设置加载状态
  setLoading: (isLoading) => set({ isLoading }),

  // 设置发送状态
  setSending: (isSending) => set({ isSending }),

  // 设置是否有更多历史
  setHasMore: (hasMore) => set({ hasMore }),

  // 清空聊天
  clearChat: () => set({
    dialogId: null,
    messages: [],
    isLoading: false,
    isSending: false,
    hasMore: true
  })
}))

export default useChatStore
