import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Loading from '@/components/Loading'
import { getArticleDetail, getArticleComments, likeArticle, unlikeArticle, postComment } from '@/services/content'
import { formatDate, formatNumber } from '@/utils/format'
import { getTagName } from '@/utils/constants'
import styles from './index.module.scss'

function ArticleDetail() {
  const { id } = useParams()
  const [article, setArticle] = useState(null)
  const [comments, setComments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 加载文章详情
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [articleRes, commentsRes] = await Promise.all([
          getArticleDetail(id),
          getArticleComments(id, { page: 1, size: 20 })
        ])

        if (articleRes.success) {
          setArticle(articleRes.data)
        }
        if (commentsRes.success) {
          setComments(commentsRes.data?.items || [])
        }
      } catch (err) {
        console.error('加载失败:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      loadData()
    }
  }, [id])

  // 点赞
  const handleLike = async () => {
    if (!article) return
    try {
      if (article.isLiked) {
        await unlikeArticle(id)
      } else {
        await likeArticle(id)
      }
      setArticle(prev => ({
        ...prev,
        isLiked: !prev.isLiked,
        likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1
      }))
    } catch (err) {
      console.error('点赞失败:', err)
    }
  }

  // 发表评论
  const handleSubmitComment = async () => {
    if (!commentText.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      const res = await postComment(id, commentText.trim())
      if (res.success) {
        setCommentText('')
        // 重新加载评论
        const commentsRes = await getArticleComments(id, { page: 1, size: 20 })
        if (commentsRes.success) {
          setComments(commentsRes.data?.items || [])
        }
      }
    } catch (err) {
      console.error('评论失败:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <Loading />
  }

  if (!article) {
    return <div className={styles.error}>文章不存在</div>
  }

  return (
    <div className={styles.page}>
      <article className={styles.article}>
        <header className={styles.header}>
          <h1 className={styles.title}>{article.title}</h1>
          <div className={styles.meta}>
            {article.tag && (
              <span className={styles.tag}>{getTagName(article.tag)}</span>
            )}
            <span>{formatDate(article.publishAt)}</span>
            <span>{formatNumber(article.viewCount)} 阅读</span>
          </div>
        </header>

        {article.coverUrl && (
          <img src={article.coverUrl} alt="" className={styles.cover} />
        )}

        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
        />

        <div className={styles.actions}>
          <button
            className={`${styles.actionBtn} ${article.isLiked ? styles.active : ''}`}
            onClick={handleLike}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <span>{article.likeCount || 0}</span>
          </button>
        </div>
      </article>

      <section className={styles.commentsSection}>
        <h2 className={styles.sectionTitle}>评论 ({comments.length})</h2>

        <div className={styles.commentInput}>
          <input
            type="text"
            placeholder="写下你的评论..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className={styles.input}
          />
          <button
            className={styles.submitBtn}
            onClick={handleSubmitComment}
            disabled={!commentText.trim() || isSubmitting}
          >
            发送
          </button>
        </div>

        <div className={styles.commentList}>
          {comments.length === 0 ? (
            <div className={styles.emptyComment}>暂无评论，快来抢沙发吧~</div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className={styles.commentItem}>
                <img
                  src={comment.avatar || '/images/default-avatar.png'}
                  alt=""
                  className={styles.avatar}
                />
                <div className={styles.commentContent}>
                  <div className={styles.commentHeader}>
                    <span className={styles.nickname}>{comment.nickname || '匿名用户'}</span>
                    <span className={styles.time}>{formatDate(comment.createTime, 'MM-DD HH:mm')}</span>
                  </div>
                  <p className={styles.commentText}>{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

export default ArticleDetail
