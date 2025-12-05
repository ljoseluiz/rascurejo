import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import Header from './components/Header'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />

        <main style={{ marginTop: 20 }}>
          <AppRoutes />
        </main>
      </div>
    </BrowserRouter>
  )
}
