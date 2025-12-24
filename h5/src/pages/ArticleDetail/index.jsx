import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Loading from '@/components/Loading'
import { getArticleDetail, getArticleComments, likeArticle, unlikeArticle, postComment } from '@/services/content'
import { formatDate } from '@/utils/format'
import styles from './index.module.scss'

// SVG 图标组件
const ArrowBackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const MoreIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="6" cy="12" r="2" fill="#999"/>
    <circle cx="12" cy="12" r="2" fill="#999"/>
    <circle cx="18" cy="12" r="2" fill="#999"/>
  </svg>
)

const ThumbUpIcon = ({ active = false }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path 
      d="M7 22H4C3.46957 22 2.96086 21.7893 2.58579 21.4142C2.21071 21.0391 2 20.5304 2 20V13C2 12.4696 2.21071 11.9609 2.58579 11.5858C2.96086 11.2107 3.46957 11 4 11H7M14 9V5C14 4.20435 13.6839 3.44129 13.1213 2.87868C12.5587 2.31607 11.7956 2 11 2L7 11V22H18.28C18.7623 22.0055 19.2304 21.8364 19.5979 21.524C19.9654 21.2116 20.2077 20.7769 20.28 20.3L21.66 11.3C21.7035 11.0134 21.6842 10.7207 21.6033 10.4423C21.5225 10.1638 21.3821 9.90629 21.1919 9.68751C21.0016 9.46873 20.7661 9.29393 20.5016 9.17522C20.2371 9.0565 19.9499 8.99672 19.66 9H14Z" 
      stroke={active ? "#119c59" : "#6d6d6d"} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      fill={active ? "#119c59" : "none"}
    />
  </svg>
)

const CommentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#6d6d6d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const AddCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="#1D1B20" strokeWidth="2"/>
    <path d="M12 8V16M8 12H16" stroke="#1D1B20" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const EmojiIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="#1D1B20" strokeWidth="2"/>
    <path d="M8 14C8.5 15.5 10 17 12 17C14 17 15.5 15.5 16 14" stroke="#1D1B20" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="9" cy="10" r="1" fill="#1D1B20"/>
    <circle cx="15" cy="10" r="1" fill="#1D1B20"/>
  </svg>
)

function ArticleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const commentListEndRef = useRef(null)
  const [article, setArticle] = useState(null)
  const [comments, setComments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 滚动到评论列表底部
  const scrollToBottom = () => {
    setTimeout(() => {
      commentListEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

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

  // 返回上一页
  const handleBack = () => {
    navigate(-1)
  }

  // 点赞文章
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

  // 点赞评论（本地状态切换，API 暂未实现）
  const handleLikeComment = async (comment) => {
    try {
      // TODO: 后端实现 likeComment API 后取消注释
      // await likeComment(comment.id)
      setComments(prev => prev.map(item => {
        if (item.id === comment.id) {
          return {
            ...item,
            isLiked: !item.isLiked,
            likeCount: item.isLiked ? (item.likeCount || 1) - 1 : (item.likeCount || 0) + 1
          }
        }
        return item
      }))
    } catch (err) {
      console.error('点赞评论失败:', err)
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
          // 滚动到底部显示新评论
          scrollToBottom()
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
      {/* 顶部导航栏 - 小程序 webview 中由原生提供，暂时注释 */}
      {/* <div className={styles.navbar}>
        <div className={styles.backBtn} onClick={handleBack}>
          <ArrowBackIcon />
        </div>
        <span className={styles.navTitle}>灵壹健康科普</span>
        <div className={styles.placeholder} />
      </div> */}

      {/* 文章内容区 */}
      <div className={styles.articleSection}>
        {/* 标签和时间 */}
        <div className={styles.metaRow}>
          {article.tag && (
            <span className={styles.tag}>#{article.tag}</span>
          )}
          <span className={styles.publishTime}>
            {formatDate(article.publishAt, 'M月D日 hh:mm A')} 发布
          </span>
        </div>

        {/* 标题和副标题 */}
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{article.title}</h1>
          {article.summary && (
            <p className={styles.subtitle}>{article.summary}</p>
          )}
        </div>

        {/* 封面图 */}
        {article.coverUrl && (
          <div className={styles.coverWrapper}>
            <img src={article.coverUrl} alt="" className={styles.cover} />
          </div>
        )}

        {/* 完整正文 */}
        {article.bodyHtml && (
          <div
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
          />
        )}
      </div>

      {/* 精选点评 */}
      <div className={styles.commentsSection}>
        <h2 className={styles.sectionTitle}>精选点评（{comments.length}）</h2>

        <div className={styles.commentList}>
          {comments.map(comment => (
            <div key={comment.id} className={styles.commentCard}>
              {/* 用户信息 */}
              <div className={styles.commentHeader}>
                <div className={styles.userInfo}>
                  <img
                    src={comment.avatar || '/images/default-avatar.png'}
                    alt=""
                    className={styles.avatar}
                  />
                  <span className={styles.nickname}>{comment.nickname || '匿名用户'}</span>
                </div>
                <button className={styles.moreBtn}>
                  <MoreIcon />
                </button>
              </div>

              {/* 评论内容 */}
              <p className={styles.commentText}>{comment.content}</p>

              {/* 评论标签 */}
              {article.tag && (
                <div className={styles.commentTag}>#{article.tag}</div>
              )}

              {/* 互动区 */}
              <div className={styles.commentActions}>
                <button 
                  className={`${styles.likeBtn} ${comment.isLiked ? styles.active : ''}`}
                  onClick={() => handleLikeComment(comment)}
                >
                  <ThumbUpIcon active={comment.isLiked} />
                  <span>{comment.likeCount || 0}</span>
                </button>
                <div className={styles.replyCount}>
                  <CommentIcon />
                  <span>{comment.replyCount || 0}</span>
                </div>
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <div className={styles.emptyComment}>暂无评论，快来抢沙发吧~</div>
          )}
          {/* 用于滚动定位的锚点 */}
          <div ref={commentListEndRef} />
        </div>
      </div>

      {/* 底部评论输入栏 */}
      <div className={styles.bottomBar}>
        {/* 暂时注释左侧图标按钮 */}
        {/* <button className={styles.iconBtn}>
          <AddCircleIcon />
        </button>
        <button className={styles.iconBtn}>
          <EmojiIcon />
        </button> */}
        <div className={styles.inputWrapper}>
          <input
            type="text"
            placeholder="填写评论"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className={styles.input}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmitComment()
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default ArticleDetail
