import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import ChatMessage from '@/components/ChatMessage'
import Loading from '@/components/Loading'
import useChatStore from '@/store/chatStore'
import useAuthStore from '@/store/authStore'
import { initDialogPage, getDialogHistory, sendMessage } from '@/services/ai'
import { DOCTOR_INFO } from '@/utils/constants'
import styles from './index.module.scss'

// 快捷问题
const QUICK_QUESTIONS = [
  '我最近总是失眠，有什么建议吗？',
  '如何调理脾胃虚弱？',
  '春季养生有哪些注意事项？',
  '经常头痛是什么原因？'
]

function InquiryChat() {
  const { templateId } = useParams()
  const [searchParams] = useSearchParams()
  const title = searchParams.get('title') || '健康咨询'

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const { userInfo } = useAuthStore()
  const {
    dialogId,
    messages,
    isSending,
    setDialogId,
    setMessages,
    addMessage,
    updateLastMessage,
    setSending
  } = useChatStore()

  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 初始化对话
  useEffect(() => {
    const initChat = async () => {
      setIsLoading(true)
      try {
        // 初始化对话
        const initRes = await initDialogPage(templateId ? Number(templateId) : 1)
        if (initRes.success && initRes.data) {
          setDialogId(initRes.data.dialogId)

          // 加载历史消息
          const historyRes = await getDialogHistory({
            dialogId: initRes.data.dialogId,
            page: 1,
            size: 50
          })

          if (historyRes.success && historyRes.data?.items) {
            // 处理消息角色大小写
            const historyMessages = historyRes.data.items.map(msg => ({
              ...msg,
              role: msg.role?.toUpperCase()
            })).reverse()
            setMessages(historyMessages)
          } else {
            // 添加欢迎消息
            setMessages([{
              role: 'ASSISTANT',
              content: `您好，我是${DOCTOR_INFO.name}，很高兴为您提供健康咨询服务。请问有什么可以帮助您的吗？`,
              timestamp: new Date().toISOString()
            }])
          }
        }
      } catch (err) {
        console.error('初始化失败:', err)
        setMessages([{
          role: 'ASSISTANT',
          content: '初始化失败，请刷新页面重试。',
          timestamp: new Date().toISOString()
        }])
      } finally {
        setIsLoading(false)
      }
    }

    initChat()

    // 清理
    return () => {
      setDialogId(null)
      setMessages([])
    }
  }, [templateId])

  // 消息更新时滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 发送消息
  const handleSend = async () => {
    const content = inputValue.trim()
    if (!content || isSending || !dialogId) return

    setInputValue('')
    setSending(true)

    // 添加用户消息
    addMessage({
      role: 'USER',
      content,
      timestamp: new Date().toISOString()
    })

    // 添加空的助手消息（用于流式更新）
    addMessage({
      role: 'ASSISTANT',
      content: '',
      timestamp: new Date().toISOString()
    })

    try {
      await sendMessage(
        { dialogId, content },
        {
          onMessage: (data) => {
            if (data.content) {
              updateLastMessage(data.content)
            }
          },
          onDone: () => {
            setSending(false)
          },
          onError: (err) => {
            console.error('发送失败:', err)
            updateLastMessage('抱歉，发送消息失败，请重试。')
            setSending(false)
          }
        }
      )
    } catch (err) {
      console.error('发送失败:', err)
      updateLastMessage('抱歉，发送消息失败，请重试。')
      setSending(false)
    }
  }

  // 快捷问题点击
  const handleQuickQuestion = (question) => {
    setInputValue(question)
    inputRef.current?.focus()
  }

  // 回车发送
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (isLoading) {
    return (
      <div className={styles.loadingPage}>
        <Loading text="正在连接..." />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* 头部 */}
      <div className={styles.header}>
        <div className={styles.doctorInfo}>
          <img src={DOCTOR_INFO.avatar} alt="" className={styles.avatar} />
          <div>
            <div className={styles.name}>{DOCTOR_INFO.name}</div>
            <div className={styles.status}>在线</div>
          </div>
        </div>
        <div className={styles.headerTitle}>{title}</div>
      </div>

      {/* 消息列表 */}
      <div className={styles.messageList}>
        {messages.map((msg, index) => (
          <ChatMessage
            key={index}
            message={msg}
            userAvatar={userInfo?.avatar}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 快捷问题 */}
      {messages.length <= 1 && (
        <div className={styles.quickQuestions}>
          <div className={styles.quickTitle}>快捷问题</div>
          <div className={styles.quickList}>
            {QUICK_QUESTIONS.map((q, i) => (
              <div
                key={i}
                className={styles.quickItem}
                onClick={() => handleQuickQuestion(q)}
              >
                {q}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div className={styles.inputArea}>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder="输入您的问题..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
        />
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={!inputValue.trim() || isSending}
        >
          {isSending ? (
            <span className={styles.sending}>...</span>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

export default InquiryChat
