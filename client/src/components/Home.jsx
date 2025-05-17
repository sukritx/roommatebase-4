// src/components/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-background">
      <h1 className="text-3xl font-bold">Welcome to RoommateBase</h1>

    </div>
  );
};

export default Home;
