import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Use useNavigate for redirection
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { title, subtitle } from "@/components/primitives"; // Your custom text styles
import { SearchIcon } from "@/components/icons"; // Your search icon
import { Link as RouterLink } from "react-router-dom";

export default function IndexPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to the browse page with the search query as a URL parameter
      navigate(`/browse?location=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      // If empty, navigate to browse page to show all rooms (or a default set)
      navigate(`/browse`);
    }
  };

  return (
    <section className="flex flex-col items-center justify-center gap-8 py-8 md:py-10">
      {/* Hero Section & Search Bar */}
      <div className="inline-block max-w-lg text-center justify-center">
        <span className={title()}>Find your perfect&nbsp;</span>
        <span className={title({ color: "violet" })}>roommate base&nbsp;</span>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex w-full max-w-xl gap-2 relative">
        <Input
          type="text"
          placeholder="Search by city or area..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<SearchIcon className="text-default-400" />}
          variant="bordered"
          size="lg"
          fullWidth
        />
        <Button type="submit" color="primary" size="lg">
          Search
        </Button>
      </form>

      {/* Optionally add some featured categories or quick links here */}
      <div className="mt-10 text-center">
        <h2 className={subtitle()}>Or browse all available rooms:</h2>
        <Button
          as={RouterLink} // Use RouterLink for internal navigation
          to="/browse"
          color="secondary"
          variant="flat"
          className="mt-4"
        >
          View All Rooms
        </Button>
      </div>
    </section>
  );
}