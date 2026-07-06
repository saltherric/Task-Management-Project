import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../features/LoginPage";
import Register from "../features/RegisterPage";
import VerifyEmailPage from "../features/VerifyEmailPage";
import ResendVerificationPage from "../features/ResendVerificationPage";
import Dashboard from "../features/Dashboard";
import InvitePage from "../features/InvitePage";

import ProtectedRoute from "../components/ProtectedRoute";
import MainLayout from "../components/layout/MainLayout";
import BoardView from "../components/board/BoardView";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/api/auth/verify-email" element={<VerifyEmailPage />} />
        <Route path="/resend-verification" element={<ResendVerificationPage />} />

        {/* Invite Route (Public) */}
        <Route
          path="/invite/:token"
          element={<InvitePage />}
        />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<Dashboard />} />

          <Route
            path="/workspaces/:workspaceId"
            element={<Dashboard />}
          />

          <Route
            path="/workspaces/:workspaceId/projects/:projectId"
            element={<BoardView />}
          />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;