/*
  WHY THIS FILE EXISTS:
  App.tsx defines the route structure using React Router v6. It is kept
  minimal — just routes and layouts. All page content lives in src/pages/.

  DetailModal is rendered here (outside Routes) so it is always mounted and
  can open regardless of which route is active. It reads from ModalContext
  which wraps the whole app in main.tsx.

  As the app grows, add new <Route> entries here. Do not put data fetching,
  state, or business logic in this file.
*/

import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'
import { DetailModal } from './components/features/DetailModal'

export function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomePage />} />
        {/* Catch-all: unknown paths redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* DetailModal lives outside Routes so it works on any page */}
      <DetailModal />
    </>
  )
}
