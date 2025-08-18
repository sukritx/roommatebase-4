// browse-rooms.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Card, CardBody, CardFooter } from '@heroui/card';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter
} from "@heroui/drawer";
import { useMediaQuery } from 'react-responsive';

import FilterFormContent from '@/components/FilterFormContent';
import { SearchIcon, FilterIcon } from '@/components/icons';

import { useNavigate, useSearchParams } from 'react-router-dom'; // Import useSearchParams

// Define your Room interface
interface Room {
  _id: string;
  title: string;
  price: number;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
  images: string[];
  size: number;
  rooms: number;
  bathrooms: number;
  category: string;
  currency: string;
  // ... other room properties as per your schema
}

// Initial state for filters (as a base, will be merged with URL params)
interface Filters {
  locationSearch: string;
  zipCode: string;
  country: string;
  category: string;
  priceMax: number | '';
  sizeMin: number | '';
  sizeMax: number | '';
  roomsMin: number | '';
  roomsMax: number | '';
  rentalPeriod: string;
  takeoverDate: string;
  petFriendly: boolean;
  seniorFriendly: boolean;
  studentsOnly: boolean;
  shareable: boolean;
  socialHousing: boolean;
  parking: boolean;
  elevator: boolean;
  balcony: boolean;
  electricChargingStation: boolean;
  furnished: boolean;
  dishwasher: boolean;
  washingMachine: boolean;
  dryer: boolean;
}

