import { useNavigate } from 'react-router-dom'
import { formatRelativeTime, formatNumber } from '@/utils/format'
import { getTagName } from '@/utils/constants'
import styles from './index.module.scss'

function ArticleCard({ article, onLike, onFavorite }) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/articles/${article.id}`)
  }

  const handleLike = (e) => {
    e.stopPropagation()
    if (onLike) onLike(article)
  }

  const handleFavorite = (e) => {
    e.stopPropagation()
    if (onFavorite) onFavorite(article)
  }

  return (
    <div className={styles.card} onClick={handleClick}>
      <div className={styles.content}>
        <h3 className={styles.title}>{article.title}</h3>
        <p className={styles.summary}>{article.summary}</p>
        <div className={styles.meta}>
          <span className={styles.tag}>{getTagName(article.tag)}</span>
          <span className={styles.time}>{formatRelativeTime(article.publishAt)}</span>
          <span className={styles.views}>{formatNumber(article.viewCount)} 阅读</span>
        </div>
      </div>
      {article.coverUrl && (
        <img src={article.coverUrl} alt="" className={styles.cover} />
      )}
      <div className={styles.actions}>
        <div
          className={`${styles.action} ${article.isLiked ? styles.active : ''}`}
          onClick={handleLike}
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span>{article.likeCount || 0}</span>
        </div>
        <div
          className={`${styles.action} ${article.isFavorited ? styles.active : ''}`}
          onClick={handleFavorite}
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
          </svg>
          <span>收藏</span>
        </div>
      </div>
    </div>
  )
}

export default ArticleCard
