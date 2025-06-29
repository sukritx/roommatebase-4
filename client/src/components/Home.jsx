// src/components/Home.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

const Home = () => {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");
  const [suggestions, setSuggestions] = React.useState([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const debounceRef = React.useRef();

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/listings?location=${encodeURIComponent(search)}`);
    }
  };

  const fetchSuggestions = async (val) => {
    const trimmedVal = val.trim();
    if (!trimmedVal) {
      setSuggestions([]);
      return;
    }
    
    // Only fetch if query is at least 2 characters
    if (trimmedVal.length < 2) {
      setSuggestions([]);
      return;
    }
    
    try {
      const res = await api.get('/rooms/suggest-locations', { 
        params: { query: trimmedVal } 
      });
      
      // Handle the new response format: { success, data: [{ name, value }] }
      if (res.data?.success && Array.isArray(res.data.data)) {
        // Map the suggestions to the format expected by the component
        setSuggestions(res.data.data.map(item => item.name));
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };


  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setShowSuggestions(!!val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearch(suggestion);
    setShowSuggestions(false);
    navigate(`/listings?location=${encodeURIComponent(suggestion)}`);
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-2 sm:px-4 bg-gray-50">
      <h1 className="text-2xl sm:text-3xl font-bold text-black mb-6 text-center">Best place to find your next roommate</h1>
      <form onSubmit={handleSearch} className="w-full max-w-md relative mx-auto">
        <input
          type="text"
          className="w-full p-3 rounded shadow focus:outline-none text-base sm:text-lg"
          placeholder="Search location, e.g. a city or area"
          value={search}
          onChange={handleInputChange}
          autoComplete="off"
          onFocus={() => setShowSuggestions(!!search)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 bg-white border rounded shadow z-10 mt-1 max-h-60 overflow-auto">
            {suggestions.map((s, idx) => (
              <li
                key={s + idx}
                className="px-4 py-2 hover:bg-orange-100 cursor-pointer"
                onMouseDown={() => handleSuggestionClick(s)}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </form>
    </div>
  );
};

export default Home;
