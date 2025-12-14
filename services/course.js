// services/course.js
const { get, post } = require('./request')

/**
 * 获取课程详情
 * @param {number} courseId 课程ID
 */
const getCourseDetail = (courseId) => {
  return get(`/api/courses/${courseId}`)
}

/**
 * 通过章节ID获取课程详情
 * @param {number} sectionId 章节ID
 */
const getCourseBySection = (sectionId) => {
  return get(`/api/courses/by-section/${sectionId}`)
}

/**
 * 获取课程列表
 * @param {object} params 筛选参数
 */
const getCourseList = (params = {}) => {
  return get('/api/courses', params)
}

/**
 * 获取课程标签
 */
const getCourseTags = () => {
  return get('/api/course-tags')
}

/**
 * 报名课程
 * @param {number} courseId 课程ID
 */
const enrollCourse = (courseId) => {
  return post(`/api/courses/${courseId}/enrollments`)
}

/**
 * 获取报名状态
 * @param {number} courseId 课程ID
 */
const getEnrollmentStatus = (courseId) => {
  return get(`/api/courses/${courseId}/enrollments/me`)
}

/**
 * 更新学习进度
 * @param {number} courseId 课程ID
 * @param {number} progress 进度 0-100
 */
const updateProgress = (courseId, progress) => {
  return post(`/api/courses/${courseId}/enrollments/progress/update`, { progress })
}

module.exports = {
  getCourseDetail,
  getCourseBySection,
  getCourseList,
  getCourseTags,
  enrollCourse,
  getEnrollmentStatus,
  updateProgress
}
