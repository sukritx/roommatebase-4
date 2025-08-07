// client/src/components/FilterFormContent.tsx

import React from 'react'; // Don't forget to import React
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Checkbox } from '@heroui/checkbox';
import { Select, SelectItem } from "@heroui/select";
import { SearchIcon } from '@/components/icons';
import { title } from '@/components/primitives'; // Not strictly needed here, but kept for consistency

// Assume Filters, CATEGORY_OPTIONS, RENTAL_PERIOD_OPTIONS are imported from a shared constants/types file
// Or you can re-define them here if they are truly only for this component.
// For now, let's assume a shared file or we will define them right here.
// Re-defining them directly within this file is safer if they are specific to these filters.

// --- Re-defining these types/options directly in this component for clarity ---
// (Alternatively, you can create a `client/src/types/filters.ts` and import from there)

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

export default FilterFormContent;