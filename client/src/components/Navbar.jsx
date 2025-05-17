import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  React.useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, [location]);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/signin");
  };

  return (
    <nav className="w-full flex items-center justify-between px-6 py-3 border-b bg-background text-foreground shadow-sm">
      <div className="text-lg font-bold cursor-pointer" onClick={() => navigate("/")}>RoommateBase</div>
      <div className="flex gap-2">
        {!isLoggedIn ? (
          <>
            <Button variant="outline" onClick={() => navigate("/signin")}>Sign In</Button>
            <Button onClick={() => navigate("/signup")}>Sign Up</Button>
          </>
        ) : (
          <Button variant="destructive" onClick={handleSignOut}>Sign Out</Button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
