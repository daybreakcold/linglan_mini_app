import MarkdownRenderer from '../MarkdownRenderer'
import { formatDate } from '@/utils/format'
import { DOCTOR_INFO } from '@/utils/constants'
import styles from './index.module.scss'

function ChatMessage({ message, userAvatar }) {
  const isUser = message.role?.toUpperCase() === 'USER'
  const avatar = isUser ? userAvatar : DOCTOR_INFO.avatar
  const name = isUser ? '我' : DOCTOR_INFO.name

  return (
    <div className={`${styles.message} ${isUser ? styles.user : styles.assistant}`}>
      <img src={avatar || '/images/default-avatar.png'} alt="" className={styles.avatar} />
      <div className={styles.bubble}>
        <div className={styles.header}>
          <span className={styles.name}>{name}</span>
          {message.timestamp && (
            <span className={styles.time}>{formatDate(message.timestamp, 'HH:mm')}</span>
          )}
        </div>
        <div className={styles.content}>
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatMessage
