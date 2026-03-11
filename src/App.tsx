/*
  WHY THIS FILE EXISTS:
  App.tsx defines the route structure using React Router v6. It is kept
  minimal — just routes and layouts. All page content lives in src/pages/.

  As the app grows, add new <Route> entries here. Do not put data fetching,
  state, or business logic in this file.
*/

import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { HomePage } from './pages/HomePage'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomePage />} />
      {/* Catch-all: unknown paths redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