const defaultInitialFilters: Filters = { // Renamed to clearly differentiate from URL-derived state
  locationSearch: '',
  zipCode: '',
  country: '',
  category: '',
  priceMax: '',
  sizeMin: '',
  sizeMax: '',
  roomsMin: '',
  roomsMax: '',
  rentalPeriod: '',
  takeoverDate: '',
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

const BrowseRoomsPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams(); // Get URL search params and setter

  // Derive initial filters from URL search params
  const getFiltersFromSearchParams = useCallback(() => {
    const newFilters: Filters = { ...defaultInitialFilters }; // Start with defaults
    // Iterate over expected filter keys and check if they exist in URL params
    (Object.keys(defaultInitialFilters) as (keyof Filters)[]).forEach(key => {
      const paramValue = searchParams.get(key);
      if (paramValue !== null) {
        // Special handling for boolean and number types
        if (typeof defaultInitialFilters[key] === 'boolean') {
          (newFilters as any)[key] = paramValue === 'true';
        } else if (typeof defaultInitialFilters[key] === 'number' || (defaultInitialFilters[key] === '' && key.includes('Max') || key.includes('Min'))) {
          (newFilters as any)[key] = paramValue === '' ? '' : Number(paramValue);
        } else {
          (newFilters as any)[key] = paramValue;
        }
      }
    });
    return newFilters;
  }, [searchParams]);

  const [filters, setFilters] = useState<Filters>(getFiltersFromSearchParams);

  const isDesktop = useMediaQuery({ minWidth: 1024 });
  const navigate = useNavigate();

  // Function to fetch rooms based on current filters
  const fetchRooms = useCallback(async (currentFilters: Filters) => { // Accept filters as argument
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(currentFilters).forEach(([key, value]) => { // Use the provided filters
        if (value !== '' && value !== false && value !== null) {
          queryParams.append(key, String(value));
        }
      });

      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/rooms/filtered`;
      const response = await fetch(`${apiUrl}?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRooms(data);
    } catch (err) {
      console.error("Failed to fetch rooms:", err);
      setError("Failed to load rooms. Please try again. " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }, []); // Dependency array changed to be empty, as filters are passed as argument

  // Effect to update filters state and trigger fetch when URL search params change
  useEffect(() => {
    const newFilters = getFiltersFromSearchParams();
    setFilters(newFilters);
    fetchRooms(newFilters); // Fetch with the new filters from URL
  }, [searchParams, getFiltersFromSearchParams, fetchRooms]); // Depend on searchParams

  // Handle filter input changes - also update URL
  const handleFilterChange = useCallback((key: keyof Filters, value: any) => {
    setFilters((prevFilters) => {
      const updatedFilters = { ...prevFilters, [key]: value };
      // Update URL search params whenever filter changes
      const newSearchParams = new URLSearchParams();
      Object.entries(updatedFilters).forEach(([filterKey, filterValue]) => {
        if (filterValue !== '' && filterValue !== false && filterValue !== null) {
          newSearchParams.append(filterKey, String(filterValue));
        }
      });
      setSearchParams(newSearchParams); // This will re-trigger the useEffect above
      return updatedFilters;
    });
  }, [setSearchParams]);

  // Handle apply filters action (no change needed here, as filter change updates URL)
  const handleApplyFilters = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    // fetchRooms() is now called by useEffect when searchParams change.
    // So we just close the drawer here.
    if (!isDesktop) {
      setIsFilterDrawerOpen(false);
    }
  }, [isDesktop]);

  // Handle clear filters action - reset filters and clear URL
  const handleClearFilters = useCallback(() => {
    setFilters(defaultInitialFilters);
    setSearchParams(new URLSearchParams()); // Clear all URL parameters
    // fetchRooms() will be called by useEffect after searchParams change
    if (!isDesktop) {
      setIsFilterDrawerOpen(false);
    }
  }, [setSearchParams, isDesktop]);

  const handleCardClick = useCallback((roomId: string) => {
    navigate(`/rooms/${roomId}`);
  }, [navigate]);

  return (
    <div className="container mx-auto px-4 py-8">
      {!isDesktop && (
        <div className="flex justify-center mb-4 px-4 sm:max-w-sm mx-auto">
          <Button
            color="secondary"
            onPress={() => setIsFilterDrawerOpen(true)}
            startContent={<FilterIcon />}
            className="w-full"
          >
            Filters
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Section */}
        {isDesktop ? (
          <div className="lg:col-span-1 border-r pr-6">
            <h2 className="text-xl font-semibold mb-4">Filters</h2>
            <FilterFormContent
              filtersData={filters} // This will now reflect URL params
              onFilterChangeData={handleFilterChange}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />
          </div>
        ) : (
          <Drawer
            isOpen={isFilterDrawerOpen}
            onClose={() => setIsFilterDrawerOpen(false)}
            placement="right"
          >
            <DrawerContent>
              <DrawerHeader>
                <h2 className="text-xl font-semibold">Filters</h2>
              </DrawerHeader>
              <DrawerBody>
                <FilterFormContent
                  filtersData={filters} // This will now reflect URL params
                  onFilterChangeData={handleFilterChange}
                  onApply={handleApplyFilters}
                  onClear={handleClearFilters}
                />
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        )}

        {/* Room Listings Section */}
        <div className={isDesktop ? "lg:col-span-3" : "col-span-1"}>
          {loading && <p className="text-center text-gray-500">Loading rooms...</p>}
          {error && <p className="text-center text-red-500">{error}</p>}
          {!loading && !error && rooms.length === 0 && (
            <p className="text-center text-gray-500">No rooms found matching your criteria.</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <Card
                key={room._id}
                isPressable
                onPress={() => handleCardClick(room._id)}
              >
                <CardBody className="overflow-visible p-0">
                  <img
                    alt={room.title}
                    className="w-full object-cover h-48"
                    src={room.images[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                  />
                </CardBody>
                <CardFooter className="text-small justify-between flex-col items-start pt-2 px-4">
                  <h3 className="font-bold text-lg leading-tight">
                    {room.rooms} rm. {room.category} of {room.size} m²
                  </h3>
                  <p className="text-default-500 text-sm mt-1">
                    {room.city}{room.state ? `, ${room.state}` : ''}{room.zipCode ? ` ${room.zipCode}` : ''}, {room.country}
                  </p>
                  <div className="flex justify-between items-center w-full mt-2">
                    <p className="text-lg font-semibold">
                      {room.price} {room.currency}
                    </p>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseRoomsPage;