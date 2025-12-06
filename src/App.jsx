import React, { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes/AppRoutes'
import Header from './layouts/Header'
import Sidebar from './layouts/Sidebar'

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <BrowserRouter>
      <div className="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

        <main style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 0, height: '100%' }}>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div style={{ flex: 1, overflow: 'auto' }}>
              <AppRoutes />
            </div>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}
