import React from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Login from '../features/auth/Login';
import Register from '../features/auth/Register';
import TaskPage from '../features/tasks/TaskPage';
import ProtectedRoute from '../features/auth/ProtectedRoute';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute>
            <TaskPage />
          </ProtectedRoute>
        }/>
      </Routes>
    </BrowserRouter>
  )
}
export default AppRoutes