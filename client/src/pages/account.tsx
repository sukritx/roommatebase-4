import React, { useState, useEffect } from 'react';
import { title, subtitle } from '@/components/primitives';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from '@heroui/link';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
} from '@heroui/card'; // Make sure Divider is exported from your @heroui/card or similar
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Textarea } from '@heroui/input';
import {
  Select,
  SelectItem
} from '@heroui/select';
import { Switch } from '@heroui/switch';
import { Divider } from '@heroui/divider';
import { userApi } from '@/services/api';
import { Avatar } from '@heroui/avatar';

export default function AccountPage() {
  const { user, loading, isAuthenticated, checkAuthStatus } = useAuth();
  
  // State for personal profile fields
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [budget, setBudget] = useState<number | ''>('');
  const [preferredRoommateGender, setPreferredRoommateGender] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [isSmoker, setIsSmoker] = useState(false);
  const [hasPet, setHasPet] = useState(false);
  const [occupation, setOccupation] = useState('');
  const [profilePicture, setProfilePicture] = useState('');

  // States for Contact Information
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Effect to populate form fields when user data loads or changes
  useEffect(() => {
    if (isAuthenticated && user) {
      setUsername(user.username || '');
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setAge(user.age === null || user.age === undefined ? '' : user.age);
      setGender(user.gender || '');
      setLocation(user.location || '');
      setBio(user.bio || '');
      setBudget(user.budget === null || user.budget === undefined ? '' : user.budget);
      setPreferredRoommateGender(user.preferredRoommateGender || '');
      setInterests(Array.isArray(user.interests) ? user.interests : []);
      setIsSmoker(user.isSmoker || false);
      setHasPet(user.hasPet || false);
      setOccupation(user.occupation || '');
      setProfilePicture(user.profilePicture || '');

      // Populate Contact Information states from user.contact (first element assumed)
      const userContact = user.contact && user.contact.length > 0 ? user.contact[0] : {};
      setFacebook(userContact.facebook || '');
      setInstagram(userContact.instagram || '');
      setTwitter(userContact.twitter || '');
      setWhatsapp(userContact.whatsapp || '');
      setPhoneNumber(userContact.phoneNumber || '');
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

    // Construct the data payload with all profile and contact fields
    const updateData: Record<string, any> = {
      username,
      firstName,
      lastName,
      age: age === '' ? null : Number(age),
      location,
      bio,
      budget: budget === '' ? null : Number(budget),
      interests,
      isSmoker,
      hasPet,
      occupation,
      profilePicture,
      // Include contact fields in the main update payload
      facebook,
      instagram,
      twitter,
      whatsapp,
      phoneNumber,
    };

    // Conditionally add enum fields only if they have a non-empty value
    if (gender && gender !== '') {
      updateData.gender = gender;
    }
    if (preferredRoommateGender && preferredRoommateGender !== '') {
      updateData.preferredRoommateGender = preferredRoommateGender;
    }

    try {
      const response = await userApi.updateProfile(updateData);
      setMessage({ type: 'success', text: response.message || 'Profile updated successfully!' });
      await checkAuthStatus(); // Refresh user data in context to show latest info
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update profile.';
      setMessage({ type: 'error', text: errorMessage });
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle interests input changes
  const handleInterestsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInterests(e.target.value.split(',').map(s => s.trim()).filter(s => s !== ''));
  };

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <h1 className={title({ size: 'lg' })}>
        Account <span className={title({ size: 'lg', color: 'violet' })}>Settings</span>
      </h1>
      <p className={subtitle({ class: 'mt-2' })}>
        Manage your personal information and preferences.
      </p>

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
            {/* --- Profile Picture & Basic Info Section --- */}
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
                onValueChange={setProfilePicture}
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
                value={age === '' ? '' : String(age)}
                onValueChange={(val) => setAge(val === '' ? '' : Number(val))}
                min={0}
              />
              <Select
                label="Gender"
                placeholder="Select your gender"
                selectedKeys={gender ? [gender] : []}
                onSelectionChange={(keys) => setGender(Array.from(keys).join(''))}
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
                value={budget === '' ? '' : String(budget)}
                onValueChange={(val) => setBudget(val === '' ? '' : Number(val))}
                startContent={<span className="text-default-400 text-small">$</span>}
                min={0}
              />
              <Select
                label="Preferred Roommate Gender"
                placeholder="Select preference"
                selectedKeys={preferredRoommateGender ? [preferredRoommateGender] : []}
                onSelectionChange={(keys) => setPreferredRoommateGender(Array.from(keys).join(''))}
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
              value={interests.join(', ')}
              onChange={handleInterestsChange}
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

            {/* --- Contact Information Section --- */}
            <Divider className="my-8" />
            <h2 className={subtitle({ class: "text-lg font-semibold mb-4" })}>Contact Information</h2>
            
            <Input
              label="Phone Number"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onValueChange={setPhoneNumber}
            />
            <Input
              label="Facebook Profile URL"
              placeholder="e.g., https://facebook.com/yourprofile"
              value={facebook}
              onValueChange={setFacebook}
            />
            <Input
              label="Instagram Profile URL"
              placeholder="e.g., https://instagram.com/yourprofile"
              value={instagram}
              onValueChange={setInstagram}
            />
            <Input
              label="Twitter Profile URL"
              placeholder="e.g., https://twitter.com/yourprofile"
              value={twitter}
              onValueChange={setTwitter}
            />
            <Input
              label="WhatsApp Number"
              placeholder="Enter your WhatsApp number"
              value={whatsapp}
              onValueChange={setWhatsapp}
            />
            {/* --- End Contact Information Section --- */}

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