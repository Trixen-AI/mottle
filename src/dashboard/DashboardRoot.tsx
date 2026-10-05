import { lazy, Suspense, type ReactElement } from 'react'
import { Route, Routes } from 'react-router'
import { Providers } from './Providers'
import { DashboardShell } from './components/Shell'
import { Loading } from './components/ui'
import Overview from './pages/Overview'

// Overview loads with the shell; the other pages load when first opened
const Send = lazy(() => import('./pages/Send'))
const Receive = lazy(() => import('./pages/Receive'))
const Activity = lazy(() => import('./pages/Activity'))
const Disclosure = lazy(() => import('./pages/Disclosure'))
const Exposure = lazy(() => import('./pages/Exposure'))

const page = (el: ReactElement) => <Suspense fallback={<Loading label="Loading" />}>{el}</Suspense>

export default function DashboardRoot() {
  return (
    <Providers>
      <Routes>
        <Route element={<DashboardShell />}>
          <Route index element={<Overview />} />
          <Route path="send" element={page(<Send />)} />
          <Route path="receive" element={page(<Receive />)} />
          <Route path="activity" element={page(<Activity />)} />
          <Route path="disclosure" element={page(<Disclosure />)} />
          <Route path="exposure" element={page(<Exposure />)} />
        </Route>
      </Routes>
    </Providers>
  )
}
