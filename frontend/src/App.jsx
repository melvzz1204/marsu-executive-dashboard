import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Login from "./pages/Home";
import Dashboard from "./pages/MainDashboard";
import AdminDashboard from "./pages/AdminDashboard";

/**
 * Enhanced ProtectedRoute Guard with Debug Telemetry
 * Verifies authentication token and strictly enforces role-based clearance.
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // =========================================================================
  // DEBUGGING TELEMETRY LOGS
  // Open your browser Console (F12) to inspect these values when testing!
  // =========================================================================
  console.log("=== [ROUTE GUARD DIAGNOSTICS] ===");
  console.log("👉 Has Token Exist?:", token ? "✅ True (Valid String)" : "❌ False (Missing/Null)");
  console.log("👉 Role Found in Storage:", role ? `"${role}"` : "❌ Missing/Null");
  console.log("👉 Roles Allowed for Target Route:", allowedRoles);
  console.log("👉 Match Status:", allowedRoles.includes(role) ? "✅ Clear" : "❌ Rejected");
  console.log("=================================");

  // 1. If not logged in at all, redirect to the login gateway
  if (!token) {
    console.warn("Route Guard Action: Token missing. Redirecting to Entry Gateway (/).");
    return <Navigate to="/" replace />;
  }

  // 2. If the user's role is not explicitly authorized for this route group
  if (allowedRoles && !allowedRoles.includes(role)) {
    console.warn(`Route Guard Action: Clearance mismatch. Role "${role}" not allowed here.`);

    // If an admin/staff tries to access executive pages, send them to the admin portal
    if ((role === "admin" || role === "staff") && allowedRoles.includes("executive")) {
      console.log("Redirecting Admin/Staff down route: /admin/dashboard");
      return <Navigate to="/admin/dashboard" replace />;
    }
    
    // If an executive/dean/higher-up tries to access admin pages, send them to the executive dashboard
    if ((role === "executive" || role === "dean" || role === "higher-up") && allowedRoles.includes("admin")) {
      console.log("Redirecting Executive/Dean down route: /dashboard");
      return <Navigate to="/dashboard" replace />;
    }

    // Crucial Fallback: If the role is unmapped or corrupted, clear credentials to avoid a perpetual loop
    console.error("Critical: Unrecognized or misconfigured role string detected. Purging local state to halt loop.");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    return <Navigate to="/" replace />;
  }

  // 3. Authorized - render nested children route views
  console.log("Route Guard Action: Access Approved. Rendering child view components.");
  return <Outlet />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Entrance Gateway */}
        <Route path="/" element={<Login />} />

        {/* ================= SECURED STRATEGIC/EXECUTIVE DASHBOARD ================= */}
        {/* Only Deans, Executives, and Higher Ups are allowed access here */}
        <Route element={<ProtectedRoute allowedRoles={["executive", "dean", "higher-up"]} />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* ================= SECURED SYSTEM ADMIN / REGISTRAR CONSOLE ================= */}
        {/* Only Admins and Registrar Staff can access file ingestion and system controls */}
        <Route element={<ProtectedRoute allowedRoles={["admin", "staff"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        {/* Catch-all fallback route to safely handle broken/unauthorized layout links */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;