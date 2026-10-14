import { Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import PropertySearchPage from "./pages/PropertySearchPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import RegisterPropertyPage from "./pages/RegisterPropertyPage";
import TransferOwnershipPage from "./pages/TransferOwnershipPage";
import TransactionHistoryPage from "./pages/TransactionHistoryPage";
import DocumentVerificationPage from "./pages/DocumentVerificationPage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login";

  return (
    <div className="app-layout">
      {!isAuthPage && <Navbar />}
      <main className={`main-content ${isAuthPage ? "auth-full" : ""}`}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/properties" element={<PropertySearchPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />
          <Route path="/register" element={<RegisterPropertyPage />} />
          <Route path="/transfer" element={<TransferOwnershipPage />} />
          <Route path="/history" element={<TransactionHistoryPage />} />
          <Route path="/verify" element={<DocumentVerificationPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  );
}
