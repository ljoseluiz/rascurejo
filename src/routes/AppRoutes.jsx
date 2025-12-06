import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import Products from '../pages/Products'
import ProductsAdvanced from '../pages/ProductsAdvanced'
import ProductNew from '../pages/ProductNew'
import ProductDetail from '../pages/ProductDetail'
import Inventory from '../pages/Inventory'
import StockMovements from '../pages/StockMovements'
import StockLevels from '../pages/StockLevels'
import StockReports from '../pages/StockReports'
import Sales from '../pages/Sales'
import Reports from '../pages/Reports'
import Settings from '../pages/Settings'
import AccountsPayable from '../pages/AccountsPayable'
import AccountsReceivable from '../pages/AccountsReceivable'
import CashBox from '../pages/CashBox'
import CashFlow from '../pages/CashFlow'
import FinancialReports from '../pages/FinancialReports'
import FinancialDashboard from '../pages/FinancialDashboard'
import NotFound from '../pages/NotFound'
import Login from '../pages/Login'
import Logout from '../pages/Logout'
import RequireAuth from './RequireAuth'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products-advanced" element={<RequireAuth><ProductsAdvanced /></RequireAuth>} />
      <Route path="/products/new" element={<RequireAuth><ProductNew /></RequireAuth>} />
      <Route path="/products/:id" element={<RequireAuth><ProductDetail /></RequireAuth>} />
      <Route path="/inventory" element={<RequireAuth><Inventory /></RequireAuth>} />
      <Route path="/stock/movements" element={<RequireAuth><StockMovements /></RequireAuth>} />
      <Route path="/stock/levels" element={<RequireAuth><StockLevels /></RequireAuth>} />
      <Route path="/stock/reports" element={<RequireAuth><StockReports /></RequireAuth>} />
      <Route path="/sales" element={<RequireAuth><Sales /></RequireAuth>} />
      <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
      <Route path="/financial" element={<RequireAuth><FinancialDashboard /></RequireAuth>} />
      <Route path="/financial/accounts-payable" element={<RequireAuth><AccountsPayable /></RequireAuth>} />
      <Route path="/financial/accounts-receivable" element={<RequireAuth><AccountsReceivable /></RequireAuth>} />
      <Route path="/financial/cash-box" element={<RequireAuth><CashBox /></RequireAuth>} />
      <Route path="/financial/cash-flow" element={<RequireAuth><CashFlow /></RequireAuth>} />
      <Route path="/financial/reports" element={<RequireAuth><FinancialReports /></RequireAuth>} />
      <Route path="/login" element={<Login />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
