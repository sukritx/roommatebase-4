// browse-rooms.tsx (Illustrative structure based on common Next.js/React patterns)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@heroui/button'; // Assuming you have Button
import { Input } from '@heroui/input'; // Assuming you have Input
import { Card, CardBody, CardFooter } from '@heroui/card'; // Assuming Card components
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter
} from "@heroui/drawer";
import { useMediaQuery } from 'react-responsive'; // For responsive behavior

import FilterFormContent from '@/components/FilterFormContent'; // Your filter form
import { SearchIcon, FilterIcon } from '@/components/icons'; // Your icons
import { title } from '@/components/primitives'; // For headings

// Define your Room interface, if not already in a shared type file
interface Room {
  _id: string;
  title: string;
  price: number;
  city: string; // Changed from location
  state?: string; // New
  zipCode: string; // New
  country: string; // New
  images: string[];
  size: number;
  rooms: number;
  bathrooms: number; // Assuming this exists for display
  category: string;
  currency: string;
  // ... other room properties as per your schema
}

// Initial state for filters, matching the FilterFormContent interface
interface Filters {
  city: string;
  state: string;
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

const initialFilters: Filters = {
  city: '',
  state: '',
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
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const isDesktop = useMediaQuery({ minWidth: 1024 });

  // Initialize useNavigate hook
  const navigate = useNavigate();

  // Function to fetch rooms based on current filters
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
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
  }, [filters]);

  // Initial fetch on component mount
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Handle filter input changes
  const handleFilterChange = useCallback((key: keyof Filters, value: any) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  }, []);

  // Handle apply filters action
  const handleApplyFilters = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    fetchRooms();
    if (!isDesktop) {
      setIsFilterDrawerOpen(false);
    }
  }, [fetchRooms, isDesktop]);

  // Handle clear filters action
  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
    fetchRooms();
    if (!isDesktop) {
      setIsFilterDrawerOpen(false);
    }
  }, [fetchRooms, isDesktop]);

  // Handle card click to navigate to room details
  const handleCardClick = useCallback((roomId: string) => {
    // Assuming your room details route is /rooms/:id
    navigate(`/rooms/${roomId}`);
  }, [navigate]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className={title()}>Browse Rooms</h1>

      {/* Filter Button for Mobile/Tablet */}
      {!isDesktop && (
        <div className="flex justify-end mb-4">
          <Button
            color="secondary"
            onPress={() => setIsFilterDrawerOpen(true)}
            startContent={<FilterIcon />}
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
              filtersData={filters}
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
                  filtersData={filters}
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
                // Call handleCardClick with the room's ID
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
                    {/* REMOVED THE BUTTON */}
                    {/* <Button size="sm">View Details</Button> */}
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