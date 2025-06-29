import { Outlet, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthProvider";
import AuthModal from "./components/auth/organisms/AuthModal/AuthModal";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const location = useLocation();
  return (
    <div className="app-container min-h-screen flex flex-col bg-gradient-to-b from-white to-slate-100">
      <AuthModal />
      <Outlet key={location.pathname} />
    </div>
  );
}

export default App;
