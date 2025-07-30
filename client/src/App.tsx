import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import DocsPage from "@/pages/docs";
import PricingPage from "@/pages/pricing";
import BlogPage from "@/pages/blog";
import AboutPage from "@/pages/about";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import RoomDetailPage from "@/pages/room-detail";
import AuthSuccessPage from "@/pages/auth-success"; // New Import

import DefaultLayout from "@/layouts/default"; // <--- Import DefaultLayout

function App() {
  return (
    <Routes>
      {/* Routes that use the DefaultLayout (Navbar, Footer) */}
      <Route element={<DefaultLayout />}> {/* <--- Parent Route for DefaultLayout */}
        <Route element={<IndexPage />} path="/" />
        <Route element={<DocsPage />} path="/docs" />
        <Route element={<PricingPage />} path="/pricing" />
        <Route element={<BlogPage />} path="/blog" />
        <Route element={<AboutPage />} path="/about" />
        <Route element={<LoginPage />} path="/login" /> {/* Now wrapped by DefaultLayout */}
        <Route element={<RegisterPage />} path="/register" /> {/* Now wrapped by DefaultLayout */}
        <Route element={<RoomDetailPage />} path="/rooms/:id" /> {/* Now wrapped by DefaultLayout */}
        {/* Add more routes like /dashboard, /profile, /create-listing here */}
      </Route>

      {/* Routes that do NOT use the DefaultLayout (e.g., if you want a blank page) */}
      {/* AuthSuccessPage is often kept without a full layout as it's a transient redirect page */}
      <Route element={<AuthSuccessPage />} path="/auth/success" />

    </Routes>
  );
}

export default App;