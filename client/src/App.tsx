import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import DocsPage from "@/pages/docs";
import PricingPage from "@/pages/pricing";
import BlogPage from "@/pages/blog";
import AboutPage from "@/pages/about";
import LoginPage from "@/pages/login"; // New
import RegisterPage from "@/pages/register"; // New
import RoomDetailPage from "@/pages/room-detail"; // New

function App() {
  return (
    <Routes>
      <Route element={<IndexPage />} path="/" />
      <Route element={<DocsPage />} path="/docs" />
      <Route element={<PricingPage />} path="/pricing" />
      <Route element={<BlogPage />} path="/blog" />
      <Route element={<AboutPage />} path="/about" />
      <Route element={<LoginPage />} path="/login" /> {/* New */}
      <Route element={<RegisterPage />} path="/register" /> {/* New */}
      <Route element={<RoomDetailPage />} path="/rooms/:id" /> {/* New */}
      {/* Add more routes like /dashboard, /profile, /create-listing later */}
    </Routes>
  );
}

export default App;