import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Loading from '@/components/Loading'
import { getCourseDetail, enrollCourse, getEnrollmentStatus, updateProgress } from '@/services/course'
import styles from './index.module.scss'

// SVG 图标组件
const ArrowBackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const PlayCircleIcon = ({ size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
    <circle cx="40" cy="40" r="36" fill="white" fillOpacity="0.9"/>
    <path d="M32 26L56 40L32 54V26Z" fill="#333"/>
  </svg>
)

const FullscreenIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M4 4H9V6H6V9H4V4ZM4 15H6V18H9V20H4V15ZM15 4H20V9H18V6H15V4ZM18 18V15H20V20H15V18H18Z" fill="white"/>
  </svg>
)

const VisibilityIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="#999"/>
  </svg>
)

const StarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#FFB800"/>
  </svg>
)

const VideoCameraIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M18 10.48V6C18 4.9 17.1 4 16 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H16C17.1 20 18 19.1 18 18V13.52L22 17.5V6.5L18 10.48ZM16 18H4V6H16V18ZM10 8H8V11H5V13H8V16H10V13H13V11H10V8Z" fill="#119c59"/>
  </svg>
)

const BookRibbonIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M17 3H7C5.9 3 5 3.9 5 5V21L12 18L19 21V5C19 3.9 18.1 3 17 3ZM17 18L12 15.82L7 18V5H17V18Z" fill="#119c59"/>
  </svg>
)

const PlayButtonIcon = ({ size = 40, active = false }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="18" stroke={active ? "#119c59" : "#ccc"} strokeWidth="2" fill="none"/>
    <path d="M16 13L28 20L16 27V13Z" fill={active ? "#119c59" : "#ccc"}/>
  </svg>
)

