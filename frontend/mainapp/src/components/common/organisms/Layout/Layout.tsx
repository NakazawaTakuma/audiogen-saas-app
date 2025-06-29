import React from "react";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    // <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-100">
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        // background: "#f5f5f5",
        background:
          "radial-gradient(circle at 60% 40%,rgb(248, 242, 231) 0%, transparent 70%), radial-gradient(circle at 30% 70%,rgb(224, 249, 250) 0%, transparent 70%)",
      }}
    >
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
