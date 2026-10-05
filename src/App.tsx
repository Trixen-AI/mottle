import { lazy, Suspense } from 'react'
import { Link, Route, Routes } from 'react-router'
import HomePage from '@/pages/HomePage'

// The dashboard and pay page carry the wallet + Solana code, so they load only when visited
const DashboardRoot = lazy(() => import('@/dashboard/DashboardRoot'))
const PayRoot = lazy(() => import('@/dashboard/PayRoot'))

function Boot() {
  return <div className="boot" role="status" aria-label="Loading" />
}

function NotFound() {
  return (
    <div className="not-found">
      <h1>Nothing here</h1>
      <p>This page does not exist.</p>
      <Link to="/">Back to Mottle</Link>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<Boot />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/app/*" element={<DashboardRoot />} />
        <Route path="/pay" element={<PayRoot />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
