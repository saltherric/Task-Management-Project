import { Navigate } from "react-router-dom";
import { getAuthToken } from "../helpers/auth";

function ProtectedRoute({ children }) {
  const token = getAuthToken();

  return token ? children : <Navigate to="/login" replace />;
}

export default ProtectedRoute;