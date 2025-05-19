import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../lib/api";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const filterDefaults = {
  category: "",
  price: "",
  sizeMin: "",
  sizeMax: "",
  roomsMin: "",
  roomsMax: "",
  rentalPeriod: "",
  takeoverDate: "",
  petFriendly: false,
  seniorFriendly: false,
  studentsOnly: false,
  shareable: false,
  socialHousing: false,
  parking: false,
  elevator: false,
  balcony: false,
  electricChargingStation: false,
  furnished: false,
  dishwasher: false,
  washingMachine: false,
  dryer: false,
};

const currencySymbols = { USD: "$", EUR: "€", NOK: "kr", THB: "฿", GBP: "£", JPY: "¥" };

const Listings = () => {
  // State for image carousel index per room card
  const [imgIndexes, setImgIndexes] = React.useState({});
  const [showFilters, setShowFilters] = React.useState(false);
  const query = useQuery();
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState(filterDefaults);
  const [loading, setLoading] = useState(false);

  const location = query.get("location") || "";

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line
  }, [location]);

  const isOnlyLocation = () => {
    // Only location is set, all other filters are default
    const { location: loc, ...rest } = { ...filters, location };
    return (
      location &&
      Object.entries(rest).every(([k, v]) =>
        typeof v === "boolean" ? v === false : v === ""
      )
    );
  };

  const fetchRooms = async (extraFilters = {}) => {
    setLoading(true);
    let url, params;
    if (isOnlyLocation()) {
      url = "/rooms?";
      params = { location };
    } else {
      url = "/rooms/filtered?";
      params = { ...filters, ...extraFilters };
      if (location) params.location = location;
    }
    url += Object.entries(params)
      .filter(([k, v]) => v !== "" && v !== false)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(typeof v === "boolean" ? v.toString() : v)}`)
      .join("&");
    try {
      const res = await api.get(url);
      setRooms(res.data);
    } catch (err) {
      setRooms([]);
    }
    setLoading(false);
  };


  const handleFilterChange = e => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
  };

  const handleFilterSubmit = e => {
    e.preventDefault();
    fetchRooms();
  };

  // Track window width for runtime check
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Show Filters Button: Only visible on mobile/tablet (hidden on md and larger screens) */}
      {windowWidth < 768 && (
        <button
          className="md:hidden bg-gradient-to-r from-orange-500 to-orange-400 text-white font-bold py-2 px-5 rounded-full shadow-lg m-4 w-fit self-start flex items-center gap-2 hover:scale-105 transition-transform duration-150"
          style={{ display: showFilters ? 'none' : 'flex' }}
          onClick={() => setShowFilters(true)}
          aria-controls="sidebar-filters"
          aria-expanded={showFilters}
        >
          <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.586V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17v-3.414a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z' /></svg>
          Show Filters
        </button>
      )}
      {/* Overlay for mobile sidebar */}
      {showFilters && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden animate-fadein"
          onClick={() => setShowFilters(false)}
          aria-hidden="true"
        />
      )}
      {/* Sidebar Filters */}
      <aside
        id="sidebar-filters"
        aria-modal={showFilters}
        aria-hidden={!showFilters && window.innerWidth < 768}
        className={`z-30 fixed md:static top-0 left-0 h-full md:h-auto w-4/5 max-w-xs md:w-80 p-6 bg-white border-b md:border-b-0 md:border-r flex-shrink-0 transition-transform duration-200 shadow-2xl md:shadow-xl md:rounded-xl md:mt-8 md:ml-6 ${showFilters ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 overflow-y-auto md:overflow-visible`}
        style={{ boxShadow: showFilters ? '0 0 0 9999px rgba(0,0,0,0.2)' : undefined, maxHeight: '100vh' }}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <svg xmlns='http://www.w3.org/2000/svg' className='h-6 w-6 text-orange-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.586V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17v-3.414a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z' /></svg>
            <span className="text-xl font-semibold text-gray-700">Filters</span>
          </div>
          {/* Close button on mobile */}
          <button
            className="md:hidden flex items-center justify-center text-gray-500 hover:text-orange-500 bg-gray-100 rounded-full w-9 h-9 text-2xl font-bold shadow transition-colors duration-150"
            onClick={() => setShowFilters(false)}
            aria-label="Close filters"
          >
            <span className="sr-only">Close filters</span>
            <svg xmlns='http://www.w3.org/2000/svg' className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>
          </button>
        </div>
        <form onSubmit={handleFilterSubmit} className="flex flex-col gap-2 text-sm">
          {/* Category */}
          <div className="mb-2">
            <div className="font-semibold text-xs mb-1">Category</div>
            <label className="flex items-center gap-2 mb-1"><input type="checkbox" name="category" value="Apartment" checked={filters.category === "Apartment"} onChange={e => setFilters(f => ({ ...f, category: e.target.checked ? "Apartment" : "" }))} /> Apartments</label>
            <label className="flex items-center gap-2 mb-1"><input type="checkbox" name="category" value="Room" checked={filters.category === "Room"} onChange={e => setFilters(f => ({ ...f, category: e.target.checked ? "Room" : "" }))} /> Rooms</label>
            <label className="flex items-center gap-2 mb-1"><input type="checkbox" name="category" value="House" checked={filters.category === "House"} onChange={e => setFilters(f => ({ ...f, category: e.target.checked ? "House" : "" }))} /> Houses</label>
            <label className="flex items-center gap-2 mb-1"><input type="checkbox" name="category" value="Townhouse" checked={filters.category === "Townhouse"} onChange={e => setFilters(f => ({ ...f, category: e.target.checked ? "Townhouse" : "" }))} /> Townhouses</label>
          </div>

          {/* Price */}
          <div className="mb-2">
            <div className="font-semibold text-xs mb-1">Price</div>
            <input name="price" type="number" placeholder="Max price" value={filters.price} onChange={handleFilterChange} className="w-full p-2 border rounded text-xs" />
          </div>

          {/* Size */}
          <div className="mb-2">
            <div className="font-semibold text-xs mb-1">Size</div>
            <div className="flex items-center gap-2">
              <input name="sizeMin" type="number" placeholder="Min. size" value={filters.sizeMin} onChange={handleFilterChange} className="w-1/2 p-2 border rounded text-xs" />
              <input name="sizeMax" type="number" placeholder="Max. size" value={filters.sizeMax} onChange={handleFilterChange} className="w-1/2 p-2 border rounded text-xs" />
              <span className="text-xs">m²</span>
            </div>
          </div>

          {/* Number of rooms */}
          <div className="mb-2">
            <div className="font-semibold text-xs mb-1">Number of rooms</div>
            <div className="flex items-center gap-2">
              <input name="roomsMin" type="number" placeholder="Min" value={filters.roomsMin} onChange={handleFilterChange} className="w-1/2 p-2 border rounded text-xs" />
              <input name="roomsMax" type="number" placeholder="Max" value={filters.roomsMax} onChange={handleFilterChange} className="w-1/2 p-2 border rounded text-xs" />
            </div>
          </div>

          {/* Minimum rental period */}
          <div className="mb-2">
            <div className="font-semibold text-xs mb-1">Minimum rental period</div>
            <label className="flex items-center gap-2 mb-1"><input type="radio" name="rentalPeriod" value="" checked={filters.rentalPeriod === ""} onChange={handleFilterChange} /> Any</label>
            <label className="flex items-center gap-2 mb-1"><input type="radio" name="rentalPeriod" value="1-11 months" checked={filters.rentalPeriod === "1-11 months"} onChange={handleFilterChange} /> 1-11 months</label>
            <label className="flex items-center gap-2 mb-1"><input type="radio" name="rentalPeriod" value="12-23 months" checked={filters.rentalPeriod === "12-23 months"} onChange={handleFilterChange} /> 12-23 months</label>
            <label className="flex items-center gap-2 mb-1"><input type="radio" name="rentalPeriod" value="24+ months" checked={filters.rentalPeriod === "24+ months"} onChange={handleFilterChange} /> 24+ months</label>
            <label className="flex items-center gap-2 mb-1"><input type="radio" name="rentalPeriod" value="Unlimited" checked={filters.rentalPeriod === "Unlimited"} onChange={handleFilterChange} /> Unlimited</label>
          </div>

          {/* Takeover date */}
          <div className="mb-2">
            <div className="font-semibold text-xs mb-1">Takeover date</div>
            <input name="takeoverDate" type="date" value={filters.takeoverDate} onChange={handleFilterChange} className="w-full p-2 border rounded text-xs" />
          </div>

          {/* Lifestyle */}
          <div className="mb-2">
            <div className="font-semibold text-xs mb-1">Lifestyle</div>
            <label className="flex items-center gap-2 mb-1"><input type="checkbox" name="petFriendly" checked={filters.petFriendly} onChange={e => setFilters(f => ({ ...f, petFriendly: e.target.checked }))} /> Pet-friendly</label>
            <label className="flex items-center gap-2 mb-1"><input type="checkbox" name="seniorFriendly" checked={filters.seniorFriendly} onChange={e => setFilters(f => ({ ...f, seniorFriendly: e.target.checked }))} /> Senior-friendly</label>
            <label className="flex items-center gap-2 mb-1"><input type="checkbox" name="studentsOnly" checked={filters.studentsOnly} onChange={e => setFilters(f => ({ ...f, studentsOnly: e.target.checked }))} /> Students only</label>
            <label className="flex items-center gap-2 mb-1"><input type="checkbox" name="shareable" checked={filters.shareable} onChange={e => setFilters(f => ({ ...f, shareable: e.target.checked }))} /> Shareable</label>
            <label className="flex items-center gap-2 mb-1"><input type="checkbox" name="socialHousing" checked={filters.socialHousing} onChange={e => setFilters(f => ({ ...f, socialHousing: e.target.checked }))} /> Social housing</label>
          </div>

          {/* Facilities */}
          <div className="mb-2">
            <div className="font-semibold text-xs mb-1">Facilities</div>
            <label className="flex items-center gap-2 mb-1"><input type="checkbox" name="parking" checked={filters.parking} onChange={e => setFilters(f => ({ ...f, parking: e.target.checked }))} /> Parking</label>
            <label className="flex items-center gap-2 mb-1"><input type="checkbox" name="elevator" checked={filters.elevator} onChange={e => setFilters(f => ({ ...f, elevator: e.target.checked }))} /> Elevator</label>
            <label className="flex items-center gap-2 mb-1"><input type="checkbox" name="balcony" checked={filters.balcony} onChange={e => setFilters(f => ({ ...f, balcony: e.target.checked }))} /> Balcony</label>
            <label className="flex items-center gap-2 mb-1"><input type="checkbox" name="electricChargingStation" checked={filters.electricChargingStation} onChange={e => setFilters(f => ({ ...f, electricChargingStation: e.target.checked }))} /> Electric charging station</label>
          </div>

          {/* Inventory */}
          <div className="mb-2">
            <div className="font-semibold text-xs mb-1">Inventory</div>
            <label className="flex items-center gap-2 mb-1"><input type="checkbox" name="furnished" checked={filters.furnished} onChange={e => setFilters(f => ({ ...f, furnished: e.target.checked }))} /> Furnished</label>
            <label className="flex items-center gap-2 mb-1"><input type="checkbox" name="dishwasher" checked={filters.dishwasher} onChange={e => setFilters(f => ({ ...f, dishwasher: e.target.checked }))} /> Dishwasher</label>
            <label className="flex items-center gap-2 mb-1"><input type="checkbox" name="washingMachine" checked={filters.washingMachine} onChange={e => setFilters(f => ({ ...f, washingMachine: e.target.checked }))} /> Washing machine</label>
            <label className="flex items-center gap-2 mb-1"><input type="checkbox" name="dryer" checked={filters.dryer} onChange={e => setFilters(f => ({ ...f, dryer: e.target.checked }))} /> Dryer</label>
          </div>

          <button type="submit" className="bg-orange-500 text-white py-2 rounded font-bold mt-2">Apply filters</button>
          <button type="button" className="border border-orange-500 text-orange-500 py-2 rounded font-bold mt-2" onClick={() => setFilters(filterDefaults)}>Clear filters</button>
        </form>
      </aside>
      {/* Listings */}
      <main
        className="flex-1 p-4 sm:p-6"
        onClick={() => {
          if (showFilters && window.innerWidth < 768) setShowFilters(false);
        }}
      >
        <h2 className="text-2xl font-bold mb-4">{rooms.length} rooms founded</h2>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Carousel image index state for each room */}
            {rooms.map((room, idx) => {
              // Use a unique key for each card
              const key = room._id || idx;
              // imgIndexes is a state object at the component level
              // Get the current image index for this card
              const imgIdx = imgIndexes[key] || 0;
              const hasImages = room.images && room.images.length > 0;
              const totalImages = hasImages ? room.images.length : 0;
              // Handlers to update the imgIndexes state
              const prevImg = e => {
                e.stopPropagation();
                setImgIndexes(prev => ({
                  ...prev,
                  [key]: imgIdx === 0 ? totalImages - 1 : imgIdx - 1
                }));
              };
              const nextImg = e => {
                e.stopPropagation();
                setImgIndexes(prev => ({
                  ...prev,
                  [key]: imgIdx === totalImages - 1 ? 0 : imgIdx + 1
                }));
              };
              return (
                <div key={key} className="bg-white rounded shadow p-4 flex flex-col">
                  <div className="relative h-40 bg-gray-200 mb-2 rounded overflow-hidden flex items-center justify-center">
                    {hasImages ? (
                      <>
                        <img
                          src={room.images[imgIdx]}
                          alt={room.title || "Room image"}
                          className="object-cover w-full h-full"
                        />
                        {totalImages > 1 && (
                          <>
                            <button
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow hover:bg-white"
                              onClick={prevImg}
                              aria-label="Previous image"
                            >
                              &#8592;
                            </button>
                            <button
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow hover:bg-white"
                              onClick={nextImg}
                              aria-label="Next image"
                            >
                              &#8594;
                            </button>
                          </>
                        )}
                        <div className="absolute right-2 bottom-2 bg-black/60 text-white text-xs rounded px-2 py-1">{imgIdx + 1}/{totalImages}</div>
                      </>
                    ) : (
                      <span className="text-gray-400">No image</span>
                    )}
                  </div>
                  <div className="font-semibold mb-1">{`${room.rooms} rm. ${room.category} of ${room.size} m²`}</div>
                  <div className="text-gray-600 text-sm mb-2">{room.location}</div>
                  <div className="text-orange-600 font-bold text-lg mb-2">{room.price ? `${room.price} ${(currencySymbols[room.currency] || room.currency)}` : ""}</div>
                  <div className="text-xs text-gray-400">{room.availableDate ? `Available from ${new Date(room.availableDate).toLocaleDateString()}` : null}</div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Listings;
