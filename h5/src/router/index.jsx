import { lazy } from 'react'

const ArticleList = lazy(() => import('@/pages/ArticleList'))
const ArticleDetail = lazy(() => import('@/pages/ArticleDetail'))
const CourseList = lazy(() => import('@/pages/CourseList'))
const CourseDetail = lazy(() => import('@/pages/CourseDetail'))
const InquiryChat = lazy(() => import('@/pages/InquiryChat'))
const Agreement = lazy(() => import('@/pages/Agreement'))

const routes = [
  {
    path: '/',
    element: <ArticleList />
  },
  {
    path: '/articles',
    element: <ArticleList />
  },
  {
    path: '/articles/:id',
    element: <ArticleDetail />
  },
  {
    path: '/courses',
    element: <CourseList />
  },
  {
    path: '/courses/:id',
    element: <CourseDetail />
  },
  {
    path: '/chat',
    element: <InquiryChat />
  },
  {
    path: '/chat/:templateId',
    element: <InquiryChat />
  },
  {
    path: '/agreement',
    element: <Agreement />
  },
  {
    path: '/agreement/:type',
    element: <Agreement />
  }
]

export default routes
