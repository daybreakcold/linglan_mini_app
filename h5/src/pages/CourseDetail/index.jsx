import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import Loading from '@/components/Loading'
import { getCourseDetail, enrollCourse, getEnrollmentStatus, updateProgress } from '@/services/course'
import { getTagName } from '@/utils/constants'
import styles from './index.module.scss'

function CourseDetail() {
  const { id } = useParams()
  const videoRef = useRef(null)

  const [course, setCourse] = useState(null)
  const [sections, setSections] = useState([])
  const [currentSection, setCurrentSection] = useState(null)
  const [enrollment, setEnrollment] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEnrolling, setIsEnrolling] = useState(false)

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
          const firstVideo = sectionList.find(s => s.type === 'VIDEO')
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
    setCurrentSection(section)
    if (section.type === 'VIDEO' && videoRef.current) {
      videoRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // 视频播放结束
  const handleVideoEnded = async () => {
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

  if (isLoading) {
    return <Loading />
  }

  if (!course) {
    return <div className={styles.error}>课程不存在</div>
  }

  return (
    <div className={styles.page}>
      {/* 视频播放区 */}
      <div className={styles.videoSection} ref={videoRef}>
        {currentSection?.type === 'VIDEO' && currentSection?.videoUrl ? (
          <video
            className={styles.video}
            src={currentSection.videoUrl}
            controls
            poster={course.coverUrl}
            onEnded={handleVideoEnded}
          />
        ) : (
          <div className={styles.videoCover}>
            <img src={course.coverUrl} alt="" />
          </div>
        )}
      </div>

      {/* 课程信息 */}
      <div className={styles.courseInfo}>
        <h1 className={styles.title}>{course.title}</h1>
        <div className={styles.tags}>
          {course.primaryTag && (
            <span className={styles.tag}>{getTagName(course.primaryTag)}</span>
          )}
          {course.secondaryTag && (
            <span className={styles.tag}>{getTagName(course.secondaryTag)}</span>
          )}
        </div>
        <p className={styles.description}>{course.description}</p>

        {/* 学习进度 */}
        {enrollment?.enrolled && (
          <div className={styles.progress}>
            <span>学习进度</span>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${enrollment.progress || 0}%` }}
              />
            </div>
            <span>{enrollment.progress || 0}%</span>
          </div>
        )}
      </div>

      {/* 章节列表 */}
      <div className={styles.sectionList}>
        <h2 className={styles.sectionTitle}>课程目录</h2>
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`${styles.sectionItem} ${currentSection?.id === section.id ? styles.active : ''}`}
            onClick={() => handleSectionClick(section)}
          >
            <div className={styles.sectionIndex}>{index + 1}</div>
            <div className={styles.sectionContent}>
              <div className={styles.sectionName}>{section.title}</div>
              <div className={styles.sectionMeta}>
                <span className={styles.sectionType}>
                  {section.type === 'VIDEO' ? '视频' : '文章'}
                </span>
                {section.duration && <span>{section.duration}</span>}
              </div>
            </div>
            {section.type === 'VIDEO' && (
              <svg viewBox="0 0 24 24" width="20" height="20" className={styles.playIcon}>
                <path fill="currentColor" d="M8 5v14l11-7z"/>
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* 底部操作栏 */}
      <div className={styles.bottomBar}>
        {enrollment?.enrolled ? (
          <button className={styles.continueBtn}>
            继续学习
          </button>
        ) : (
          <button
            className={styles.enrollBtn}
            onClick={handleEnroll}
            disabled={isEnrolling}
          >
            {isEnrolling ? '报名中...' : (course.price === 0 ? '免费报名' : `¥${course.price} 立即报名`)}
          </button>
        )}
      </div>
    </div>
  )
}

export default CourseDetail