// 图文文档图标
const ArticleIcon = ({ size = 40, active = false }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <rect x="10" y="6" width="20" height="28" rx="2" stroke={active ? "#119c59" : "#ccc"} strokeWidth="2" fill="none"/>
    <line x1="14" y1="14" x2="26" y2="14" stroke={active ? "#119c59" : "#ccc"} strokeWidth="2" strokeLinecap="round"/>
    <line x1="14" y1="20" x2="26" y2="20" stroke={active ? "#119c59" : "#ccc"} strokeWidth="2" strokeLinecap="round"/>
    <line x1="14" y1="26" x2="22" y2="26" stroke={active ? "#119c59" : "#ccc"} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const videoRef = useRef(null)

  const [course, setCourse] = useState(null)
  const [sections, setSections] = useState([])
  const [currentSection, setCurrentSection] = useState(null)
  const [enrollment, setEnrollment] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // 加载课程详情
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [courseRes, enrollRes] = await Promise.all([
          getCourseDetail(id),
          getEnrollmentStatus(id).catch(() => ({ data: null }))
        ])

        if (courseRes.success && courseRes.data) {
          setCourse(courseRes.data)
          const sectionList = courseRes.data.sections || []
          setSections(sectionList)
          // 默认选中第一个视频章节
          const firstVideo = sectionList.find(s => s.contentType === 'VIDEO')
          if (firstVideo) {
            setCurrentSection(firstVideo)
          }
        }

        if (enrollRes.data) {
          setEnrollment(enrollRes.data)
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

  // 报名课程
  const handleEnroll = async () => {
    if (isEnrolling) return
    setIsEnrolling(true)
    try {
      const res = await enrollCourse(id)
      if (res.success) {
        setEnrollment({ enrolled: true, progress: 0 })
      }
    } catch (err) {
      console.error('报名失败:', err)
    } finally {
      setIsEnrolling(false)
    }
  }

  // 切换章节
  const handleSectionClick = (section) => {
    // 图文类型跳转到科普详情页面
    if (section.contentType === 'ARTICLE' && section.article?.id) {
      navigate(`/articles/${section.article.id}`)
      return
    }
    
    // 视频类型切换当前章节
    setCurrentSection(section)
    if (videoRef.current) {
      videoRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // 播放视频
  const handlePlayClick = () => {
    if (currentSection?.contentType === 'VIDEO' && videoRef.current) {
      const video = videoRef.current.querySelector('video')
      if (video) {
        video.play()
        setIsPlaying(true)
      }
    }
  }

  // 视频播放结束
  const handleVideoEnded = async () => {
    setIsPlaying(false)
    if (!enrollment?.enrolled) return
    try {
      const currentIndex = sections.findIndex(s => s.id === currentSection?.id)
      const progress = Math.min(100, Math.round(((currentIndex + 1) / sections.length) * 100))
      await updateProgress(id, progress)
      setEnrollment(prev => ({ ...prev, progress }))
    } catch (err) {
      console.error('更新进度失败:', err)
    }
  }

  // 返回上一页
  const handleBack = () => {
    navigate(-1)
  }

  // 统计视频和图文数量
  const videoCount = sections.filter(s => s.contentType === 'VIDEO').length
  const articleCount = sections.filter(s => s.contentType === 'ARTICLE').length

  if (isLoading) {
    return <Loading />
  }

  if (!course) {
    return <div className={styles.error}>课程不存在</div>
  }

  return (
    <div className={styles.page}>
      {/* 顶部导航栏 - 小程序 webview 中由原生提供，暂时注释 */}
      {/* <div className={styles.navbar}>
        <div className={styles.backBtn} onClick={handleBack}>
          <ArrowBackIcon />
        </div>
        <span className={styles.navTitle}>灵壹健康好课</span>
        <div className={styles.placeholder} />
      </div> */}

      {/* 视频/封面展示区 */}
      <div className={styles.videoSection} ref={videoRef}>
        {currentSection?.contentType === 'VIDEO' && currentSection?.video?.url ? (
          <>
            <video
              className={styles.video}
              src={currentSection.video?.url}
              controls={isPlaying}
              poster={course.coverUrl}
              onEnded={handleVideoEnded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {!isPlaying && (
              <div className={styles.playOverlay} onClick={handlePlayClick}>
                <PlayCircleIcon />
              </div>
            )}
            <div className={styles.fullscreenBtn}>
              <FullscreenIcon />
            </div>
          </>
        ) : (
          <div className={styles.videoCover}>
            <img src={course.coverUrl} alt="" />
          </div>
        )}
      </div>

      {/* 课程价格信息 */}
      <div className={styles.priceSection}>
        <div className={styles.priceTag}>
          {course.price === 0 ? '会员免费' : `¥${course.price}`}
        </div>
        <div className={styles.statsGroup}>
          <div className={styles.statItem}>
            <VisibilityIcon />
            <span>{course.viewCount || 940}</span>
          </div>
          <div className={styles.statItem}>
            <StarIcon />
            <span>{course.rating || 4.5}</span>
          </div>
        </div>
      </div>

      {/* 课程标题信息 */}
      <div className={styles.titleSection}>
        <h1 className={styles.title}>{course.title}</h1>
        <p className={styles.subtitle}>{course.description}</p>
      </div>

      {/* 本课程包含 */}
      <div className={styles.includesSection}>
        <h2 className={styles.sectionTitle}>本课程包含</h2>
        <div className={styles.includesList}>
          {videoCount > 0 && (
            <div className={styles.includeItem}>
              <VideoCameraIcon />
              <span>{videoCount}节课程</span>
            </div>
          )}
          {articleCount > 0 && (
            <div className={styles.includeItem}>
              <BookRibbonIcon />
              <span>{articleCount}篇图文内容</span>
            </div>
          )}
        </div>
      </div>

      {/* 课程详情 - 章节列表 */}
      <div className={styles.detailsSection}>
        <h2 className={styles.sectionTitle}>课程详情</h2>
        <div className={styles.lessonList}>
          {sections.map((section, index) => (
            <div
              key={section.id}
              className={`${styles.lessonItem} ${currentSection?.id === section.id ? styles.active : ''}`}
              onClick={() => handleSectionClick(section)}
            >
              <div className={styles.lessonInfo}>
                <div className={styles.lessonTitle}>
                  第{String(index + 1).padStart(2, '0')}课 {section.title}
                </div>
                <div className={styles.lessonMeta}>
                  <span className={styles.lessonType}>
                    [{section.contentType === 'VIDEO' ? '视频' : '图文'}]
                  </span>
                  <span className={styles.lessonDuration}>
                    {section.duration ? `${section.duration}分钟` : '10分钟'}
                  </span>
                </div>
              </div>
              <div className={styles.lessonActions}>
                {section.preview && (
                  <span className={styles.previewTag}>试看</span>
                )}
                {section.contentType === 'VIDEO' ? (
                  <PlayButtonIcon active={currentSection?.id === section.id || section.preview} />
                ) : (
                  <ArticleIcon active={currentSection?.id === section.id || section.preview} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部安全区 */}
      <div className={styles.safeArea} />
    </div>
  )
}

export default CourseDetail
