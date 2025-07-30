import React from 'react';
import DefaultLayout from '@/layouts/default';
import { title, subtitle } from '@/components/primitives';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from '@heroui/link';
import { Card, CardHeader, CardBody } from '@heroui/card';
import {Button, ButtonGroup} from "@heroui/button";

export default function DashboardPage() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="text-center py-10">Loading dashboard...</div>
    );
  }

  // If not authenticated, redirect to login (or home)
  if (!isAuthenticated) {
    return (
      <div className="text-center py-10">
        <h1 className={title({ color: "red" })}>Access Denied</h1>
        <p className={subtitle({ class: "mt-2" })}>Please <Link href="/login">login</Link> to view your dashboard.</p>
      </div>
    );
  }

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <h1 className={title({ size: "lg" })}>
        Welcome,{" "}
        <span className={title({ size: "lg", color: "violet" })}>
          {user?.firstName || user?.username}!
        </span>
      </h1>
      <p className={subtitle({ class: "mt-2" })}>
        This is your{" "}
        {user?.isRoomOwner ? "Landlord Dashboard" : "User Dashboard"}.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl mt-8">
        {user?.isRoomOwner ? (
          <>
            {/* Landlord Specific Dashboard Cards */}
            <Card className="p-4">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <h4 className="font-bold text-large">My Listings</h4>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
                <p>Manage your properties.</p>
                <Button as={Link} href="/landlord/listings" className="mt-4">View Listings</Button>
              </CardBody>
            </Card>
            <Card className="p-4">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <h4 className="font-bold text-large">Applications</h4>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
                <p>Review tenant applications.</p>
                <Button as={Link} href="/landlord/applications" className="mt-4">View Applications</Button>
              </CardBody>
            </Card>
            <Card className="p-4">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <h4 className="font-bold text-large">My Parties</h4>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
                <p>Manage parties for your rooms.</p>
                <Button as={Link} href="/landlord/parties" className="mt-4">View Parties</Button>
              </CardBody>
            </Card>
            {/* Add more landlord specific cards (e.g., analytics, payments) */}
          </>
        ) : (
          <>
            {/* Regular User Specific Dashboard Cards */}
            <Card className="p-4">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <h4 className="font-bold text-large">My Favorites</h4>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
                <p>Browse your saved rooms.</p>
                <Button as={Link} href="/favorites" className="mt-4">View Favorites</Button>
              </CardBody>
            </Card>
            <Card className="p-4">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <h4 className="font-bold text-large">My Applications</h4>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
                <p>Track your room applications.</p>
                <Button as={Link} href="/my-applications" className="mt-4">View Applications</Button>
              </CardBody>
            </Card>
            <Card className="p-4">
              <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                <h4 className="font-bold text-large">My Party</h4>
              </CardHeader>
              <CardBody className="overflow-visible py-2">
                <p>View your joined party.</p>
                <Button as={Link} href="/my-party" className="mt-4">View Party</Button>
              </CardBody>
            </Card>
            {/* Add more user specific cards (e.g., messages, profile settings) */}
          </>
        )}
      </div>

      <p className="text-default-500 mt-8">Your subscription status: {user?.isPaid ? "Paid" : "Free"}</p>
      {user?.isPaid && user.paidUntil && (
        <p className="text-default-500">Paid until: {new Date(user.paidUntil).toLocaleDateString()}</p>
      )}
      {!user?.isPaid && (
        <p className="text-default-500">Free quota used: {user?.freeQuotaUsed} / 3 views</p>
      )}
      {!user?.isPaid && (user?.isRoomOwner && user?.listedRooms.length >=1 ) ? (
         <p className="text-default-500">You have used your free listing. <Link href="/pricing" color="primary">Upgrade to list more!</Link></p>
      ) : (
        <p className="text-default-500">You can list {user?.isRoomOwner ? `1 free room (or unlimited if paid)` : 'no rooms'}.</p>
      )}


    </section>
  );
}