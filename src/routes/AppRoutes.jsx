import React from 'react'
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Login from '../features/auth/Login';
import Register from '../features/auth/Register';
import TaskPage from '../features/tasks/TaskPage';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<TaskPage />} />
      </Routes>
    </BrowserRouter>
  )
}
export default AppRoutes