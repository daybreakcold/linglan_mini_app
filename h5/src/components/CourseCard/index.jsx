import { useNavigate } from 'react-router-dom'
import { getTagName } from '@/utils/constants'
import styles from './index.module.scss'

function CourseCard({ course }) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/courses/${course.id}`)
  }

  return (
    <div className={styles.card} onClick={handleClick}>
      <div className={styles.coverWrap}>
        <img src={course.coverUrl} alt="" className={styles.cover} />
        {course.totalDuration && (
          <span className={styles.duration}>{course.totalDuration}</span>
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{course.title}</h3>
        <div className={styles.tags}>
          {course.primaryTag && (
            <span className={styles.tag}>{getTagName(course.primaryTag)}</span>
          )}
          {course.secondaryTag && (
            <span className={styles.tag}>{getTagName(course.secondaryTag)}</span>
          )}
        </div>
        <div className={styles.footer}>
          <div className={styles.instructor}>
            {course.instructorAvatar && (
              <img src={course.instructorAvatar} alt="" className={styles.avatar} />
            )}
            <span>{course.instructorName || '灵医生'}</span>
          </div>
          {course.price !== undefined && (
            <span className={styles.price}>
              {course.price === 0 ? '免费' : `¥${course.price}`}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseCard
