import { useState, useEffect, useCallback } from 'react'
import TagFilter from '@/components/TagFilter'
import CourseCard from '@/components/CourseCard'
import Loading from '@/components/Loading'
import Empty from '@/components/Empty'
import { getCourses, getCourseTags } from '@/services/course'
import styles from './index.module.scss'

function CourseList() {
  const [tags, setTags] = useState([{ key: '', name: '全部' }])
  const [activeIndex, setActiveIndex] = useState(0)
  const [courses, setCourses] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // 加载标签
  useEffect(() => {
    const loadTags = async () => {
      try {
        const res = await getCourseTags()
        if (res.success && res.data) {
          const tagList = [{ key: '', name: '全部' }]
          res.data.forEach(item => {
            tagList.push({
              key: item.primaryTag,
              name: item.primaryName
            })
          })
          setTags(tagList)
        }
      } catch (err) {
        console.error('加载标签失败:', err)
      }
    }
    loadTags()
  }, [])

  // 加载课程列表
  const loadCourses = useCallback(async (pageNum = 1, tag = '') => {
    if (pageNum === 1) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const res = await getCourses({
        page: pageNum,
        size: 10,
        primaryTag: tag
      })

      if (res.success && res.data) {
        const { items, hasNext } = res.data
        if (pageNum === 1) {
          setCourses(items || [])
        } else {
          setCourses(prev => [...prev, ...(items || [])])
        }
        setHasMore(hasNext)
        setPage(pageNum)
      }
    } catch (err) {
      console.error('加载课程失败:', err)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  // 初始加载和标签切换
  useEffect(() => {
    const tag = tags[activeIndex]?.key || ''
    loadCourses(1, tag)
  }, [activeIndex, tags, loadCourses])

  // 标签切换
  const handleTagChange = (index) => {
    setActiveIndex(index)
    setPage(1)
    setCourses([])
  }

  // 加载更多
  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore) return
    const tag = tags[activeIndex]?.key || ''
    loadCourses(page + 1, tag)
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
        <h1 className={styles.title}>课程</h1>
      </div>

      <TagFilter
        tags={tags}
        activeIndex={activeIndex}
        onChange={handleTagChange}
      />

      <div className={styles.list}>
        {isLoading ? (
          <Loading />
        ) : courses.length === 0 ? (
          <Empty text="暂无课程" />
        ) : (
          <>
            {courses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
            {isLoadingMore && <Loading text="加载更多..." />}
            {!hasMore && courses.length > 0 && (
              <div className={styles.noMore}>没有更多了</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CourseList
