import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Home";
import Dashboard from "./pages/MainDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Empower from "./pages/Empower";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/empower-to-achieve" element={<Empower />} />
      </Routes>
    </Router>
  );
}

export default App;
