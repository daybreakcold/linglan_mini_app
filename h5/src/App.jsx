import { Suspense } from 'react'
import { useRoutes } from 'react-router-dom'
import routes from './router'
import Loading from './components/Loading'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const element = useRoutes(routes)

  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        {element}
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
