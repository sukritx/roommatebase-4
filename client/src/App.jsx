// App.jsx - Main Application Entry Point
// Organizes routing, authentication, and layout using shadcn/ui and React Router

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";

// Page Components
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import Profile from "./pages/Profile";

// Components moved to src/components/
import Home from "./components/Home";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfileWithLogout from "./components/ProfileWithLogout";
import Listings from "./components/Listings";

// Main App Component: Sets up routes
function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/listings" element={<Listings />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileWithLogout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
