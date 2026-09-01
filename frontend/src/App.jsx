import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Home";
import Dashboard from "./pages/MainDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Empower from "./pages/Empower";
import DeanAchievements from "./pages/DeanAchievements";
import InformationUnitDashboard from "./pages/InformationUnitDashboard";

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
