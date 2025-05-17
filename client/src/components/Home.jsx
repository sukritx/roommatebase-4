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
    if (!val.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await api.get('/rooms/suggest-locations', { params: { query: val } });
      setSuggestions(res.data);
    } catch {
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
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-3xl font-bold text-black mb-6">Best place to find your next roommate</h1>
      <form onSubmit={handleSearch} className="w-full max-w-md relative">
        <input
          type="text"
          className="w-full p-3 rounded shadow focus:outline-none"
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
