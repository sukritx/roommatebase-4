import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import DefaultLayout from '@/layouts/default';
import { title, subtitle } from '@/components/primitives';
import { Image } from '@heroui/image'; // Assuming HeroUI Image component
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card'; // Assuming HeroUI Card components
import { Button } from '@heroui/button';
import { Spacer } from '@heroui/spacer'; // For spacing
import { useAuth } from '@/contexts/AuthContext';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal'; // For paywall modal
import { Link } from '@heroui/link'; // For links in modals

// Updated Room Interface to match schema more closely and include backend response flags
interface Room {
  _id: string;
  title: string;
  description: string;
  images: string[];
  streetAddress: string;
  buildingName?: string;
  apartmentDetails?: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
  price: number;
  currency: string;
  size: number; // in square meters
  rooms: number;
  bathrooms: number;
  floor?: number;
  furnished: boolean;
  shareable: boolean; // Will be false for anonymous users from backend
  rentalPeriod: string;
  availableFrom: string;
  availableDate?: string; // Date string
  deposit: number;
  prepaidRent: number;
  utilities: number;

  // Lifestyle & Facilities
  petsAllowed: boolean;
  elevator: boolean;
  seniorFriendly: boolean;
  studentsOnly: boolean;
  balcony: boolean;
  parking: boolean;
  dishwasher: boolean;
  washingMachine: boolean;
  electricChargingStation: boolean;
  dryer: boolean;
  energyRating?: string;

  owner: {
    _id: string;
    name: string;
    profilePicture?: string;
    totalListings?: number;
    userType: 'User' | 'Institution';
  };
  relatedRooms: Room[];

  // Flags from backend's getRoomById response (for frontend logic)
  canContact: boolean; // Based on isAuthenticated
  canJoinParty: boolean; // Based on isAuthenticated && room.shareable
  isFavorite: boolean; // Based on isAuthenticated
  contactOptionDisplayed: boolean; // True if phone number is available/visible
  authRequired?: { // Provided for anonymous users
    forContact?: boolean;
    forParties?: boolean;
    forFavorites?: boolean;
    forDetailedParties?: boolean;
  };
  contactInfo?: {
    phone?: string | null;
    canCallDirectly?: boolean;
  };
  metadata: {
    viewCount: number;
    createdAt: string;
    lastUpdated: string;
  };
  // partyApplications will be empty [] for anonymous, or simplified/populated for auth'd users
  // depending on backend response, we mainly care about its count for display.
  partyApplications?: any[];
  maxPartyMembers?: number; // From Room schema
}

