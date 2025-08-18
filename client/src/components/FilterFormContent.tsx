// client/src/components/FilterFormContent.tsx

import React from 'react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Checkbox } from '@heroui/checkbox';
import { Select, SelectItem } from "@heroui/select";
import { SearchIcon } from '@/components/icons';
// title is not used here, can be removed if not used elsewhere in this file
// import { title } from '@/components/primitives';


// --- Re-defining these types/options directly in this component for clarity ---
// (Alternatively, you can create a `client/src/types/filters.ts` and import from there)

interface Filters {
  city: string; // Changed from location
  state: string; // New field
  zipCode: string; // New field
  country: string; // New field
  category: string;
  priceMax: number | '';
  sizeMin: number | '';
  sizeMax: number | '';
  roomsMin: number | '';
  roomsMax: number | '';
  rentalPeriod: string;
  takeoverDate: string; // This needs to be a Date type if truly used as date, or string for input
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
// --- End Re-definitions ---


// Correctly type the functional component:
interface FilterFormContentProps {
  onClear: () => void;
  onApply: (e?: React.FormEvent) => void;
  filtersData: Filters;
  onFilterChangeData: (key: keyof Filters, value: any) => void;
}

const FilterFormContent: React.FC<FilterFormContentProps> = ({ onClear, onApply, filtersData, onFilterChangeData }) => (
  <form onSubmit={onApply} className="flex flex-col gap-4">
    {/* Changed from 'location' to 'city' */}
    <Input
      type="text"
      label="City"
      placeholder="e.g., Copenhagen"
      value={filtersData.city}
      onChange={(e) => onFilterChangeData('city', e.target.value)}
      startContent={<SearchIcon className="text-default-400" />}
    />
    <Input
      type="text"
      label="State/Region (Optional)"
      placeholder="e.g., Capital Region"
      value={filtersData.state}
      onChange={(e) => onFilterChangeData('state', e.target.value)}
    />
    <Input
      type="text"
      label="Zip Code (Optional)"
      placeholder="e.g., 1000"
      value={filtersData.zipCode}
      onChange={(e) => onFilterChangeData('zipCode', e.target.value)}
    />
    <Input
      type="text"
      label="Country"
      placeholder="e.g., Denmark"
      value={filtersData.country}
      onChange={(e) => onFilterChangeData('country', e.target.value)}
    />
    <Select
      label="Category"
      placeholder="Select a category"
      selectedKeys={[filtersData.category]}
      onSelectionChange={(keys) => {
        const selectedKey = Array.from(keys)[0] as string;
        onFilterChangeData('category', selectedKey);
      }}
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
        value={filtersData.roomsMax === '' ? '' : filtersData.roomsMax.toString()}
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
    {/* Takeover Date is present in the interface but no input field. If needed, add an Input type="date" */}
    {/* Example:
    <Input
        type="date"
        label="Available From (Takeover Date)"
        placeholder="Select date"
        value={filtersData.takeoverDate}
        onChange={(e) => onFilterChangeData('takeoverDate', e.target.value)}
    />
    */}

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
      Social Housing (Housing Cooperative)
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

export default FilterFormContent;