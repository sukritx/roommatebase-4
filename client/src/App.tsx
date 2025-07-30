import { Route, Routes } from "react-router-dom";

import IndexPage from "@/pages/index";
import DocsPage from "@/pages/docs";
import PricingPage from "@/pages/pricing";
import BlogPage from "@/pages/blog";
import AboutPage from "@/pages/about";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import RoomDetailPage from "@/pages/room-detail";
import AuthSuccessPage from "@/pages/auth-success";
import BrowseRoomsPage from "@/pages/browse-rooms";
import DashboardPage from "@/pages/dashboard"; // <--- NEW IMPORT

import DefaultLayout from "@/layouts/default";

function App() {
  return (
    <Routes>
      <Route element={<DefaultLayout />}>
        <Route element={<IndexPage />} path="/" />
        <Route element={<DocsPage />} path="/docs" />
        <Route element={<PricingPage />} path="/pricing" />
        <Route element={<BlogPage />} path="/blog" />
        <Route element={<AboutPage />} path="/about" />
        <Route element={<LoginPage />} path="/login" />
        <Route element={<RegisterPage />} path="/register" />
        <Route element={<RoomDetailPage />} path="/rooms/:id" />
        <Route element={<BrowseRoomsPage />} path="/browse" />
        <Route element={<DashboardPage />} path="/dashboard" /> {/* <--- NEW ROUTE */}
      </Route>

      <Route element={<AuthSuccessPage />} path="/auth/success" />
    </Routes>
  );
}

export default App;