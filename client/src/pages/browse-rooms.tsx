import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Checkbox } from '@heroui/checkbox'; // CheckboxGroup not used directly
import { Select, SelectItem } from "@heroui/select"; // SelectSection not used directly
import { Card, CardBody, CardFooter } from '@heroui/card';
import { Image } from '@heroui/image';
import { Spinner } from '@heroui/spinner';
import { title, subtitle } from '@/components/primitives';
import { SearchIcon } from '@/components/icons';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal'; // Import Modal components

// Define Room interface (same as before)
interface Room {
  _id: string;
  images: string[];
  title: string;
  description: string;
  city: string;
  country: string;
  rooms: number;
  category: string;
  size: number; // in m²
  price: number;
  currency: string;
  shareable: boolean;
  partyApplications?: any[];
  rentalPeriod: string;
  availableDate?: string;
  petsAllowed: boolean;
  seniorFriendly: boolean;
  studentsOnly: boolean;
  balcony: boolean;
  parking: boolean;
  dishwasher: boolean;
  washingMachine: boolean;
  electricChargingStation: boolean;
  dryer: boolean;
  furnished: boolean;
}

// Define Filter State Interface (same as before)
interface Filters {
  location: string;
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

// Options for dropdowns/radios (same as before)
const CATEGORY_OPTIONS = [
  { label: 'Any', value: '' },
  { label: 'Apartment', value: 'Apartment' },
  { label: 'City house', value: 'City house' },
  { label: 'Club room', value: 'Club room' },
  { label: 'Condominium', value: 'Condominium' },
  { label: 'Detached Single Family House', value: 'Detached Single Family House' },
  { label: 'Double house', value: 'Double house' },
  { label: 'Half double house', value: 'Half double house' },
  { label: 'Housing Cooperative', value: 'Housing Cooperative' },
  { label: 'Multi family house', value: 'Multi family house' },
  { label: 'Parcel house', value: 'Parcel house' },
  { label: 'Small house', value: 'Small house' },
  { label: 'Summer house', value: 'Summer house' },
  { label: 'Townhouse', value: 'Townhouse' },
  { label: 'Villa', value: 'Villa' },
  { label: 'Youth Housing', value: 'Youth Housing' },
];

const RENTAL_PERIOD_OPTIONS = [
  { label: 'Any', value: '' },
  { label: '1-11 months', value: '1-11 months' },
  { label: '12-23 months', value: '12-23 months' },
  { label: '24+ months', value: '24+ months' },
  { label: 'Unlimited', value: 'Unlimited' },
];


export default function BrowseRoomsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    location: '', category: '', priceMax: '', sizeMin: '', sizeMax: '',
    roomsMin: '', roomsMax: '', rentalPeriod: '', takeoverDate: '',
    petFriendly: false, seniorFriendly: false, studentsOnly: false,
    shareable: false, socialHousing: false, parking: false, elevator: false,
    balcony: false, electricChargingStation: false, furnished: false,
    dishwasher: false, washingMachine: false, dryer: false,
  });

  // For responsive filter modal
  const { isOpen: isFilterModalOpen, onOpen: onOpenFilterModal, onOpenChange: onOpenChangeFilterModal } = useDisclosure();


  const fetchRooms = useCallback(async (currentFilters: Filters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== '' && value !== false && value !== null) {
          if (key === 'socialHousing' && value === true) {
            params.append('category', 'Housing Cooperative'); // Map socialHousing to category
          } else if (typeof value === 'boolean') {
            params.append(key, value.toString());
          } else if (typeof value === 'number') { // Ensure numbers are strings
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

  // Effect to read initial search query from URL and fetch rooms
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const initialLocation = params.get('location') || '';

    // Initialize filters from URL parameters when component mounts or URL changes
    const initialFilters: Filters = { ...filters }; // Start with default filters
    params.forEach((value, key) => {
        // Ensure values are parsed correctly from string back to their types
        if (key in initialFilters) {
            if (value === 'true') initialFilters[key as keyof Filters] = true as any;
            else if (value === 'false') initialFilters[key as keyof Filters] = false as any;
            else if (!isNaN(Number(value)) && (key.includes('price') || key.includes('size') || key.includes('rooms'))) initialFilters[key as keyof Filters] = Number(value) as any;
            else initialFilters[key as keyof Filters] = value as any;
        }
    });
    setFilters(initialFilters);
    fetchRooms(initialFilters); // Fetch rooms with the parsed filters
  }, [location.search, fetchRooms]);


  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      // Update URL parameters
      const params = new URLSearchParams();
      Object.entries(newFilters).forEach(([filterKey, filterValue]) => {
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
      navigate(`?${params.toString()}`, { replace: true });
      return newFilters;
    });
  };

  const handleApplyFilters = (e?: React.FormEvent) => { // Make event optional for modal
    e?.preventDefault(); // Only prevent default if event exists
    fetchRooms(filters);
    onOpenChangeFilterModal(false); // Close modal on apply
  };

  const handleClearFilters = () => {
    const defaultFilters: Filters = {
      location: '', category: '', priceMax: '', sizeMin: '', sizeMax: '',
      roomsMin: '', roomsMax: '', rentalPeriod: '', takeoverDate: '',
      petFriendly: false, seniorFriendly: false, studentsOnly: false,
      shareable: false, socialHousing: false, parking: false, elevator: false,
      balcony: false, electricChargingStation: false, furnished: false,
      dishwasher: false, washingMachine: false, dryer: false,
    };
    setFilters(defaultFilters);
    navigate(`/browse`, { replace: true });
    fetchRooms(defaultFilters);
    onOpenChangeFilterModal(false); // Close modal on clear
  };

  const getPartyCount = (room: Room) => {
    return room.shareable && room.partyApplications ? room.partyApplications.length : 0;
  };

  // Common Filter Form Component to avoid duplication
  const FilterFormContent = ({ onClear, onApply, filtersData, onFilterChangeData }) => (
    <form onSubmit={onApply} className="flex flex-col gap-4">
      <Input
        type="text"
        label="Location (City/Area)"
        placeholder="e.g., Copenhagen"
        value={filtersData.location}
        onChange={(e) => onFilterChangeData('location', e.target.value)}
        startContent={<SearchIcon className="text-default-400" />}
      />
      <Select
        label="Category"
        placeholder="Select a category"
        selectedKeys={[filtersData.category]}
        onSelectionChange={(keys) => {
          const selectedKey = Array.from(keys)[0] as string;
          onFilterChangeData('category', selectedKey);
        }}
        // HeroUI Select often needs a specific value prop or a controlled state for single select
        // Check HeroUI docs if selectedKeys doesn't work for single value like this
      >
        {CATEGORY_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </Select>
      <Input
        type="number"
        label="Max Price"
        placeholder="e.g., 5000"
        value={filtersData.priceMax === '' ? '' : filtersData.priceMax.toString()}
        onChange={(e) => onFilterChangeData('priceMax', e.target.value === '' ? '' : Number(e.target.value))}
      />
      <h3 className="font-semibold text-medium">Size (m²)</h3>
      <div className="flex gap-2">
        <Input
          type="number"
          label="Min"
          placeholder="Min size"
          value={filtersData.sizeMin === '' ? '' : filtersData.sizeMin.toString()}
          onChange={(e) => onFilterChangeData('sizeMin', e.target.value === '' ? '' : Number(e.target.value))}
        />
        <Input
          type="number"
          label="Max"
          placeholder="Max size"
          value={filtersData.sizeMax === '' ? '' : filtersData.sizeMax.toString()}
          onChange={(e) => onFilterChangeData('sizeMax', e.target.value === '' ? '' : Number(e.target.value))}
        />
      </div>
      <h3 className="font-semibold text-medium">Number of Rooms</h3>
      <div className="flex gap-2">
        <Input
          type="number"
          label="Min"
          placeholder="Min rooms"
          value={filtersData.roomsMin === '' ? '' : filtersData.roomsMin.toString()}
          onChange={(e) => onFilterChangeData('roomsMin', e.target.value === '' ? '' : Number(e.target.value))}
        />
        <Input
          type="number"
          label="Max"
          placeholder="Max rooms"
          value={filtersData.roomsMax === '' ? '' : filters.roomsMax.toString()}
          onChange={(e) => onFilterChangeData('roomsMax', e.target.value === '' ? '' : Number(e.target.value))}
        />
      </div>
      <Select
        label="Rental Period"
        placeholder="Select period"
        selectedKeys={[filtersData.rentalPeriod]}
        onSelectionChange={(keys) => {
          const selectedKey = Array.from(keys)[0] as string;
          onFilterChangeData('rentalPeriod', selectedKey);
        }}
      >
        {RENTAL_PERIOD_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </Select>
      <h3 className="font-semibold text-medium mt-4">Lifestyle</h3>
      <Checkbox
        isSelected={filtersData.petFriendly}
        onChange={(e) => onFilterChangeData('petFriendly', e.target.checked)}
      >
        Pet-friendly
      </Checkbox>
      <Checkbox
        isSelected={filtersData.seniorFriendly}
        onChange={(e) => onFilterChangeData('seniorFriendly', e.target.checked)}
      >
        Senior-friendly
      </Checkbox>
      <Checkbox
        isSelected={filtersData.studentsOnly}
        onChange={(e) => onFilterChangeData('studentsOnly', e.target.checked)}
      >
        Students Only
      </Checkbox>
      <Checkbox
        isSelected={filtersData.shareable}
        onChange={(e) => onFilterChangeData('shareable', e.target.checked)}
      >
        Shareable
      </Checkbox>
      <Checkbox
        isSelected={filtersData.socialHousing}
        onChange={(e) => onFilterChangeData('socialHousing', e.target.checked)}
      >
        Social Housing
      </Checkbox>
      <h3 className="font-semibold text-medium mt-4">Facilities</h3>
      <Checkbox
        isSelected={filtersData.parking}
        onChange={(e) => onFilterChangeData('parking', e.target.checked)}
      >
        Parking
      </Checkbox>
      <Checkbox
        isSelected={filtersData.elevator}
        onChange={(e) => onFilterChangeData('elevator', e.target.checked)}
      >
        Elevator
      </Checkbox>
      <Checkbox
        isSelected={filtersData.balcony}
        onChange={(e) => onFilterChangeData('balcony', e.target.checked)}
      >
        Balcony
      </Checkbox>
      <Checkbox
        isSelected={filtersData.electricChargingStation}
        onChange={(e) => onFilterChangeData('electricChargingStation', e.target.checked)}
      >
        Electric Charging Station
      </Checkbox>
      <h3 className="font-semibold text-medium mt-4">Inventory</h3>
      <Checkbox
        isSelected={filtersData.furnished}
        onChange={(e) => onFilterChangeData('furnished', e.target.checked)}
      >
        Furnished
      </Checkbox>
      <Checkbox
        isSelected={filtersData.dishwasher}
        onChange={(e) => onFilterChangeData('dishwasher', e.target.checked)}
      >
        Dishwasher
      </Checkbox>
      <Checkbox
        isSelected={filtersData.washingMachine}
        onChange={(e) => onFilterChangeData('washingMachine', e.target.checked)}
      >
        Washing Machine
      </Checkbox>
      <Checkbox
        isSelected={filtersData.dryer}
        onChange={(e) => onFilterChangeData('dryer', e.target.checked)}
      >
        Dryer
      </Checkbox>
      <Button type="submit" color="primary" className="mt-6">
        Apply Filters
      </Button>
      <Button type="button" variant="flat" onPress={onClear}>
        Clear Filters
      </Button>
    </form>
  );


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
            filtersData={filters}
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
                    filtersData={filters}
                    onFilterChangeData={handleFilterChange}
                  />
                </ModalBody>
                {/* Modal Footer can be used for close button if Apply/Clear are inside form */}
                {/* <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    Close
                  </Button>
                </ModalFooter> */}
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