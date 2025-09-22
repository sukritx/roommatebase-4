import React, { useState, useEffect } from 'react';
import { title, subtitle } from '@/components/primitives';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from '@heroui/link';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter
} from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Textarea } from '@heroui/input'; // Assuming HeroUI has a Textarea
import {
  Select,
  SelectItem
} from '@heroui/select'; // Assuming HeroUI has Select
import { Switch } from '@heroui/switch'; // Assuming HeroUI has Switch
import { userApi } from '@/services/api'; // Assuming you have an API service for user profile updates
import { Avatar } from '@heroui/avatar'; // For profile picture

export default function AccountPage() {
  // --- CHANGE HERE: Destructure checkAuthStatus instead of fetchUser ---
  const { user, loading, isAuthenticated, checkAuthStatus } = useAuth(); // checkAuthStatus to refresh user data
  
  // State for all editable profile fields
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState<number | ''>(''); // Allow empty string for number inputs
  const [gender, setGender] = useState(''); // Keep as string for select input
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [budget, setBudget] = useState<number | ''>(''); // Allow empty string for number inputs
  const [preferredRoommateGender, setPreferredRoommateGender] = useState(''); // Keep as string for select input
  const [interests, setInterests] = useState<string[]>([]); // Stored as a string for now, comma-separated
  const [isSmoker, setIsSmoker] = useState(false);
  const [hasPet, setHasPet] = useState(false);
  const [occupation, setOccupation] = useState('');
  const [profilePicture, setProfilePicture] = useState(''); // Assuming a URL string

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Effect to populate form fields when user data loads or changes
  useEffect(() => {
    if (isAuthenticated && user) {
      setUsername(user.username || '');
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setAge(user.age === null || user.age === undefined ? '' : user.age); // Handle null/undefined age
      setGender(user.gender || '');
      setLocation(user.location || '');
      setBio(user.bio || '');
      setBudget(user.budget === null || user.budget === undefined ? '' : user.budget); // Handle null/undefined budget
      setPreferredRoommateGender(user.preferredRoommateGender || '');
      setInterests(Array.isArray(user.interests) ? user.interests : []);
      setIsSmoker(user.isSmoker || false);
      setHasPet(user.hasPet || false);
      setOccupation(user.occupation || '');
      setProfilePicture(user.profilePicture || '');
    }
  }, [isAuthenticated, user]);

  // Render loading state
  if (loading) {
    return <div className="text-center py-10">Loading account details...</div>;
  }

  // Render access denied if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="text-center py-10">
        <h1 className={title({ color: 'red' })}>Access Denied</h1>
        <p className={subtitle({ class: 'mt-2' })}>
          Please <Link href="/login">login</Link> to view your account settings.
        </p>
      </div>
    );
  }

  // Handle profile update form submission
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Construct the data payload, filtering out empty strings for enum fields
    // and correctly handling number fields that might be empty
    const updateData: Record<string, any> = {
      username,
      firstName,
      lastName,
      age: age === '' ? null : Number(age), // Send null for empty age
      location,
      bio,
      budget: budget === '' ? null : Number(budget), // Send null for empty budget
      interests,
      isSmoker,
      hasPet,
      occupation,
      profilePicture,
    };

    // Conditionally add gender only if it has a non-empty value
    if (gender && gender !== '') {
      updateData.gender = gender;
    } else {
      // If gender is explicitly set to empty, it implies clearing it if not required.
      // For enums, if it's not present, the backend will typically leave it unchanged.
      // If you want to explicitly unset it, the backend needs specific logic for $unset.
      // For now, omitting it is the safest if it's not a required field.
      // delete updateData.gender; // Uncomment if you want to explicitly remove if empty
    }

    // Conditionally add preferredRoommateGender only if it has a non-empty value
    if (preferredRoommateGender && preferredRoommateGender !== '') {
      updateData.preferredRoommateGender = preferredRoommateGender;
    } else {
      // delete updateData.preferredRoommateGender; // Uncomment if you want to explicitly remove if empty
    }

    try {
      const response = await userApi.updateProfile(updateData);
      setMessage({ type: 'success', text: response.message || 'Profile updated successfully!' });
      // --- CHANGE HERE: Call checkAuthStatus instead of fetchUser ---
      await checkAuthStatus(); // Refresh user data in context to show latest info
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile.';
      setMessage({ type: 'error', text: errorMessage });
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle interests input changes, splitting by comma
  const handleInterestsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInterests(e.target.value.split(',').map(s => s.trim()).filter(s => s !== ''));
  };

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">

      {message && (
        <div
          className={`p-3 rounded-lg text-sm w-full max-w-2xl text-center mt-4 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <Card className="w-full max-w-2xl mt-8 p-6">
        <CardBody>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="flex flex-col items-center gap-4 mb-8">
              <Avatar
                src={profilePicture || user?.profilePicture || "https://i.pravatar.cc/150?u=a042581f4e29026704d"}
                className="w-24 h-24 text-large"
                name={user?.firstName || user?.username || 'User'}
              />
              <Input
                label="Profile Picture URL"
                placeholder="Enter image URL"
                value={profilePicture}
                onValueChange={setProfilePicture} // Use onValueChange for HeroUI Input
              />
            </div>

            <Input
              label="Username"
              placeholder="Enter your username"
              value={username}
              onValueChange={setUsername}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                placeholder="Enter your first name"
                value={firstName}
                onValueChange={setFirstName}
              />
              <Input
                label="Last Name"
                placeholder="Enter your last name"
                value={lastName}
                onValueChange={setLastName}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Age"
                placeholder="Enter your age"
                type="number"
                value={age === '' ? '' : String(age)} // Convert number to string for input
                onValueChange={(val) => setAge(val === '' ? '' : Number(val))}
                min={0}
              />
              <Select
                label="Gender"
                placeholder="Select your gender"
                // selectedKeys expects an array of strings.
                // If `gender` is an empty string, pass an empty array to show no selection.
                selectedKeys={gender ? [gender] : []}
                onSelectionChange={(keys) => {
                    const selectedValue = Array.from(keys).join('');
                    setGender(selectedValue);
                }}
              >
                <SelectItem key="Male" value="Male">Male</SelectItem>
                <SelectItem key="Female" value="Female">Female</SelectItem>
                <SelectItem key="Other" value="Other">Other</SelectItem>
              </Select>
            </div>
            <Input
              label="Location"
              placeholder="Enter your city/region"
              value={location}
              onValueChange={setLocation}
            />
            <Textarea
              label="Bio"
              placeholder="Tell us about yourself"
              value={bio}
              onValueChange={setBio}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Budget (per month)"
                placeholder="Enter your budget"
                type="number"
                value={budget === '' ? '' : String(budget)} // Convert number to string for input
                onValueChange={(val) => setBudget(val === '' ? '' : Number(val))}
                startContent={<span className="text-default-400 text-small">$</span>}
                min={0}
              />
              <Select
                label="Preferred Roommate Gender"
                placeholder="Select preference"
                selectedKeys={preferredRoommateGender ? [preferredRoommateGender] : []}
                onSelectionChange={(keys) => {
                    const selectedValue = Array.from(keys).join('');
                    setPreferredRoommateGender(selectedValue);
                }}
              >
                <SelectItem key="Male" value="Male">Male</SelectItem>
                <SelectItem key="Female" value="Female">Female</SelectItem>
                <SelectItem key="Other" value="Other">Other</SelectItem>
                <SelectItem key="Any" value="Any">Any</SelectItem>
              </Select>
            </div>
            <Input
              label="Interests (comma-separated)"
              placeholder="e.g., hiking, reading, cooking"
              value={interests.join(', ')} // Display array as comma-separated string
              onChange={handleInterestsChange} // Use onChange for standard HTML input event
            />
            <Input
              label="Occupation"
              placeholder="Enter your occupation"
              value={occupation}
              onValueChange={setOccupation}
            />
            <div className="flex justify-between items-center">
              <label>Smoker?</label>
              <Switch isSelected={isSmoker} onValueChange={setIsSmoker} />
            </div>
            <div className="flex justify-between items-center">
              <label>Has Pet?</label>
              <Switch isSelected={hasPet} onValueChange={setHasPet} />
            </div>

            <CardFooter className="flex justify-end gap-2 pt-4">
              <Button type="submit" color="primary" isLoading={isLoading}>
                Update Profile
              </Button>
            </CardFooter>
          </form>
        </CardBody>
      </Card>
    </section>
  );
}