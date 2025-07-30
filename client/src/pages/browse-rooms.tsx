import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom'; // Use RouterLink to avoid conflict
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Checkbox, CheckboxGroup } from '@heroui/checkbox'; // For boolean filters
import { RadioGroup, Radio } from '@heroui/radio'; // For enum filters
import {Select, SelectSection, SelectItem} from "@heroui/select";
import { Card, CardBody, CardFooter } from '@heroui/card';
import { Image } from '@heroui/image';
import { Spinner } from '@heroui/spinner';
import { title, subtitle } from '@/components/primitives';
import { SearchIcon } from '@/components/icons'; // Your search icon

// Define Room interface (same as in room-detail.tsx and index.tsx)
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

// Define Filter State Interface
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
  socialHousing: boolean; // Maps to "Housing Cooperative"
  parking: boolean;
  elevator: boolean;
  balcony: boolean;
  electricChargingStation: boolean;
  furnished: boolean;
  dishwasher: boolean;
  washingMachine: boolean;
  dryer: boolean;
}

// Options for dropdowns/radios
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
    location: '',
    category: '',
    priceMax: '',
    sizeMin: '',
    sizeMax: '',
    roomsMin: '',
    roomsMax: '',
    rentalPeriod: '',
    takeoverDate: '', // Consider a date picker component here
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
  });

  const fetchRooms = useCallback(async (currentFilters: Filters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      // Dynamically add populated filters to params
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== '' && value !== false && value !== null) {
          // Special handling for socialHousing if it maps to a category
          if (key === 'socialHousing' && value === true) {
            params.append('category', 'Housing Cooperative');
          } else if (typeof value === 'boolean') {
            params.append(key, value.toString()); // Convert booleans to "true"/"false" strings
          } else if (key === 'priceMax' || key === 'sizeMin' || key === 'sizeMax' || key === 'roomsMin' || key === 'roomsMax') {
            params.append(key, String(value)); // Ensure numbers are strings
          }
          else {
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
    setFilters(prev => ({ ...prev, location: initialLocation }));
    // Fetch rooms with the initial location
    fetchRooms({ ...filters, location: initialLocation });
  }, [location.search, fetchRooms]); // Depend on location.search and fetchRooms


  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      // Potentially update URL here as well
      const params = new URLSearchParams();
      Object.entries(newFilters).forEach(([filterKey, filterValue]) => {
        if (filterValue !== '' && filterValue !== false && filterValue !== null) {
          if (typeof filterValue === 'boolean') {
            params.append(filterKey, filterValue.toString());
          } else if (filterKey === 'priceMax' || filterKey === 'sizeMin' || filterKey === 'sizeMax' || filterKey === 'roomsMin' || filterKey === 'roomsMax') {
            params.append(filterKey, String(filterValue));
          }
          else {
            params.append(filterKey, filterValue as string);
          }
        }
      });
      navigate(`?${params.toString()}`, { replace: true }); // Update URL without navigating
      return newFilters;
    });
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRooms(filters); // Trigger fetch with current filters
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
    navigate(`/browse`, { replace: true }); // Clear URL parameters
    fetchRooms(defaultFilters);
  };

  const getPartyCount = (room: Room) => {
    return room.shareable && room.partyApplications ? room.partyApplications.length : 0;
  };

  return (
    <section className="container mx-auto max-w-7xl px-6 py-8 md:py-10">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full md:w-1/4 lg:w-1/5 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md flex-shrink-0 sticky top-20 h-fit"> {/* sticky for easier use */}
          <h2 className={title({ size: "sm" })}>Filters</h2>
          <form onSubmit={handleApplyFilters} className="flex flex-col gap-4 mt-4">
            {/* Location Search */}
            <Input
              type="text"
              label="Location (City/Area)"
              placeholder="e.g., Copenhagen"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              startContent={<SearchIcon className="text-default-400" />}
            />

            {/* Category */}
            <Select
              label="Category"
              placeholder="Select a category"
              selectedKeys={[filters.category]}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                handleFilterChange('category', selectedKey);
              }}
              // You might need to adjust HeroUI Select's props for single value
            >
              {CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>

            {/* Price (Max) */}
            <Input
              type="number"
              label="Max Price"
              placeholder="e.g., 5000"
              value={filters.priceMax === '' ? '' : filters.priceMax.toString()}
              onChange={(e) => handleFilterChange('priceMax', e.target.value === '' ? '' : Number(e.target.value))}
            />

            {/* Size (sq.m) */}
            <h3 className="font-semibold text-medium">Size (m²)</h3>
            <div className="flex gap-2">
              <Input
                type="number"
                label="Min"
                placeholder="Min size"
                value={filters.sizeMin === '' ? '' : filters.sizeMin.toString()}
                onChange={(e) => handleFilterChange('sizeMin', e.target.value === '' ? '' : Number(e.target.value))}
              />
              <Input
                type="number"
                label="Max"
                placeholder="Max size"
                value={filters.sizeMax === '' ? '' : filters.sizeMax.toString()}
                onChange={(e) => handleFilterChange('sizeMax', e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            {/* Number of Rooms (min, max) */}
            <h3 className="font-semibold text-medium">Number of Rooms</h3>
            <div className="flex gap-2">
              <Input
                type="number"
                label="Min"
                placeholder="Min rooms"
                value={filters.roomsMin === '' ? '' : filters.roomsMin.toString()}
                onChange={(e) => handleFilterChange('roomsMin', e.target.value === '' ? '' : Number(e.target.value))}
              />
              <Input
                type="number"
                label="Max"
                placeholder="Max rooms"
                value={filters.roomsMax === '' ? '' : filters.roomsMax.toString()}
                onChange={(e) => handleFilterChange('roomsMax', e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            {/* Minimum Rental Period */}
            <Select
              label="Rental Period"
              placeholder="Select period"
              selectedKeys={[filters.rentalPeriod]}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                handleFilterChange('rentalPeriod', selectedKey);
              }}
            >
              {RENTAL_PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>

            {/* Takeover Date - Consider DatePicker if HeroUI has one */}
            {/* <Input
              type="date"
              label="Takeover Date"
              placeholder="YYYY-MM-DD"
              value={filters.takeoverDate}
              onChange={(e) => handleFilterChange('takeoverDate', e.target.value)}
            /> */}

            {/* Lifestyle */}
            <h3 className="font-semibold text-medium mt-4">Lifestyle</h3>
            <Checkbox
              isSelected={filters.petFriendly}
              onChange={(e) => handleFilterChange('petFriendly', e.target.checked)}
            >
              Pet-friendly
            </Checkbox>
            <Checkbox
              isSelected={filters.seniorFriendly}
              onChange={(e) => handleFilterChange('seniorFriendly', e.target.checked)}
            >
              Senior-friendly
            </Checkbox>
            <Checkbox
              isSelected={filters.studentsOnly}
              onChange={(e) => handleFilterChange('studentsOnly', e.target.checked)}
            >
              Students Only
            </Checkbox>
            <Checkbox
              isSelected={filters.shareable}
              onChange={(e) => handleFilterChange('shareable', e.target.checked)}
            >
              Shareable
            </Checkbox>
            <Checkbox
              isSelected={filters.socialHousing}
              onChange={(e) => handleFilterChange('socialHousing', e.target.checked)}
            >
              Social Housing
            </Checkbox>

            {/* Facilities */}
            <h3 className="font-semibold text-medium mt-4">Facilities</h3>
            <Checkbox
              isSelected={filters.parking}
              onChange={(e) => handleFilterChange('parking', e.target.checked)}
            >
              Parking
            </Checkbox>
            <Checkbox
              isSelected={filters.elevator}
              onChange={(e) => handleFilterChange('elevator', e.target.checked)}
            >
              Elevator
            </Checkbox>
            <Checkbox
              isSelected={filters.balcony}
              onChange={(e) => handleFilterChange('balcony', e.target.checked)}
            >
              Balcony
            </Checkbox>
            <Checkbox
              isSelected={filters.electricChargingStation}
              onChange={(e) => handleFilterChange('electricChargingStation', e.target.checked)}
            >
              Electric Charging Station
            </Checkbox>

            {/* Inventory */}
            <h3 className="font-semibold text-medium mt-4">Inventory</h3>
            <Checkbox
              isSelected={filters.furnished}
              onChange={(e) => handleFilterChange('furnished', e.target.checked)}
            >
              Furnished
            </Checkbox>
            <Checkbox
              isSelected={filters.dishwasher}
              onChange={(e) => handleFilterChange('dishwasher', e.target.checked)}
            >
              Dishwasher
            </Checkbox>
            <Checkbox
              isSelected={filters.washingMachine}
              onChange={(e) => handleFilterChange('washingMachine', e.target.checked)}
            >
              Washing Machine
            </Checkbox>
            <Checkbox
              isSelected={filters.dryer}
              onChange={(e) => handleFilterChange('dryer', e.target.checked)}
            >
              Dryer
            </Checkbox>

            <Button type="submit" color="primary" className="mt-6">
              Apply Filters
            </Button>
            <Button type="button" variant="flat" onPress={handleClearFilters}>
              Clear Filters
            </Button>
          </form>
        </aside>

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
                          <span className="text-lg">🎉</span> {/* Party emoji */}
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