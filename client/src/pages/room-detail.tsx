import React, { useEffect, useState } from 'react';
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

interface Room {
  _id: string;
  title: string;
  description: string;
  images: string[];
  city: string;
  country: string;
  price: number;
  currency: string;
  size: number;
  rooms: number;
  bathrooms: number;
  furnished: boolean;
  shareable: boolean;
  owner: {
    _id: string;
    name: string;
    profilePicture?: string;
    totalListings?: number;
    userType: 'User' | 'Institution';
  };
  relatedRooms: Room[];
  // From backend's getRoomById response:
  isAuthenticated?: boolean;
  isFavorite?: boolean;
  canContact?: boolean;
  canJoinParty?: boolean;
  authRequired?: {
    forContact: boolean;
    forParties: boolean;
    forFavorites: boolean;
  };
  contactInfo?: {
    phone?: string;
    canCallDirectly?: boolean;
  };
  metadata: {
    viewCount: number;
    createdAt: string;
    lastUpdated: string;
  };
  // Add other room fields as needed
}

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user, checkAuthStatus } = useAuth(); // checkAuthStatus to refresh user quota after view
  const navigate = useNavigate();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${API_BASE_URL}/rooms/${id}`, { headers });
        setRoom(res.data);
        // After successfully fetching, refresh user's quota status
        if (isAuthenticated) {
          await checkAuthStatus();
        }
      } catch (err: any) {
        if (err.response?.status === 402 && err.response?.data?.requiresPayment) {
          setModalContent({
            title: 'Upgrade Required',
            message: err.response.data.message || 'You have reached your free browsing limit. Please upgrade to continue viewing rooms.',
          });
          onOpen();
        } else if (err.response?.status === 401 && err.response?.data?.requiresAuth) {
          setModalContent({
            title: 'Login Required',
            message: err.response.data.message || 'Please login to continue viewing rooms.',
          });
          onOpen(); // Open modal to prompt login/signup
          setError(err.response?.data?.message || 'Login required.');
        } else {
          setError(err.response?.data?.message || 'Failed to load room details.');
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRoom();
    }
  }, [id, isAuthenticated, checkAuthStatus, API_BASE_URL]);

  const handleContactClick = () => {
    if (!isAuthenticated) {
      setModalContent({
        title: 'Login Required',
        message: 'Please login to contact the landlord.',
      });
      onOpen();
    } else {
      // Implement contact logic (e.g., open direct message chat, show phone number)
      if (room?.contactInfo?.canCallDirectly && room.contactInfo.phone) {
        alert(`You can call the landlord at: ${room.contactInfo.phone}`);
      } else {
        alert('Opening message interface (not yet implemented)');
        // navigate(`/messages/new/${room?.owner._id}`); // Example for direct messaging
      }
    }
  };

  const handleJoinPartyClick = () => {
    if (!isAuthenticated) {
      setModalContent({
        title: 'Login Required',
        message: 'Please login to view and join parties.',
      });
      onOpen();
    } else if (user && !user.isPaid && room?.canJoinParty) {
       // Logic to check if user needs to pay to join party.
       // This can be part of paywall if needed or simply navigating to party section.
       alert('Navigating to party section (not yet implemented)');
       // navigate(`/rooms/${id}/parties`);
    }
  };

  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      setModalContent({
        title: 'Login Required',
        message: 'Please login to add rooms to your favorites.',
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
      <DefaultLayout>
        <div className="text-center py-10">Loading room details...</div>
      </DefaultLayout>
    );
  }

  if (error && !room) {
    return (
      <DefaultLayout>
        <div className="text-center py-10 text-red-500">{error}</div>
        <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">{modalContent.title}</ModalHeader>
                <ModalBody>
                  <p>{modalContent.message}</p>
                </ModalBody>
                <ModalFooter>
                  {modalContent.title === 'Upgrade Required' ? (
                    <Button color="primary" onPress={() => { navigate('/pricing'); onClose(); }}>
                      Upgrade Now
                    </Button>
                  ) : (
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

  if (!room) {
    return (
      <DefaultLayout>
        <div className="text-center py-10">Room not found.</div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <section className="py-8 md:py-10">
        <div className="max-w-4xl mx-auto">
          {/* Main Room Image/Gallery */}
          {room.images && room.images.length > 0 ? (
            <Image
              src={room.images[0]} // Display first image
              alt={room.title}
              width={800} // Adjust as needed
              height={500} // Adjust as needed
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
                {room.streetAddress}, {room.city}, {room.country}
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
              >
                {room.isFavorite ? "Favorited" : "Add to Favorites"}
              </Button>
            </div>
          </div>
          <Spacer y={4} />

          <Card className="p-4">
            <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
              <h4 className="font-bold text-large">Description</h4>
            </CardHeader>
            <CardBody className="overflow-visible py-2">
              <p>{room.description}</p>
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
                <p><strong>Furnished:</strong> {room.furnished ? "Yes" : "No"}</p>
                <p><strong>Shareable:</strong> {room.shareable ? "Yes" : "No"}</p>
                {/* Add more property details */}
              </CardBody>
            </Card>

            <Card className="p-4">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <h4 className="font-bold text-large">Rental Information</h4>
              </CardHeader>
              <CardBody className="overflow-visible py-2 text-default-600">
                <p><strong>Monthly Price:</strong> {room.currency} {room.price.toLocaleString()}</p>
                <p><strong>Deposit:</strong> {room.currency} {room.deposit.toLocaleString()}</p>
                <p><strong>Prepaid Rent:</strong> {room.currency} {room.prepaidRent.toLocaleString()}</p>
                <p><strong>Utilities:</strong> {room.currency} {room.utilities.toLocaleString()}</p>
                {/* Add move-in price if you want to display the virtual */}
                {/* <p><strong>Calculated Move-in Price:</strong> {room.currency} {room.calculatedMoveInPrice?.toLocaleString()}</p> */}
                <p><strong>Rental Period:</strong> {room.rentalPeriod}</p>
                {room.availableDate && <p><strong>Available From:</strong> {new Date(room.availableDate).toLocaleDateString()}</p>}
                {/* Add more rental details */}
              </CardBody>
            </Card>
          </div>
          <Spacer y={4} />

          {/* Contact and Party Buttons */}
          <div className="flex gap-4 justify-center">
            <Button color="primary" size="lg" onPress={handleContactClick}>
              Contact Landlord
            </Button>
            {room.shareable && (
              <Button color="secondary" size="lg" onPress={handleJoinPartyClick}>
                View / Join Party
              </Button>
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
      </section>

      {/* Paywall/Login Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">{modalContent.title}</ModalHeader>
              <ModalBody>
                <p>{modalContent.message}</p>
                {modalContent.title === 'Login Required' && (
                  <p className="text-sm text-default-500">
                    Please <Link onPress={() => navigate('/login')} className="text-primary cursor-pointer">login</Link> or <Link onPress={() => navigate('/register')} className="text-primary cursor-pointer">sign up</Link> to access this feature.
                  </p>
                )}
              </ModalBody>
              <ModalFooter>
                {modalContent.title === 'Upgrade Required' ? (
                  <Button color="primary" onPress={() => { navigate('/pricing'); onClose(); }}>
                    Upgrade Now
                  </Button>
                ) : (
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
    </DefaultLayout>
  );
}