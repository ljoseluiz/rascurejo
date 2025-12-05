import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import Products from '../pages/Products'
import Inventory from '../pages/Inventory'
import Sales from '../pages/Sales'
import NotFound from '../pages/NotFound'
import Login from '../pages/Login'
import Logout from '../pages/Logout'
import RequireAuth from './RequireAuth'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/products" element={<Products />} />
      <Route path="/inventory" element={<RequireAuth><Inventory /></RequireAuth>} />
      <Route path="/sales" element={<RequireAuth><Sales /></RequireAuth>} />
      <Route path="/login" element={<Login />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
