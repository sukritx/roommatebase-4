import React, { useState, useEffect, useCallback, useRef } from 'react'; // Import useRef
import axios from 'axios';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Checkbox } from '@heroui/checkbox';
import { Select, SelectItem } from "@heroui/select";
import { Card, CardBody, CardFooter } from '@heroui/card';
import { Image } from '@heroui/image';
import { Spinner } from '@heroui/spinner';
import { title, subtitle } from '@/components/primitives';
import { SearchIcon } from '@/components/icons';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';

// --- Import the moved FilterFormContent ---
import FilterFormContent from '@/components/FilterFormContent'; // Adjust path if needed

// ... (Room and Filters interfaces, CATEGORY_OPTIONS, RENTAL_PERIOD_OPTIONS remain the same) ...

const defaultFiltersTemplate: Filters = {
  location: '', category: '', priceMax: '', sizeMin: '', sizeMax: '',
  roomsMin: '', roomsMax: '', rentalPeriod: '', takeoverDate: '',
  petFriendly: false, seniorFriendly: false, studentsOnly: false,
  shareable: false, socialHousing: false, parking: false, elevator: false,
  balcony: false, electricChargingStation: false, furnished: false,
  dishwasher: false, washingMachine: false, dryer: false,
};


export default function BrowseRoomsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Separate display filters from applied filters to control re-fetch
  const [displayFilters, setDisplayFilters] = useState<Filters>({ ...defaultFiltersTemplate });
  const [appliedFilters, setAppliedFilters] = useState<Filters>({ ...defaultFiltersTemplate });


  const { isOpen: isFilterModalOpen, onOpen: onOpenFilterModal, onOpenChange: onOpenChangeFilterModal } = useDisclosure();


  const fetchRooms = useCallback(async (filtersToApply: Filters) => { // Take filters as argument
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filtersToApply).forEach(([key, value]) => { // Use filtersToApply
        if (value !== '' && value !== false && value !== null) {
          if (key === 'socialHousing' && value === true) {
            params.append('category', 'Housing Cooperative');
          } else if (typeof value === 'boolean') {
            params.append(key, value.toString());
          } else if (typeof value === 'number') {
            params.append(key, String(value));
          } else {
            params.append(key, value as string);
          }
        }
      });

      const res = await axios.get(`${API_BASE_URL}/rooms/filtered?${params.toString()}`);
      setRooms(res.data);
    } catch (err: any) {
      console.error("Failed to fetch filtered rooms:", err);
      setError(err.response?.data?.message || "Failed to load rooms.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Effect to read initial search query from URL, set filters, and perform initial fetch
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const currentUrlFilters: Filters = { ...defaultFiltersTemplate };

    params.forEach((value, key) => {
        if (key in currentUrlFilters) {
            if (value === 'true') currentUrlFilters[key as keyof Filters] = true as any;
            else if (value === 'false') currentUrlFilters[key as keyof Filters] = false as any;
            else if (!isNaN(Number(value)) && (key.includes('price') || key.includes('size') || key.includes('rooms'))) currentUrlFilters[key as keyof Filters] = Number(value) as any;
            else currentUrlFilters[key as keyof Filters] = value as any;
        }
    });

    setDisplayFilters(currentUrlFilters); // Update display filters based on URL
    setAppliedFilters(currentUrlFilters); // Set applied filters initially
    fetchRooms(currentUrlFilters); // Perform initial fetch with parsed URL filters

  }, [location.search, fetchRooms]); // Depend on location.search and memoized fetchRooms


  // handleFilterChange only updates displayFilters state, NOT appliedFilters and NOT fetches rooms
  const handleFilterChange = (key: keyof Filters, value: any) => {
    setDisplayFilters(prev => ({ ...prev, [key]: value }));
    // No navigate or fetchRooms call here
  };

  // handleApplyFilters now updates URL, sets applied filters, and fetches rooms
  const handleApplyFilters = (e?: React.FormEvent) => {
    e?.preventDefault();
    setAppliedFilters(displayFilters); // Update applied filters to current display state

    const params = new URLSearchParams();
    Object.entries(displayFilters).forEach(([filterKey, filterValue]) => {
      if (filterValue !== '' && filterValue !== false && filterValue !== null) {
        if (typeof filterValue === 'boolean') {
          params.append(filterKey, filterValue.toString());
        } else if (typeof filterValue === 'number') {
          params.append(filterKey, String(filterValue));
        } else {
          params.append(filterKey, filterValue as string);
        }
      }
    });
    navigate(`?${params.toString()}`, { replace: true }); // Update URL

    fetchRooms(displayFilters); // Fetch rooms based on current display filters
    onOpenChangeFilterModal(false); // Close modal on apply
  };

  const handleClearFilters = () => {
    setDisplayFilters(defaultFiltersTemplate); // Clear display filters
    setAppliedFilters(defaultFiltersTemplate); // Clear applied filters
    navigate(`/browse`, { replace: true }); // Clear URL parameters
    fetchRooms(defaultFiltersTemplate); // Fetch all rooms
    onOpenChangeFilterModal(false); // Close modal on clear
  };

  const getPartyCount = (room: Room) => {
    return room.shareable && room.partyApplications ? room.partyApplications.length : 0;
  };


  return (
    <section className="container mx-auto max-w-7xl px-6 py-8 md:py-10">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filter Button for Mobile */}
        <div className="md:hidden flex justify-end mb-4">
          <Button color="primary" onPress={onOpenFilterModal} startContent={<SearchIcon />}>
            Show Filters
          </Button>
        </div>

        {/* Filters Sidebar (Desktop) */}
        <aside className="hidden md:block w-full md:w-1/4 lg:w-1/5 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex-shrink-0 sticky top-20 h-fit">
          <h2 className={title({ size: "sm" })}>Filters</h2>
          <FilterFormContent
            onClear={handleClearFilters}
            onApply={handleApplyFilters}
            filtersData={displayFilters} // <--- Pass displayFilters to form
            onFilterChangeData={handleFilterChange}
          />
        </aside>

        {/* Filter Modal (Mobile) */}
        <Modal isOpen={isFilterModalOpen} onOpenChange={onOpenChangeFilterModal} scrollBehavior="inside">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">Filters</ModalHeader>
                <ModalBody>
                  <FilterFormContent
                    onClear={handleClearFilters}
                    onApply={handleApplyFilters}
                    filtersData={displayFilters} // <--- Pass displayFilters to form
                    onFilterChangeData={handleFilterChange}
                  />
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Room Results Section */}
        <main className="w-full md:w-3/4 lg:w-4/5">
          <h1 className={title({ size: "lg" })}>Available Rooms</h1>
          <p className={subtitle({ class: "mt-2" })}>
            {loading ? 'Searching...' : `${rooms.length} rooms found`}
          </p>
          {loading ? (
            <div className="flex justify-center items-center h-60">
              <Spinner size="lg" color="primary" />
            </div>
          ) : error ? (
            <p className="text-red-500 text-center mt-8">{error}</p>
          ) : rooms.length === 0 ? (
            <p className="text-default-500 text-center mt-8">No rooms match your criteria. Try adjusting your filters!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {rooms.map((room) => (
                <Card
                  key={room._id}
                  isPressable
                  onPress={() => navigate(`/rooms/${room._id}`)}
                  className="pb-4 transform transition-transform hover:scale-105"
                >
                  <CardBody className="overflow-visible p-0">
                    <Image
                      shadow="sm"
                      radius="lg"
                      width="100%"
                      alt={room.title}
                      className="w-full object-cover h-[180px]"
                      src={room.images && room.images.length > 0 ? room.images[0] : "https://via.placeholder.com/400x180.png?text=No+Image"}
                    />
                  </CardBody>
                  <CardFooter className="text-small justify-between flex-col items-start pt-2 px-4">
                    <h3 className="font-bold text-lg leading-tight">
                      {room.rooms} rm. {room.category} of {room.size} m²
                    </h3>
                    <p className="text-default-500 text-sm mt-1">
                      {room.city}, {room.country}
                    </p>
                    <div className="flex justify-between items-center w-full mt-2">
                      <p className="text-xl font-bold">
                        {room.currency} {room.price.toLocaleString()}
                      </p>
                      {room.shareable && (
                        <div className="flex items-center text-sm text-default-600 gap-1">
                          <span className="text-lg">🧑‍🤝‍🧑</span> {/* Party emoji */}
                          <span>{getPartyCount(room)} Parties</span>
                        </div>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </section>
  );
}