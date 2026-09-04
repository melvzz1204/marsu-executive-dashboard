import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Login from "./pages/Home";
import Dashboard from "./pages/MainDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Empower from "./pages/Empower";
import DeanAchievements from "./pages/DeanAchievements";
import InformationUnitDashboard from "./pages/InformationUnitDashboard";
import FloatingChatbot from "./components/Empower/FloatingChatbot";

function AppContent() {
  const location = useLocation();
  const showFloatingChatbot = location.pathname === "/dashboard";

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/empower-to-achieve" element={<Empower />} />
        <Route path="/dean-achievements" element={<DeanAchievements />} />
        <Route
          path="/information-unit"
          element={<InformationUnitDashboard />}
        />
      </Routes>
      {/* Keep the assistant scoped to the authenticated executive dashboard. */}
      {showFloatingChatbot && <FloatingChatbot />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
