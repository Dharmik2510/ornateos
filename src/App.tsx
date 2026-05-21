import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { InputPage } from './pages/InputPage'
import { MakerDetailPage } from './pages/MakerDetailPage'
import { MakersPage } from './pages/MakersPage'
import { OrdersPage } from './pages/OrdersPage'
import { PreviewPage } from './pages/PreviewPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<InputPage />} />
          <Route path="preview" element={<PreviewPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="makers" element={<MakersPage />} />
          <Route path="makers/:makerId" element={<MakerDetailPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
