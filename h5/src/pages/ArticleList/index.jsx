import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import TagFilter from '@/components/TagFilter'
import ArticleCard from '@/components/ArticleCard'
import Loading from '@/components/Loading'
import Empty from '@/components/Empty'
import { getArticles, likeArticle, unlikeArticle } from '@/services/content'
import styles from './index.module.scss'

// 标签配置
const TAGS = [
  { key: '', name: '全部' },
  { key: 'HEALTH', name: '健康养生' },
  { key: 'PHYSIQUE', name: '体质调理' },
  { key: 'SLEEP', name: '睡眠调理' },
  { key: 'VISION', name: '视力养护' },
  { key: 'MATERNITY', name: '母婴健康' }
]

function ArticleList() {
  const [searchParams] = useSearchParams()
  const initialTag = searchParams.get('tag') || ''

  const [activeIndex, setActiveIndex] = useState(
    TAGS.findIndex(t => t.key === initialTag) || 0
  )
  const [articles, setArticles] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // 加载文章列表
  const loadArticles = useCallback(async (pageNum = 1, tag = '') => {
    if (pageNum === 1) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const res = await getArticles({
        page: pageNum,
        size: 10,
        tag: tag
      })

      if (res.success && res.data) {
        const { items, hasNext } = res.data
        if (pageNum === 1) {
          setArticles(items || [])
        } else {
          setArticles(prev => [...prev, ...(items || [])])
        }
        setHasMore(hasNext)
        setPage(pageNum)
      }
    } catch (err) {
      console.error('加载文章失败:', err)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  // 初始加载
  useEffect(() => {
    const tag = TAGS[activeIndex]?.key || ''
    loadArticles(1, tag)
  }, [activeIndex, loadArticles])

  // 标签切换
  const handleTagChange = (index) => {
    setActiveIndex(index)
    setPage(1)
    setArticles([])
  }

  // 加载更多
  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore) return
    const tag = TAGS[activeIndex]?.key || ''
    loadArticles(page + 1, tag)
  }

  // 点赞
  const handleLike = async (article) => {
    try {
      if (article.isLiked) {
        await unlikeArticle(article.id)
      } else {
        await likeArticle(article.id)
      }
      // 更新列表中的点赞状态
      setArticles(prev => prev.map(item => {
        if (item.id === article.id) {
          return {
            ...item,
            isLiked: !item.isLiked,
            likeCount: item.isLiked ? item.likeCount - 1 : item.likeCount + 1
          }
        }
        return item
      }))
    } catch (err) {
      console.error('点赞失败:', err)
    }
  }

  // 滚动加载更多
  useEffect(() => {
    const handleScroll = () => {
      if (isLoadingMore || !hasMore) return
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        handleLoadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isLoadingMore, hasMore, page])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>文章</h1>
      </div>

      <TagFilter
        tags={TAGS}
        activeIndex={activeIndex}
        onChange={handleTagChange}
      />

      <div className={styles.list}>
        {isLoading ? (
          <Loading />
        ) : articles.length === 0 ? (
          <Empty text="暂无文章" />
        ) : (
          <>
            {articles.map(article => (
              <ArticleCard
                key={article.id}
                article={article}
                onLike={handleLike}
              />
            ))}
            {isLoadingMore && <Loading text="加载更多..." />}
            {!hasMore && articles.length > 0 && (
              <div className={styles.noMore}>没有更多了</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ArticleList
