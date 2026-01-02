import "./App.css";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import History from "./pages/History";
import Dashboard from "./pages/Dashboard";
import Header from "./components/Header";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Toast from "./components/common/Toast";

function App() {
  return (
    <Router>
      <Toast />
      <Routes>
        <Route element={<Header />}>
          <Route path="/" element={<Home />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/history" element={<History />}>
              <Route path=":projectId" element={<History />} />
              <Route path=":projectId/:type/:id" element={<History />} />
            </Route>
          </Route>
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;

