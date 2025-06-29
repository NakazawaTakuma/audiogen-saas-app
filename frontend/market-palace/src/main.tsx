import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App";
import HomePage from "./pages/HomePage";
import PasswordResetConfirmPage from "./pages/PasswordResetConfirmPage";
import PricingPage from "./pages/PricingPage";
import DocsPage from "./pages/DocsPage";
import MyPage from "./pages/MyPage";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<HomePage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="docs" element={<DocsPage />} />
        <Route path="mypage" element={<MyPage />} />
        <Route path="reset-password" element={<PasswordResetConfirmPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
