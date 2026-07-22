import { Navigate, Outlet, useLocation } from "react-router-dom";

/**
 * ProtectedRoute Guard
 * @param {Array<string>} allowedRoles - Array of roles permitted to access this route (e.g., ['admin', 'staff'])
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const location = useLocation();

  // 1. If not authenticated at all, redirect to login
  // We save the current location in state so we can redirect them back after they log in
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. If a specific set of roles is required but the user's role isn't in it
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Dynamic fallback redirection based on their actual clearance level
    const defaultRedirect = (role === "admin" || role === "staff") 
      ? "/admin/dashboard" 
      : "/dashboard";

    return <Navigate to={defaultRedirect} replace />;
  }

  // 3. Authorized - Render the child components (via react-router's Outlet)
  return <Outlet />;
};

export default ProtectedRoute;