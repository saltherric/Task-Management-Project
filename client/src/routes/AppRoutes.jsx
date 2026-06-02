import React from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Login from '../features/LoginPage';
import Register from '../features/RegisterPage';
import BoardPage from '../features/BoardPage';
import ProtectedRoute from '../components/ProtectedRoute'
function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={
          <ProtectedRoute>
            <BoardPage />
          </ProtectedRoute>
        }/>
      </Routes>
    </BrowserRouter>
  )
}
export default AppRoutes