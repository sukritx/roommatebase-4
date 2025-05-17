// src/components/ProfileWithLogout.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Profile from "../pages/Profile";

const ProfileWithLogout = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/signin");
  };
  return (
    <div>
      <Profile />
      <div className="flex justify-center mt-4">
        <Button variant="destructive" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
};

export default ProfileWithLogout;
