import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import Loading from '@/components/Loading'
import { initDialogPage, loadHistory, sendMessage } from '@/services/ai'
import { DOCTOR_INFO } from '@/utils/constants'
import styles from './index.module.scss'

// SVG 图标组件
const ArrowBackIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M15 18L9 12L15 6" stroke="#1d1b20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const SendIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
  </svg>
)

// 快捷问题
const QUICK_QUESTIONS = [
  '孩子最近咳嗽怎么办？',
  '如何调理脾胃虚弱？',
  '秋冬季节如何养生？',
  '失眠多梦怎么调理？'
]

// 格式化消息时间
const formatMessageTime = (timestamp) => {
  if (!timestamp) return ''
  try {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

// 获取当前时间
const getCurrentTime = () => {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 格式化日期分隔
const formatDateSeparator = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekday = weekdays[date.getDay()]
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${weekday}, ${month}月${day}日`
}

// 标准化消息角色
const normalizeRole = (role) => {
  if (!role) return 'ASSISTANT'
  const upperRole = role.toUpperCase()
  if (upperRole === 'USER') return 'USER'
  if (upperRole === 'AI' || upperRole === 'ASSISTANT') return 'ASSISTANT'
  if (upperRole === 'SYSTEM') return 'ASSISTANT'
  return 'ASSISTANT'
}

// 加载中指示器
const LoadingDots = () => (
  <div className={styles.loadingDots}>
    <span></span>
    <span></span>
    <span></span>
  </div>
)

// 消息组件
const Message = ({ message, isUser, isLoading }) => {
  return (
    <div className={`${styles.message} ${isUser ? styles.userMessage : styles.aiMessage}`}>
      <div className={styles.messageBubble}>
        {isLoading ? (
          <LoadingDots />
        ) : (
          <>
            <p className={styles.messageText}>{message.content}</p>
            <span className={styles.messageTime}>
              {message.timestamp}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

function InquiryChat() {
  const { templateId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const title = searchParams.get('title') || '健康百科'
  const subtitle = searchParams.get('subtitle') || ''

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // 场景相关数据
  const [doctor, setDoctor] = useState(DOCTOR_INFO)
  const [tag, setTag] = useState('')
  const [historyHasMore, setHistoryHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 添加消息
  const addMessage = (msg) => {
    const newMsg = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random()}`,
      timestamp: msg.timestamp || getCurrentTime()
    }
    setMessages(prev => [...prev, newMsg])
    return newMsg
  }

  // 初始化对话 - 与小程序逻辑一致
  useEffect(() => {
    const initChat = async () => {
      setIsLoading(true)
      try {
        // 初始化对话，默认使用 templateId 1
        const res = await initDialogPage(templateId ? Number(templateId) : 1)

        if (res.success && res.data) {
          const data = res.data
          const initMessages = []

          // 设置医生信息
          if (data.doctor) {
            setDoctor({
              name: data.doctor.name || DOCTOR_INFO.name,
              avatar: data.doctor.avatar || DOCTOR_INFO.avatar,
              title: data.doctor.title || DOCTOR_INFO.title
            })
          }

          // 处理预设消息
          if (data.presetMessages && data.presetMessages.length > 0) {
            data.presetMessages.forEach(msg => {
              initMessages.push({
                id: `preset_${Date.now()}_${Math.random()}`,
                role: normalizeRole(msg.role),
                content: msg.content,
                timestamp: ''
              })
            })
          }

          // 处理历史消息
          if (data.history && data.history.length > 0) {
            data.history.forEach(msg => {
              initMessages.push({
                id: `history_${msg.messageId}`,
                messageId: msg.messageId,
                sessionId: msg.sessionId,
                role: normalizeRole(msg.role),
                content: msg.content,
                timestamp: formatMessageTime(msg.createdTime)
              })
            })
          }

          // 如果没有预设消息和历史，添加欢迎消息
          if (initMessages.length === 0) {
            const welcomeContent = `您好！我是${data.doctor?.name || doctor.name}。${data.description || '请问有什么可以帮助您的？'}`
            initMessages.push({
              id: `welcome_${Date.now()}`,
              role: 'ASSISTANT',
              content: welcomeContent,
              timestamp: getCurrentTime()
            })
          }

          setMessages(initMessages)
          setTag(data.tag || '')
          setHistoryHasMore(data.historyHasMore || false)
          setNextCursor(data.nextCursor || null)
        } else {
          // 降级处理：显示默认欢迎消息
          setMessages([{
            id: `welcome_${Date.now()}`,
            role: 'ASSISTANT',
            content: `您好！我是${doctor.name}，很高兴为您提供健康咨询服务。请问有什么可以帮助您的吗？`,
            timestamp: getCurrentTime()
          }])
        }
      } catch (err) {
        console.error('初始化失败:', err)
        // 降级处理
        setMessages([{
          id: `error_${Date.now()}`,
          role: 'ASSISTANT',
          content: '您好！我是灵壹健康的AI健康助手，很高兴为您提供健康咨询服务。请问您有什么健康问题需要咨询？',
          timestamp: getCurrentTime()
        }])
      } finally {
        setIsLoading(false)
      }
    }

    initChat()
  }, [templateId])

  // 消息更新时滚动到底部
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 加载更多历史记录
  const handleLoadMoreHistory = async () => {
    if (isLoadingHistory || !historyHasMore || !tag) return

    setIsLoadingHistory(true)
    try {
      const res = await loadHistory({
        tag,
        cursor: nextCursor,
        size: 20
      })

      if (res.success && res.data) {
        const { messages: historyMessages, hasMore, nextCursor: newCursor } = res.data

        if (historyMessages && historyMessages.length > 0) {
          const newMessages = historyMessages.map(msg => ({
            id: `history_${msg.messageId}`,
            messageId: msg.messageId,
            sessionId: msg.sessionId,
            role: normalizeRole(msg.role),
            content: msg.content,
            timestamp: formatMessageTime(msg.createdTime)
          }))

          setMessages(prev => [...newMessages, ...prev])
          setHistoryHasMore(hasMore)
          setNextCursor(newCursor)
        }
      }
    } catch (err) {
      console.error('加载历史记录失败:', err)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // 返回上一页
  const handleBack = () => {
    navigate(-1)
  }

  // 发送消息 - 与小程序逻辑一致
  const handleSend = async () => {
    const question = inputValue.trim()
    if (!question || isSending) return

    // 添加用户消息
    addMessage({
      role: 'USER',
      content: question
    })

    setInputValue('')
    setIsSending(true)

    try {
      // 构建历史上下文（最近10条对话）
      const history = messages
        .filter(m => m.role === 'USER' || m.role === 'ASSISTANT')
        .slice(-10)
        .map(m => ({
          role: m.role === 'USER' ? 'user' : 'ai',
          content: m.content
        }))

      // 调用 AI 接口
      const res = await sendMessage({
        question,
        history,
        templateId: templateId ? Number(templateId) : 1,
        tag: tag || undefined
      })

      if (res.success && res.data) {
        addMessage({
          role: 'ASSISTANT',
          content: res.data.reply,
          sessionId: res.data.sessionId
        })
      } else {
        throw new Error(res.message || 'AI 回复失败')
      }
    } catch (err) {
      console.error('发送失败:', err)
      addMessage({
        role: 'ASSISTANT',
        content: '抱歉，网络出现问题，请稍后再试。'
      })
    } finally {
      setIsSending(false)
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

  // 获取第一条消息的日期作为日期分隔显示
  const firstMessageDate = messages.length > 0 ? formatDateSeparator(new Date().toISOString()) : ''

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
        <div className={styles.headerContent}>
          {/* 返回按钮 - 小程序 webview 中由原生提供，暂时注释 */}
          {/* <button className={styles.backBtn} onClick={handleBack}>
            <ArrowBackIcon />
          </button> */}

          <img src={doctor.avatar} alt="" className={styles.avatar} />

          <div className={styles.headerInfo}>
            <div className={styles.headerTitle}>{title}</div>
            <div className={styles.headerSubtitle}>{subtitle || doctor.title}</div>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className={styles.messageList}>
        {/* 加载更多历史 */}
        {historyHasMore && (
          <div className={styles.loadMore} onClick={handleLoadMoreHistory}>
            {isLoadingHistory ? '加载中...' : '加载更多历史'}
          </div>
        )}

        {/* 日期分隔 */}
        {firstMessageDate && (
          <div className={styles.dateSeparator}>{firstMessageDate}</div>
        )}

        {messages.map((msg) => (
          <Message
            key={msg.id}
            message={msg}
            isUser={msg.role === 'USER'}
          />
        ))}
        {/* AI 正在回复的加载状态 */}
        {isSending && (
          <Message
            message={{ id: 'loading', role: 'ASSISTANT', content: '' }}
            isUser={false}
            isLoading={true}
          />
        )}
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

      {/* 底部输入区域 */}
      <div className={styles.bottomBar}>
        <div className={styles.inputWrapper}>
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
              <SendIcon />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default InquiryChat