const DESCRIPTION_MAX_LENGTH = 300;

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user, checkAuthStatus } = useAuth();
  const navigate = useNavigate();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [modalContent, setModalContent] = useState({ title: '', message: '', type: '' });
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // State for description truncation
  const [showFullDescription, setShowFullDescription] = useState(false);


  // Memoize fetchRoom to ensure its reference is stable unless its own dependencies change
  const fetchRoom = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_BASE_URL}/rooms/${id}`, { headers });
      setRoom(res.data);
      if (isAuthenticated) {
        await checkAuthStatus();
      }
    } catch (err: any) {
      if (err.response?.status === 402 && err.response?.data?.requiresPayment) {
        setModalContent({
          title: 'Upgrade Required',
          message: err.response.data.message || 'You have reached your free browsing limit. Please upgrade to continue viewing rooms.',
          type: 'upgrade',
        });
        onOpen(); // Call onOpen here directly
      } else if (err.response?.status === 401 && err.response?.data?.requiresAuth) {
        setModalContent({
          title: 'Login Required',
          message: err.response.data.message || 'Please login to access this feature.',
          type: 'login',
        });
        onOpen(); // Call onOpen here directly
      } else {
        setError(err.response?.data?.message || 'Failed to load room details.');
        console.error("Error fetching room details:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated, checkAuthStatus, API_BASE_URL, onOpen]); // onOpen stays here as fetchRoom depends on it
  // onOpen itself is stable from useDisclosure, but fetchRoom is defined inside the component,
  // so if it uses onOpen, onOpen MUST be in its own dependency array.


  useEffect(() => {
    if (id) {
      fetchRoom();
    }
  }, [id, fetchRoom]);

  const getPartyCount = (room: Room) => {
    // Check if shareable is true from backend for authenticated users
    // For anonymous, backend will set shareable to false
    return room.shareable && room.partyApplications ? room.partyApplications.length : 0;
  };

  const handleContactClick = () => {
    if (!isAuthenticated) {
      setModalContent({
        title: 'Login Required',
        message: 'Please login to contact the landlord.',
        type: 'login',
      });
      onOpen();
    } else if (room?.contactOptionDisplayed && room.contactInfo?.phone) {
        // User is authenticated AND landlord's number is displayed (meaning user is paid or is owner)
        alert(`You can call the landlord at: ${room.contactInfo.phone}`);
    } else {
        // User is authenticated but not paid, so no phone number. Direct to message feature.
        // Assuming /messages/:ownerId is for direct messages
        navigate(`/messages/${room?.owner._id}`); // Direct to message landlord
        alert('Navigating to message interface.');
    }
  };


  const handleJoinPartyClick = () => {
    if (!isAuthenticated) {
      setModalContent({
        title: 'Login Required',
        message: 'Please login to view and join parties.',
        type: 'login',
      });
      onOpen();
    } else if (room?.shareable) { // Only proceed if room is shareable (checked by backend for auth users)
       // For authenticated users, parties are available.
       // Navigate to the parties section or dedicated party page for this room.
       alert('Navigating to party section for this room.');
       navigate(`/rooms/${id}/parties`); // You'll need to create this route and page
    }
  };


  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      setModalContent({
        title: 'Login Required',
        message: 'Please login to add rooms to your favorites.',
        type: 'login',
      });
      onOpen();
      return;
    }
    try {
      if (room?.isFavorite) {
        await axios.delete(`${API_BASE_URL}/rooms/${id}/favorite`);
        setRoom(prev => prev ? { ...prev, isFavorite: false } : null);
      } else {
        await axios.post(`${API_BASE_URL}/rooms/${id}/favorite`);
        setRoom(prev => prev ? { ...prev, isFavorite: true } : null);
      }
    } catch (err) {
      console.error("Failed to update favorite status", err);
      setError("Failed to update favorite status.");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">Loading room details...</div>
    );
  }

  // Handle case where an error occurred and no room data loaded, OR room is explicitly null
  if (error || !room) {
    return (
      <DefaultLayout>
        <div className="text-center py-10 text-red-500">{error || "Room not found."}</div>
        {/* Render modal if triggered by error (401/402) */}
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">{modalContent.title}</ModalHeader>
                <ModalBody>
                  <p>{modalContent.message}</p>
                  {modalContent.type === 'login' && (
                    <p className="text-sm text-default-500">
                      Please <Link onPress={() => navigate('/login')} className="text-primary cursor-pointer">login</Link> or <Link onPress={() => navigate('/register')} className="text-primary cursor-pointer">sign up</Link> to access this feature.
                    </p>
                  )}
                </ModalBody>
                <ModalFooter>
                  {modalContent.type === 'upgrade' ? (
                    <Button color="primary" onPress={() => { navigate('/pricing'); onClose(); }}>
                      Upgrade Now
                    </Button>
                  ) : ( // For 'login' type or generic errors leading to login
                    <Button color="primary" onPress={() => { navigate('/login'); onClose(); }}>
                      Login / Sign Up
                    </Button>
                  )}
                  <Button variant="light" onPress={onClose}>
                    Close
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </DefaultLayout>
    );
  }

  const isDescriptionLong = room.description.length > DESCRIPTION_MAX_LENGTH;
  const displayDescription = showFullDescription || !isDescriptionLong
    ? room.description
    : `${room.description.substring(0, DESCRIPTION_MAX_LENGTH)}...`;

  // Main Room Display
  return (
    <section className="py-8 md:py-10">
      <div className="max-w-4xl mx-auto">
        {/* Main Room Image/Gallery */}
        {room.images && room.images.length > 0 ? (
          <Image
            src={room.images[0]}
            alt={room.title}
            width={800}
            height={500}
            className="rounded-lg shadow-lg object-cover w-full h-auto max-h-[500px]"
          />
        ) : (
          <div className="w-full h-[300px] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500">
            No Image Available
          </div>
        )}
        <Spacer y={4} />

        <div className="flex justify-between items-start">
          <div>
            <h1 className={title({ size: "lg" })}>{room.title}</h1>
            <p className={subtitle({ class: "mt-2" })}>
              {room.streetAddress}{room.apartmentDetails ? `, ${room.apartmentDetails}` : ''}, {room.city}, {room.country}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={title({ size: "sm" })}>
              {room.currency} {room.price.toLocaleString()}
            </span>
            <span className="text-default-500">/month</span>
            <Button
              variant="flat"
              color={room.isFavorite ? "danger" : "default"}
              onClick={handleFavoriteClick}
              isDisabled={!room.canContact} // Disable if anonymous, as per authRequired.forFavorites
            >
              {room.isFavorite ? "Favorited" : "Add to Favorites"}
            </Button>
            {!room.canContact && room.authRequired?.forFavorites && (
                <p className="text-xs text-default-400">Login to favorite</p>
            )}
          </div>
        </div>
        <Spacer y={4} />

        {/* Room Info Cards */}
        <Card className="p-4">
          <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
            <h4 className="font-bold text-large">Description</h4>
          </CardHeader>
          <CardBody className="overflow-visible py-2">
            <p>
              {displayDescription}
              {isDescriptionLong && (
                <Button
                  size="sm"
                  variant="light"
                  className="ml-2 p-0 h-auto min-w-0"
                  onPress={() => setShowFullDescription(!showFullDescription)}
                >
                  {showFullDescription ? "Show less" : "Read more"}
                </Button>
              )}
            </p>
          </CardBody>
        </Card>
        <Spacer y={4} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
              <h4 className="font-bold text-large">About Property</h4>
            </CardHeader>
            <CardBody className="overflow-visible py-2 text-default-600">
              <p><strong>Category:</strong> {room.category}</p>
              <p><strong>Size:</strong> {room.size} m²</p>
              <p><strong>Rooms:</strong> {room.rooms}</p>
              <p><strong>Bathrooms:</strong> {room.bathrooms}</p>
              <p><strong>Floor:</strong> {room.floor || 'N/A'}</p>
              <p><strong>Furnished:</strong> {room.furnished ? "Yes" : "No"}</p>
              <p><strong>Shareable:</strong> {room.shareable ? "Yes" : "No"}</p>
              {/* Lifestyle & Facilities */}
              <h5 className="font-semibold text-small mt-3">Lifestyle & Facilities:</h5>
              {room.petsAllowed && <p>• Pets Allowed</p>}
              {room.elevator && <p>• Elevator</p>}
              {room.seniorFriendly && <p>• Senior Friendly</p>}
              {room.studentsOnly && <p>• Students Only</p>}
              {room.balcony && <p>• Balcony</p>}
              {room.parking && <p>• Parking</p>}
              {room.dishwasher && <p>• Dishwasher</p>}
              {room.washingMachine && <p>• Washing Machine</p>}
              {room.electricChargingStation && <p>• Electric Charging Station</p>}
              {room.dryer && <p>• Dryer</p>}
              {room.energyRating && room.energyRating !== '-' && <p>• Energy Rating: {room.energyRating}</p>}

            </CardBody>
          </Card>

          <Card className="p-4">
            <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
              <h4 className="font-bold text-large">Rental Information</h4>
            </CardHeader>
            <CardBody className="overflow-visible py-2 text-default-600">
              <p><strong>Monthly Price:</strong> {room.currency} {room.price.toLocaleString()}</p>
              <p><strong>Utilities:</strong> {room.currency} {room.utilities.toLocaleString()}</p>
              <p><strong>Deposit:</strong> {room.currency} {room.deposit.toLocaleString()}</p>
              <p><strong>Prepaid Rent:</strong> {room.currency} {room.prepaidRent.toLocaleString()}</p>
              {/* Assuming calculatedMoveInPrice is available from backend or calculated on frontend */}
              {/* <p><strong>Calculated Move-in Price:</strong> {room.currency} {room.calculatedMoveInPrice?.toLocaleString()}</p> */}
              <p><strong>Rental Period:</strong> {room.rentalPeriod}</p>
              <p><strong>Available From:</strong> {room.availableFrom}</p>
              {room.availableDate && room.availableFrom === 'Specific Date' && <p> ({new Date(room.availableDate).toLocaleDateString()})</p>}
            </CardBody>
          </Card>
        </div>
        <Spacer y={4} />

        {/* Contact and Party Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Contact Landlord Button */}
            <Button
              color="primary"
              size="lg"
              onPress={handleContactClick}
              isDisabled={!room.canContact && !room.authRequired?.forContact} // Disable if not contactable AND not just requires login
            >
              {room.canContact ? "Contact Landlord" : "Login to Contact"}
            </Button>

            {/* Display phone number if authorized */}
            {room.contactOptionDisplayed && room.contactInfo?.phone && (
                <div className="flex items-center gap-2">
                    <span className="text-default-600 font-semibold">Phone:</span>
                    <span className="text-primary-600">{room.contactInfo.phone}</span>
                </div>
            )}
            {!room.canContact && room.authRequired?.forContact && (
                <p className="text-sm text-default-400 mt-2 text-center sm:hidden">Login to see contact options</p>
            )}

            {/* View / Join Party Button */}
            {room.shareable && ( // Only show button if room is actually shareable (backend flag)
                <Button
                  color="secondary"
                  size="lg"
                  onPress={handleJoinPartyClick}
                  isDisabled={!room.canJoinParty && !room.authRequired?.forParties} // Disable if not joinable AND not just requires login
                >
                  {room.canJoinParty ? `View / Join Party (${getPartyCount(room)} Parties)` : "Login to View Parties"}
                </Button>
            )}
            {!room.canJoinParty && room.authRequired?.forParties && room.shareable && (
                <p className="text-sm text-default-400 mt-2 text-center sm:hidden">Login to view/join parties</p>
            )}
        </div>
        <Spacer y={8} />

        {/* Related Rooms Section */}
        <div>
          <h2 className={title({ size: "md" })}>More Homes in {room.city}</h2>
          <Spacer y={4} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {room.relatedRooms.map((r) => (
              <Card
                key={r._id}
                isPressable
                onPress={() => navigate(`/rooms/${r._id}`)}
                className="pb-4"
              >
                <CardBody className="overflow-visible p-0">
                  <Image
                    shadow="sm"
                    radius="lg"
                    width="100%"
                    alt={r.title}
                    className="w-full object-cover h-[140px]"
                    src={r.images[0] || "https://via.placeholder.com/300"}
                  />
                </CardBody>
                <CardFooter className="text-small justify-between flex-col items-start pt-2 px-4">
                  <b className="font-semibold">{r.title}</b>
                  <p className="text-default-500 text-sm">{r.city}, {r.country}</p>
                  <p className="text-lg font-bold mt-1">
                    {r.currency} {r.price.toLocaleString()}
                  </p>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
      {/* Paywall/Login Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">{modalContent.title}</ModalHeader>
              <ModalBody>
                <p>{modalContent.message}</p>
                {modalContent.type === 'login' && (
                  <p className="text-sm text-default-500">
                    Please <Link onPress={() => navigate('/login')} className="text-primary cursor-pointer">login</Link> or <Link onPress={() => navigate('/register')} className="text-primary cursor-pointer">sign up</Link> to access this feature.
                  </p>
                )}
              </ModalBody>
              <ModalFooter>
                {modalContent.type === 'upgrade' ? (
                  <Button color="primary" onPress={() => { navigate('/pricing'); onClose(); }}>
                    Upgrade Now
                  </Button>
                ) : ( // For 'login' type or generic errors leading to login
                  <Button color="primary" onPress={() => { navigate('/login'); onClose(); }}>
                    Login / Sign Up
                  </Button>
                )}
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </section>
  );
}