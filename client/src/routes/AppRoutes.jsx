import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '../features/LoginPage';
import Register from '../features/RegisterPage';
import BoardPage from '../features/BoardPage';
import ProtectedRoute from '../components/ProtectedRoute';
import MainLayout from '../components/layout/MainLayout';
function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="home" element={<BoardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
export default AppRoutes